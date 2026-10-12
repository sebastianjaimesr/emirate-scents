# Rediseño Emirate Scents · Fase 1: auditoría y plan

Fecha: 12 de octubre de 2026. Revisé el repositorio `sebastianjaimesr/emirate-scents` (rama `main`,
último cambio: PR #8, vista previa en GitHub Pages) y ejecuté todas sus comprobaciones.

**En una frase:** la tienda no se empieza de cero. Ya tiene una base sólida (React + API +
PostgreSQL + 121 pruebas automáticas en verde). El rediseño añade tres cosas encima: la
experiencia 3D y de scroll, el panel administrativo con inicio de sesión real y el control de
inventario. Nada de lo que funciona se elimina.

---

## 1. Cómo está construido hoy

### 1.1 Tecnologías (versiones instaladas)

| Parte         | Tecnología                                      | Versión                    |
| ------------- | ----------------------------------------------- | -------------------------- |
| Interfaz      | React + React DOM                               | 19.3.0                     |
| Lenguaje      | TypeScript                                      | 6.0                        |
| Compilador    | Vite                                            | 8.3                        |
| Estilos       | Tailwind CSS                                    | 4.3                        |
| Animaciones   | Motion for React (`motion/react`, LazyMotion)   | 14.1                       |
| Rutas         | React Router                                    | 8.4                        |
| Estado        | Zustand (carrito y favoritos en el navegador)   | 5.0                        |
| Formularios   | React Hook Form + Zod                           | 7.90 / 4.6                 |
| API           | Node 22 + Express + Zod                         | Express 5.3                |
| Base de datos | PostgreSQL + Prisma ORM (con migraciones)       | Prisma 7.10                |
| Seguridad API | helmet, express-rate-limit, CORS, pino (logs)   |                            |
| Pruebas       | Vitest (unitarias y API), Playwright (e2e+a11y) | Vitest 5 / Playwright 1.64 |
| Calidad       | oxlint, Prettier                                |                            |

Es un **monorepo con npm workspaces**: `client/` (la tienda) y `server/` (la API), con
`e2e/` para las pruebas en navegador y `docs/` para la documentación de cada fase.

### 1.2 Páginas de la tienda (`client/src/app/router.tsx`)

| Ruta                    | Qué hace                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                     | Inicio: hero, categorías, recomendados, manifiesto, novedades, más vendidos, familias olfativas, pasos del pedido, preguntas frecuentes |
| `/catalogo/:categoria?` | Catálogo con búsqueda (ignora tildes), filtros, orden y paginación                                                                      |
| `/producto/:slug`       | Ficha: galería, notas olfativas, disponibilidad, relacionados                                                                           |
| `/favoritos`            | Favoritos guardados en el navegador                                                                                                     |
| `/carrito`              | Carrito (también hay carrito lateral animado)                                                                                           |
| `/pedido`               | Formulario de pedido con validación y consentimiento de datos                                                                           |
| `/pedido/confirmacion`  | Número de pedido + botón para enviarlo por WhatsApp                                                                                     |
| `/politica-de-datos`    | Política de tratamiento de datos (borrador, faltan tus datos)                                                                           |
| `*`                     | Página no encontrada                                                                                                                    |

Catálogo, ficha, pedido y política se cargan bajo demanda (el inicio pesa menos).

### 1.3 API (`server/src/routes/index.ts`)

| Endpoint                             | Para qué                                           |
| ------------------------------------ | -------------------------------------------------- |
| `GET /api/health`                    | Comprobación de salud para el hosting              |
| `GET /api/products`                  | Listado con filtros y paginación                   |
| `GET /api/products/:slug`            | Detalle (solo publicados)                          |
| `GET /api/products/:slug/related`    | Relacionados                                       |
| `GET /api/catalog/filters`           | Opciones de filtros con conteos                    |
| `GET /api/catalog/highlights/:kind`  | Recomendados, novedades, más vendidos              |
| `GET /api/catalog/lookup`            | Varios productos por id (carrito y favoritos)      |
| `GET /api/categories`, `/api/brands` | Categorías y marcas                                |
| `POST /api/orders`                   | Registra un pedido (límite: 10 cada 15 min por IP) |

Ya cumple varias reglas que pides: **el servidor recalcula precios y totales** con la base de
datos, **ignora precios enviados por el navegador**, comprueba existencias, guarda **copia del
precio y nombre** en cada línea del pedido (`OrderItem`) y todo ocurre en una **transacción**.

### 1.4 Base de datos (`server/prisma/schema.prisma`)

Ya existen: `Category`, `Brand`, `Product`, `ProductImage`, `Order`, `OrderItem`.
Restricciones en PostgreSQL: precio ≥ 0, stock ≥ 0, tamaño > 0, cantidades > 0, SKU y slug únicos.
Un producto que aparece en pedidos no se puede borrar sin perder la referencia (`SetNull`), y
marca y categoría están protegidas contra borrado (`Restrict`).

Estados actuales del producto: `BORRADOR`, `PUBLICADO`, `ARCHIVADO`.
Estados actuales del pedido: `PENDIENTE_CONFIRMACION`, `CONFIRMADO`, `ENVIADO`, `ENTREGADO`, `CANCELADO`.

### 1.5 Cómo se construye y se publica

- **Desarrollo:** `npm run dev` levanta la API (puerto 4000) y la tienda (5173) a la vez.
- **Producción prevista (Fase 8 anterior):** un solo servicio Node que sirve la tienda compilada
  y la API en el mismo dominio, con PostgreSQL al lado. Guía: `docs/fase-8-produccion.md`
  (Railway recomendado). **Todavía no está publicado en ningún hosting.**
- **Lo que ves hoy en `sebastianjaimesr.github.io/emirate-scents/`** es una **vista previa
  estática**: un workflow de GitHub Actions compila la tienda en modo `preview`, sin API. Los
  productos son los 16 DEMO incrustados en el navegador y los pedidos están desactivados.

### 1.6 Resultado de las comprobaciones (ejecutadas hoy)

| Comprobación                                                     | Resultado               |
| ---------------------------------------------------------------- | ----------------------- |
| `npm run lint`                                                   | Sin errores             |
| `npm run typecheck`                                              | Sin errores             |
| `npm run build`                                                  | Correcto (tienda y API) |
| Pruebas unitarias de la tienda                                   | 30 de 30                |
| Pruebas de la API (PostgreSQL 16)                                | 45 de 45                |
| Playwright (escritorio y celular, incluye accesibilidad con axe) | 46 de 46                |

Tamaño del JavaScript inicial: ~92 KB comprimido (más ~27 KB del motor de animaciones, que se
descarga después de mostrar la página).

---

## 2. Diagnóstico

### 2.1 Lo que funciona y se conserva

- Identidad visual: paleta negro/dorado/crema/marfil, tipografías Cormorant Garamond + Manrope,
  arco árabe como motivo, logo oficial.
- Catálogo completo con búsqueda, filtros, orden, paginación y URLs compartibles.
- Carrito y favoritos persistentes, carrito lateral animado.
- Pedido con validación, cálculo en el servidor, número de pedido y envío a WhatsApp.
- Pedidos que **no** se marcan confirmados al enviarlos a WhatsApp (quedan pendientes).
- Seguridad base: cabeceras helmet con política de contenido, límites anti-abuso, errores
  sin datos sensibles, variables de entorno validadas al arrancar.
- Respeto de "reducir movimiento", navegación por teclado, sin problemas de accesibilidad
  detectados por axe.
- Importador del catálogo desde CSV y vista previa en GitHub Pages.

### 2.2 Lo que falta (lo que pides y no existe)

| Falta                               | Situación actual                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| Experiencia 3D                      | No hay Three.js. El hero es SVG + logo con parallax de Motion                     |
| Vitrina horizontal ligada al scroll | No existe                                                                         |
| Panel `/admin`                      | No existe. Hoy el catálogo solo se cambia con el CSV o Prisma Studio              |
| Inicio de sesión de administrador   | No hay usuarios, sesiones ni contraseñas                                          |
| Movimientos de inventario           | Solo existe el número `stock`; nadie lo descuenta ni hay historial                |
| Umbral de stock bajo                | No existe el campo                                                                |
| Estado "En preparación"             | Falta en los estados del pedido                                                   |
| Carga de imágenes                   | Las imágenes son rutas dentro de `client/public`; no hay subida ni almacenamiento |
| Indicadores del negocio             | No existe dashboard                                                               |

### 2.3 Limitaciones y riesgos que encontré

1. **No hay ninguna fotografía de producto.** En el repositorio solo está el logo. Todas las
   tarjetas muestran "Imagen próximamente". La vitrina horizontal y el hero dependen mucho de
   buenas fotos: sin ellas se verán vacíos. Es lo más importante que necesito de ti (sección 5).
2. **No hay modelos 3D (GLB/GLTF).** La botella del hero será un modelo sencillo y genérico
   creado por código, sin etiqueta ni marca, que no representa ningún producto real.
3. **El catálogo es DEMO** (16 productos "Casa DEMO …", 3 marcados como recomendados). La vitrina
   los usará, con la etiqueta DEMO visible, hasta que cargues el catálogo real.
4. **GitHub Pages no puede ejecutar la API ni guardar datos.** El panel administrativo nunca
   funcionará solo en GitHub Pages. Además, el inicio de sesión seguro (con cookie protegida)
   no funciona bien si la tienda está en `github.io` y la API en otro dominio: los navegadores
   bloquean esas cookies entre sitios distintos. Por eso el panel se servirá desde Railway (sección 3.6).
5. **El stock nunca se descuenta.** Hoy el pedido comprueba existencias pero no las reserva ni
   las descuenta. Si dos personas piden la última unidad, ambos pedidos quedan registrados.
   Se corrige en la Fase 7 (sección 3.5).
6. **React 19.3 y React Three Fiber:** la versión actual de R3F (9.8) acepta React desde 19.0 hasta
   antes de 19.4. Somos compatibles, pero fijaré React en `~19.3` para que una actualización
   automática no rompa la escena 3D.
7. **Política de contenido (CSP):** Drei descarga por defecto fondos HDR y decodificadores desde
   CDNs externos. La política de seguridad actual lo bloquearía (y está bien que lo haga). Todo lo
   3D se servirá desde el propio dominio.
8. **No puedo abrir desde mi entorno** tu Instagram, el enlace de Canva ni la página publicada (la
   red los bloquea). Trabajé con el logo y la documentación del proyecto. Si me compartes
   capturas del diseño de Canva, las sigo.

---

## 3. Decisiones técnicas

### 3.1 Animación: un solo sistema (Motion), sin GSAP

Ya usamos Motion en toda la tienda. Motion hace animaciones ligadas al scroll (`useScroll`,
`useTransform`) que **avanzan al bajar y retroceden al subir de forma natural**, porque la
posición de cada elemento se calcula directamente a partir del progreso del scroll, no se
"dispara".

No añadiré GSAP + ScrollTrigger porque:

- tendríamos **dos motores de animación** haciendo lo mismo (pediste evitarlo);
- su "pin" mueve el HTML por su cuenta y choca con la forma en que React actualiza la página;
- pesaría ~45 KB más sin aportar algo que Motion no haga.

Tampoco añadiré "scroll suave" artificial (Lenis): el scroll nativo es más accesible y no
roba el control al usuario.

### 3.2 3D: React Three Fiber + Drei solo en el hero

- **Librerías:** `three` 0.186, `@react-three/fiber` 9.8, `@react-three/drei` 10.7 (compatibles con
  React 19.3).
- **Un solo `<Canvas>`**, solo en el hero. La vitrina usa fotos en HTML (más rápido, mejor para
  Google, enlaces y lectores de pantalla).
- **Botella generada por código** (perfil torneado + tapa dorada), vidrio con reflejos, luz
  cinematográfica con paneles de luz virtuales (sin descargar fondos HDR), sombra de contacto y
  partículas doradas discretas.
- **Movimiento:** flotación sutil, giro leve siguiendo el cursor en escritorio, y rotación y
  cámara ligadas al progreso del scroll (en ambos sentidos).
- **Rendimiento:**
  - el código 3D (~250 KB comprimido, estimado) se descarga **después** de mostrar el texto del hero;
  - la escena se pausa cuando sale de la pantalla y se liberan sus recursos al salir de la página;
  - resolución limitada en pantallas de alta densidad;
  - en celulares, menos partículas y sin sombras costosas.
- **Plan B automático:** si el navegador no tiene WebGL, si la escena falla, o si el sistema pide
  "reducir movimiento", se muestra la composición actual (arcos + logo), que ya es elegante.
  El texto y los botones nunca dependen del 3D.

### 3.3 Vitrina "The Fragrance Collection"

- **Técnica:** una sección alta con un contenedor `position: sticky` (fijado con CSS nativo). Mientras
  bajas, Motion convierte el progreso vertical en desplazamiento horizontal de la fila. Al subir,
  retrocede. Al terminar la sección, la página sigue sola. No hay bloqueo del scroll: si haces
  scroll rápido, sales de la sección sin esfuerzo.
- **Duración:** proporcional al número de perfumes (unos 60 % de la altura de pantalla por botella).
- **Profundidad:** cada botella con escala, inclinación y sombra distintas según su posición
  respecto al centro, reflejo en el piso y una barra de progreso de la colección.
- **Cada botella es un enlace** a su ficha, con nombre, marca y precio.
- **Celulares y "reducir movimiento":** carrusel horizontal nativo que se desliza con el dedo
  (con puntos de anclaje), sin fijar la página.
- **Qué productos:** los marcados como "destacados" en el catálogo (hasta 8–10).

### 3.4 Panel administrativo

- **Misma aplicación, mundo separado:** `/admin` tiene su propio diseño y menú, sin header ni footer
  de la tienda. Su código se descarga **solo** al entrar en `/admin`; un cliente nunca lo carga.
  No aparece en menús, en el mapa del sitio ni en Google (`noindex`).
- **Seguridad en el servidor, no en React:**
  - contraseñas con **Argon2id** (el algoritmo recomendado hoy);
  - sesión en una **cookie `HttpOnly`, `Secure`, `SameSite=Strict`** (el JavaScript de la página no
    puede leerla); la sesión se guarda en la base de datos para poder cerrarla y caducarla;
  - caduca tras 2 horas sin actividad y como máximo a las 12 horas;
  - **cada endpoint `/api/admin/*` comprueba la sesión**; ocultar botones no cuenta como seguridad;
  - protección contra peticiones falsificadas desde otros sitios (comprobación de `Origin`);
  - **5 intentos de acceso cada 15 minutos** por IP y por correo, con el mismo mensaje genérico
    ("correo o contraseña incorrectos") pase lo que pase;
  - **primer administrador:** un comando `npm run admin:crear` que pide correo y contraseña en tu
    terminal. Ninguna contraseña queda escrita en el código ni en el repositorio.
- **Imágenes:** subida real (JPG, PNG o WebP; máximo 8 MB), comprobación del tipo real del archivo,
  conversión automática a WebP en varios tamaños. Los archivos van a un **almacenamiento compatible
  con S3** (por ejemplo Cloudflare R2, con 10 GB gratis) y la base de datos solo guarda la
  dirección. En tu computador se guardan en una carpeta local.
- **Eliminar productos:** si el producto tiene pedidos, no se borra: se **archiva** (deja de verse en
  la tienda y los pedidos históricos siguen intactos). Solo se borra definitivamente un producto
  sin pedidos ni movimientos.

### 3.5 Inventario y pedidos

- **Historial de movimientos** (`InventoryMovement`): producto, cantidad (+/−), tipo (entrada,
  ajuste, venta, devolución por cancelación), motivo, fecha, administrador, existencias resultantes.
  **Solo se puede añadir, nunca editar ni borrar:** la base de datos rechaza cualquier intento
  (regla en PostgreSQL, no solo en el código). Un error se corrige con un ajuste nuevo.
- **Cuándo se descuenta el stock (propuesta):** al pasar el pedido a **Confirmado**, que haces tú
  explícitamente en el panel después de hablar con el cliente por WhatsApp. Motivo: muchos clientes
  abren WhatsApp y no envían el mensaje; descontar al crear el pedido dejaría stock "atrapado".
- **Sin doble descuento:** el pedido guarda la fecha en que se descontó; cambiar de "Confirmado" a
  "En preparación" o "Enviado" no vuelve a descontar. Si se **cancela** un pedido ya descontado, las
  unidades vuelven al inventario con un movimiento de "devolución".
- **Nunca por debajo de cero, incluso con dos confirmaciones a la vez:** el descuento es una sola
  instrucción en la base de datos ("resta 2 _solo si_ quedan al menos 2"), dentro de una transacción.
  Si no alcanza, la confirmación falla con un mensaje claro y nada cambia. Además, PostgreSQL ya
  rechaza cualquier stock negativo.
- **Nuevo estado** "En preparación" entre Confirmado y Enviado, y registro de quién cambió cada
  estado y cuándo (sirve también para "actividad reciente" del dashboard).

### 3.6 Publicación: elegiste tienda en GitHub Pages + API y panel en Railway

Lo elegiste el 12 de octubre de 2026 (opción B). Así queda:

```
Clientes → sebastianjaimesr.github.io/emirate-scents/   (tienda, GitHub Pages)
                 │  catálogo y pedidos por HTTPS (CORS)
                 ▼
           servicio Node en Railway ── /api/...  la API
                 │                  └─ /admin    el panel (mismo dominio que la API)
                 ├── PostgreSQL (Railway)
                 └── imágenes (almacenamiento compatible con S3)
```

- **La tienda sigue en `github.io`.** El workflow de Pages dejará de publicar la vista previa DEMO y
  compilará la tienda real con `VITE_API_URL` apuntando a la API de Railway. La tienda solo hace
  peticiones públicas (catálogo y pedidos), sin cookies, así que CORS basta.
- **El panel se sirve desde Railway, en el mismo dominio que la API.** Así la cookie de sesión del
  administrador es del propio dominio (`SameSite=Strict`) y los navegadores no la bloquean. La
  dirección del panel será la de Railway (por ejemplo `emirate-scents.up.railway.app/admin`).
  El código del panel no se incluye en la compilación de GitHub Pages.
- **CORS:** la API solo acepta peticiones del navegador desde `https://sebastianjaimesr.github.io`
  (y `localhost` en desarrollo); las rutas `/api/admin/*` no aceptan otros orígenes.
- **Costos:** unos 5 USD/mes en Railway (API + PostgreSQL). GitHub Pages es gratis.
- **Si algún día compras un dominio** (por ejemplo `emiratescents.com`), se puede pasar todo a un
  solo dominio sin rehacer nada.
- **Mientras no exista la API en Railway**, GitHub Pages sigue mostrando la vista previa DEMO actual.

---

## 4. Plan por fases

Cada fase: una rama y un Pull Request. **Aprobar = hacer merge.** En cada una ejecuto lint, tipos,
pruebas unitarias, pruebas de la API y Playwright, y te explico cómo verla.

### Fase 2 · Hero 3D cinematográfico

- Instalar `three`, `@react-three/fiber`, `@react-three/drei` (y `@types/three`), fijando React `~19.3`.
- Nuevos: `client/src/features/hero3d/` (escena, botella, luces, partículas, detector de WebGL,
  límite de errores), `HeroScene` cargado bajo demanda.
- Modificar: `HeroSection.tsx` (composición editorial, texto con entrada progresiva, botones
  "Explorar la colección" y "Descubrir perfumes"), `content/home.ts`.
- La composición actual pasa a ser el plan B.
- Pruebas: el hero se ve y funciona sin WebGL; con "reducir movimiento" no hay animación; la
  política de seguridad no bloquea nada; capturas en escritorio y celular.

### Fase 3 · Vitrina horizontal ligada al scroll

- Nuevos: `client/src/features/showcase/` (`FragranceShowcase`, `ShowcaseBottle`, versión carrusel
  para celular), endpoint reutilizado `GET /api/catalog/highlights/recomendados`.
- Modificar: `HomePage.tsx` (insertar la vitrina tras el hero).
- Pruebas Playwright: bajar mueve la fila a la izquierda, subir la devuelve, al final la página
  continúa, cada botella abre su ficha, en celular es carrusel táctil.

### Fase 4 · Tienda pública pulida

- Tarjetas con perspectiva ligera y luz al pasar el cursor; animación al añadir al carrito (la
  imagen "vuela" al icono) y al guardar favorito; transiciones entre páginas; revelado de
  categorías; mejoras de ficha (galería con zoom y profundidad); transiciones del menú móvil.
- Todo respeta "reducir movimiento" y no interfiere con búsqueda, filtros ni compra.
- Pruebas: las de tienda, carrito, favoritos y accesibilidad siguen en verde.

### Fase 5 · Backend y base de datos para administración

- Migración: `AdminUser`, `AdminSession`, `InventoryMovement`, `OrderStatusChange`;
  `Product.lowStockThreshold`; estado `EN_PREPARACION`; `ProductImage` con referencia al
  almacenamiento; regla que impide editar o borrar movimientos.
- Autenticación: `POST /api/admin/auth/login`, `logout`, `GET /api/admin/auth/me`, comando
  `admin:crear`, middleware que exige sesión en `/api/admin/*`.
- Endpoints de productos, categorías, marcas, inventario y subida de imágenes; servicio de
  almacenamiento (carpeta local o S3).
- CORS para la tienda en GitHub Pages: solo peticiones públicas desde
  `https://sebastianjaimesr.github.io`; `/api/admin/*` rechaza cualquier otro origen.
- Pruebas de API: un visitante recibe 401 en todo `/api/admin`; límite de intentos de acceso;
  validaciones (precio negativo, SKU duplicado, publicación incompleta).

### Fase 6 · Panel administrativo

- `client/src/admin/` con su propio diseño: inicio de sesión, dashboard con cifras reales,
  productos (tabla con búsqueda, filtros, stock bajo), formulario completo de crear/editar,
  imágenes (subir, vista previa, principal, orden de galería), publicar/despublicar/archivar,
  inventario (entradas y ajustes), categorías y marcas.
- Configuración básica queda como sección preparada, sin botones falsos.
- Pruebas Playwright: iniciar y cerrar sesión, sesión caducada, crear, editar y despublicar un
  producto, registrar una entrada de mercancía.

### Fase 7 · Pedidos y operaciones

- Pedidos en el panel: búsqueda, filtro por estado, detalle con precios históricos, cambio de
  estado con confirmación explícita, costo de envío confirmado.
- Descuento de stock al confirmar, devolución al cancelar, sin doble descuento.
- Prueba de concurrencia: dos confirmaciones simultáneas de la última unidad, solo una gana.

### Fase 8 · Seguridad, pruebas y publicación

- Revisión de seguridad completa, pruebas de errores del backend, revisión en móvil y escritorio.
- Publicación: API, panel y PostgreSQL en Railway; tienda en GitHub Pages conectada a la API;
  almacenamiento de imágenes, variables de entorno,
  guía actualizada de desarrollo local, producción y mantenimiento (cómo crear administradores,
  copias de seguridad).
- Publicar en Railway lo haces tú con tu cuenta; yo preparo todo y te guío paso a paso.

---

## 5. Lo que necesito de ti

| Necesito                                                                                                               | Para qué fase | ¿Bloquea?                                          |
| ---------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------- |
| **Fotos de producto** propias o autorizadas, idealmente con fondo transparente o uniforme, al menos de 6 a 10 perfumes | 3 y 4         | No; uso la imagen de reserva y DEMO mientras tanto |
| Capturas del diseño de Canva (no puedo abrir el enlace)                                                                | 2             | No; sigo la identidad actual                       |
| Catálogo real (plantilla CSV que ya existe)                                                                            | 8             | Para publicar                                      |
| Datos de la política de datos (titular, NIT o cédula, domicilio, correo)                                               | 8             | Para publicar                                      |
| Condiciones de envío y pago contra entrega                                                                             | 7 y 8         | Para publicar                                      |
| Confirmar que el stock se descuenta al **confirmar** el pedido (sección 3.5)                                           | 7             | No; avanzo con esa regla                           |

No inventaré productos, precios, fotos de marcas ni cifras de ventas. Todo dato de ejemplo seguirá
marcado como DEMO, y no diré que el panel está conectado a la base de datos hasta que lo esté y lo
haya probado.
