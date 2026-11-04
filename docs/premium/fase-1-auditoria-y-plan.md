# Tienda premium · Fase 1 (auditoría) y Fase 2 (plan)

Fecha: 4 de noviembre de 2026. Punto de partida: `main` en el commit `cb74fc6` (PR #29).

Este documento responde al "prompt maestro" de rediseño. La conclusión principal es que
**Emirate Scents no necesita una aplicación nueva**: ya tiene casi todo lo que pide el prompt.
El trabajo útil es pulir la identidad visual, completar las piezas que faltan (filtro por género,
páginas de confianza, SEO) y preparar el catálogo para los datos que el negocio aún no ha dado.

---

## Fase 1 · Auditoría

### Tecnologías (verificadas en el código)

| Parte              | Tecnología                                                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tienda (`client/`) | React 19.3 + Vite + TypeScript + Tailwind CSS v4 + Motion (LazyMotion) + React Router 8 + Zustand (carrito y favoritos) + React Hook Form + Zod                |
| Escenas 3D         | three.js + React Three Fiber + drei, cargadas aparte solo en la galería de pedestales y la pirámide olfativa                                                   |
| API (`server/`)    | Express 5 + Prisma 7 + PostgreSQL + Zod; sesiones de administrador con Argon2id y cookie HttpOnly                                                              |
| Pruebas            | Vitest (cliente y API), Playwright de punta a punta (34 pruebas, incluye accesibilidad con axe), CI en cada PR (`.github/workflows/pruebas.yml`)               |
| Publicación        | GitHub Pages (vista previa sin base de datos, `tienda-pages.yml`); API + panel + base de datos preparados para Railway (`docs/rediseno/fase-8-publicacion.md`) |

### Lo que ya funciona (se conserva)

- **Catálogo real de 57 lociones** (39 árabes con foto oficial recortada, 18 equivalencias con
  frasco ilustrado), precios del Canva sin tocar.
- **Buscador** (panel en el header y en el catálogo), **filtros** por marca, tamaño, familia y
  precio, **orden** por destacados, novedades, precio y nombre, **paginación**, estados de carga,
  vacío ("Muy pronto") y error.
- **Tarjetas** con imagen, marca, nombre, precio, disponibilidad, botón Agregar, favorito y
  enlace al detalle.
- **Ficha de producto** con galería, tamaño, concentración y notas _solo si existen_, cantidad,
  agregar al carrito, pedir por WhatsApp y productos relacionados.
- **Carrito** persistente (guarda solo `productId` y cantidad), cambiar cantidades, eliminar,
  subtotal, validación de stock y **mensaje de WhatsApp ordenado** con productos, cantidades,
  precios y subtotal ("estimado": nunca dice que el pedido está pagado o confirmado).
- Número de WhatsApp real en una sola configuración: `client/src/config/brand.ts`.
- **Panel administrativo real** en `/admin` (no simulado): productos (crear, editar, retirar),
  subir fotos desde el computador con vista previa, precios y precio anterior, inventario con
  historial, destacados, búsqueda y filtro de inventario, alerta de stock bajo, pedidos.
- Animaciones con Motion que respetan `prefers-reduced-motion`, 3D con plan B sin WebGL.

### Problemas y oportunidades

| #   | Hallazgo                                                                                                                                                                                                                                                                                   | Impacto                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| 1   | La paleta actual es muy cercana a la pedida, pero no igual (negro `#0E0C0A`/`#080808`, oro `#C9A54E`, crema `#F7F1E6`) y no existe el grafito `#292929`. Hay tonos extra (oud, ámbar, rubí) que dispersan la identidad.                                                                    | Medio                                         |
| 2   | La portada muestra **tres** frascos (Amber Oud, Khamrah, Shaheen Gold). El prompt pide un protagonista: Khamrah (`AR-0009`, está en el catálogo real con foto oficial).                                                                                                                    | Alto (primera impresión)                      |
| 3   | Los botones de la portada son "Explorar fragancias" y "Ver perfumes árabes"; el prompt pide "Explorar colección" y "Descubrir perfumes".                                                                                                                                                   | Bajo                                          |
| 4   | **No hay filtro por género** (Hombres / Mujeres / Unisex): el modelo de datos tiene el campo `audience`, pero ninguno de los 57 productos lo tiene relleno y la API no lo filtra.                                                                                                          | Alto para navegación, depende de datos        |
| 5   | "Diseñador" y "Nicho" están en el menú con 0 productos (todas esas lociones se publicaron como equivalencias). Ya está pendiente la pregunta al dueño.                                                                                                                                     | Medio                                         |
| 6   | "Más vendidos", "Ofertas" y "Nuevos lanzamientos" no tienen datos reales: no hay ventas registradas, ni descuentos, ni productos marcados como nuevos. Hoy esas secciones se ocultan solas (correcto).                                                                                     | Ninguno ahora; hay que dejar las rutas listas |
| 7   | No hay orden por **relevancia** al buscar (se ordena por destacados).                                                                                                                                                                                                                      | Medio                                         |
| 8   | Faltan páginas de confianza: **Envíos, Cambios y devoluciones, Autenticidad, Contacto / Sobre nosotros**. Solo existen Preguntas frecuentes (en la portada) y la política de datos (con datos del dueño pendientes).                                                                       | Alto para un cliente real                     |
| 9   | SEO: la imagen de Open Graph es relativa (las redes sociales no la leen), falta `og:description`, `og:url`, `canonical`, Twitter Card y datos estructurados (`Organization`, `Product` con precio real).                                                                                   | Medio                                         |
| 10  | Fotos: las 39 árabes son oficiales y verificadas (`docs/catalogo/inventario-fotos.csv`), pero **Nitro Red, Yum Yum y Bharara Rose** quedan por revisar (fuente pequeña o render). Las 18 equivalencias usan frasco ilustrado (decisión tomada: nada de fotos del original sin aprobación). | Medio                                         |
| 11  | Faltan datos de producto que el Canva no trae: **ml, concentración, notas, género, descripción**. La ficha los oculta en vez de inventarlos (correcto), pero se ve pobre.                                                                                                                  | Alto, solo lo resuelve el dueño               |
| 12  | Rendimiento: el JS inicial pesa 138 KB gzip; el 3D (262 KB gzip) se descarga aparte y solo cerca de su sección. Aceptable, pero el 3D sigue siendo lo más pesado de la portada.                                                                                                            | Bajo                                          |
| 13  | En el panel, una "promoción" hoy es solo el precio anterior (`compareAtPrice`) por producto. No hay campañas con fechas.                                                                                                                                                                   | Bajo (no hay promociones reales todavía)      |

---

## Fase 2 · Plan

Cada fase es una rama y un PR. **Hacer merge = aprobar la fase.** Nada se publica en Pages hasta
el merge.

### 3A · Identidad visual y portada

- Ajustar la paleta en `client/src/index.css` al pedido: negro `#111111`, oro `#C6A15B`
  (solo acentos), crema `#F5F0E6`, grafito `#292929`; reducir los tonos extra. Se revisa el
  contraste (texto dorado sobre crema sigue usando el oro oscuro para cumplir WCAG AA).
- Portada con **Khamrah como protagonista** (foto oficial ya recortada), luz cálida, entrada
  suave; botones **"Explorar colección"** → `/catalogo` y **"Descubrir perfumes"** → la galería.
  Archivos: `features/home/HeroSection.tsx`, `HeroShowcase.tsx`, `content/home.ts`,
  `content/hero-bottles.json`.
- Diseño móvil de la portada pensado para celular (frasco arriba, texto corto, botones de 48 px).

### 3B · Catálogo y navegación

- Filtro por **género** en la API (`server/src/services/catalogService.ts`) y en la tienda
  (`features/catalog/*`), que solo aparece cuando hay productos con ese dato.
- Accesos **Hombres / Mujeres / Unisex / Nuevos / Más vendidos / Ofertas** en el menú: se
  muestran solo si tienen productos reales (sin páginas vacías). Las rutas quedan listas.
- Orden **"Relevancia"** al buscar.
- Revisión fina de tarjetas (proporción uniforme, hover sutil, botón accesible).

### 3C · Ficha, carrito y WhatsApp

- Ficha más editorial con lo que existe (marca, precio, disponibilidad, aviso de equivalencia) y
  espacios que aparecen solos cuando el dueño cargue ml, concentración y notas.
- WhatsApp: campo opcional "Tu nombre" en el carrito para incluirlo en el mensaje.

### 3D · Confianza y SEO

- Páginas **Envíos, Cambios y devoluciones, Autenticidad, Contacto** con la estructura lista y
  los datos que faltan marcados como "pendiente de confirmar" (no se inventan políticas).
- Open Graph absoluto, `canonical`, Twitter Card, datos estructurados `Organization` y `Product`
  (solo precio, marca y disponibilidad reales).

### 3E · Validación y entrega

- Compilación, Vitest, Playwright (incluye accesibilidad), capturas en 5 anchos (360, 414,
  768, 1280, 1536), consola sin errores. Informe final con archivos, pruebas, pendientes y
  pasos para ejecutar y publicar.

### Lo que **no** se hará (y por qué)

- No se reescribe la aplicación ni se cambia de framework: lo existente funciona y está probado.
- No se agregan dependencias nuevas salvo que una fase lo justifique.
- No se usan fotos del perfume original en las equivalencias (decisión ya tomada).
- No se rellenan "Más vendidos" u "Ofertas" con productos elegidos al azar.
- El panel ya tiene backend real; solo se ajusta su paleta. Las campañas de promoción con
  fechas se proponen para cuando existan promociones reales.

### Lo que falta del negocio (bloquea partes, no el rediseño)

1. Por producto: **género, ml, concentración**, notas y descripción (plantilla:
   `docs/catalogo/lociones-canva.csv`).
2. ¿Hay perfumes **originales** de diseñador o nicho, o todo es equivalencia?
3. Condiciones de **envío**, **cambios y devoluciones** y datos de la política de datos
   (razón social, NIT, domicilio, correo).
4. Mejores fotos de Nitro Red, Yum Yum y Bharara Rose (o fotos propias).
5. Publicar API + panel en Railway (`docs/rediseno/fase-8-publicacion.md`).
