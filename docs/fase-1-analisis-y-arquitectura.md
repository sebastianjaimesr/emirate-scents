# Emirate Scents · Fase 1: Análisis y arquitectura

Fecha: 12 de octubre de 2026 · Estado: **pendiente de tu aprobación** (no se ha escrito código todavía).

---

## 1. Resumen de lo que entendí

Vamos a construir **Emirate Scents**, una tienda online premium de perfumes con cuatro categorías: perfumes árabes, perfumes de diseñador, perfumería de nicho y equivalencias (identificadas con transparencia).

- **Experiencia**: lujo árabe contemporáneo en negro, dorado y crema; animaciones elegantes con Motion; 3D solo si aporta valor real.
- **Funciones v1**: inicio, catálogo con búsqueda, filtros y orden reales, detalle de producto, favoritos (en el navegador), carrito persistente, pedido con resumen y envío por WhatsApp, pago contra entrega sujeto a confirmación.
- **Sin** pasarela de pago, sin login, sin panel de administración en esta versión, pero con la arquitectura preparada para ellos.
- **Seguridad clave**: el servidor recalcula precios, cantidades y existencias; nunca confía en lo que envía el navegador.
- **Honestidad de datos**: nada de productos, precios, fotos, testimonios ni estadísticas inventadas. Todo dato de ejemplo se marca como **DEMO**.
- **Forma de trabajo**: 8 fases, explicando cada decisión, en Windows con VS Code, esperando tu aprobación entre fases.

Datos de marca que no se cambian sin consultarte:

| Dato | Valor |
|---|---|
| Nombre comercial | Emirate Scents |
| Instagram | https://www.instagram.com/emirate_scents/ (@emirate_scents) |
| WhatsApp | 317 409 6898 → `https://wa.me/573174096898` |
| Lema (del logo) | "Exclusivity in every scent" |

Verifiqué el formato del enlace de WhatsApp: `wa.me` exige el número internacional sin `+`, espacios ni guiones. `57` (Colombia) + `3174096898` (móvil de 10 dígitos) = `573174096898`. Es correcto. El mensaje prellenado se añadirá con `?text=` codificado con `encodeURIComponent` (Fase 6).

---

## 2. Revisión de las referencias

| Referencia | Resultado |
|---|---|
| Logo (imagen que adjuntaste) | ✅ Revisado. Análisis abajo. |
| Instagram @emirate_scents | ❌ No pude acceder: Instagram bloquea el acceso automatizado y exige iniciar sesión. |
| Canva (canva.link/hu9s5mt4ozs2fap) | ❌ No pude acceder: el enlace también bloquea el acceso automatizado. |

**No he inventado el contenido de Instagram ni de Canva.** Para completarlo necesito capturas de pantalla (ver sección 3).

### Lo que dice el logo

- **Monograma "ES"** entrelazado en serif clásica de alto contraste, coronado con una **corona** con un **rubí** central y rodeado por un arco con pedrería.
- **Wordmark** "EMIRATE" en mayúsculas serif grandes y "SCENTS" con espaciado muy amplio, entre líneas finas doradas.
- **Lema** en versalitas pequeñas y espaciadas, con un ornamento de filigrana debajo.
- **Dorado metálico con degradado** (brillo claro arriba, tonos más profundos en las sombras) sobre **negro puro**.

### Consecuencias para el diseño

1. El logo es muy detallado (pedrería, corona, degradados). Funciona como pieza protagonista en el hero, el footer o una pantalla de carga, pero **a 32–40 px de alto en el header de un móvil la pedrería se convierte en ruido**. Necesitamos dos versiones:
   - **Logo completo**: hero, footer, página "Nosotros".
   - **Versión compacta**: wordmark "EMIRATE SCENTS" o el monograma "ES" solo, para header, favicon e icono de la app.
2. El archivo que tengo es un **PNG con fondo negro**. No sirve sobre secciones crema. Necesito el logo con **fondo transparente** (idealmente en vector: SVG, AI, EPS o PDF). Si no existe, se puede recortar una versión provisional, pero es mejor partir del archivo original.
3. El **rubí de la corona** es un detalle único de la marca. Propongo usarlo como color de acento **muy puntual** (por ejemplo, el corazón activo de favoritos). Así la interfaz parece hecha para Emirate Scents y no una plantilla.
4. Los ornamentos (líneas finas, filigrana, arco) inspiran los divisores y marcos de la interfaz. Se reinterpretan con líneas planas de 1 px, sin imitar la pedrería con brillos (eso daría el aspecto "genérico de IA" que quieres evitar).

---

## 3. Datos que faltan

### Imprescindibles antes o durante la Fase 2

| # | Dato | Para qué |
|---|---|---|
| 1 | **Capturas de Instagram** (perfil, 6–9 publicaciones representativas) **y del diseño de Canva** | Confirmar estilo fotográfico, colores reales y tono de comunicación |
| 2 | **Logo con fondo transparente** (vector si es posible) y, si existe, versión compacta | Header, favicon y secciones claras |
| 3 | **Fotografías propias o autorizadas** para el hero y las categorías | El hero cinematográfico depende de una buena foto. Sin ella usaré una composición provisional con el logo, texturas y luz, claramente provisional |
| 4 | **¿Hay un anuncio real** para la barra superior? (ej. "Envíos a toda Colombia") | Si no hay ninguno confirmado, la barra no se muestra |

### Imprescindibles antes de la Fase 3 (catálogo)

| # | Dato | Para qué |
|---|---|---|
| 5 | **Catálogo real**: te prepararé una plantilla (hoja de cálculo) con todas las columnas del modelo para que la llenes | Publicar productos reales |
| 6 | **Fotos de cada producto** con permiso de uso | Galería y tarjetas |
| 7 | **Cómo presentar las equivalencias** (ver sección 9, riesgo legal) | Clasificación y textos |

### Imprescindibles antes de la Fase 6 (pedidos)

| # | Dato | Para qué |
|---|---|---|
| 8 | **Ciudades o zonas con contra entrega** y condiciones (monto mínimo, recargo) | Mostrar u ocultar esa opción según la ciudad |
| 9 | **Costo de envío** (fijo, por ciudad o "por cotizar") | Calcular el total o indicar "pendiente de cotización" |
| 10 | **¿Se reserva inventario al crear el pedido?** (ver sección 7) | Lógica del servidor |
| 11 | **Política de tratamiento de datos personales** | En Colombia, la Ley 1581 de 2012 (habeas data) exige informar y pedir autorización al recoger nombre, teléfono y dirección |

### Pueden resolverse después (Fase 8)

Dominio, hosting, correo de contacto, horario de atención, políticas de cambios y devoluciones, otras redes sociales.

---

## 4. Dirección visual propuesta

**Concepto: "Boutique nocturna del desierto".** La tienda alterna escenas oscuras, cálidas y cinematográficas (como entrar a una boutique iluminada con velas) con espacios claros color marfil donde se lee y se compra con calma. El dorado se usa como joyería: poco y preciso.

### 4.1 Paleta (tokens de diseño)

Los valores salen del logo, ajustados para cumplir contraste de accesibilidad (WCAG AA = 4.5:1 para texto normal). Calculé cada contraste.

| Token | Hex | Uso |
|---|---|---|
| `ink-950` Negro cálido | `#0E0C0A` | Fondos oscuros. No uso `#000` puro: un negro ligeramente cálido se ve más lujoso en pantalla |
| `ink-900` Carbón | `#1A1612` | Tarjetas y paneles sobre fondo oscuro; texto principal sobre claro |
| `gold-300` Oro brillo | `#E3C77D` | Hover y reflejos sobre negro (contraste 11.8:1) |
| `gold-500` Oro metálico | `#C9A54E` | Detalles, iconos, líneas y textos sobre negro (8.3:1) |
| `gold-700` Oro profundo | `#6F5420` | **Texto dorado sobre crema** (6.3:1). El oro claro sobre crema solo da 2.1:1 y sería ilegible |
| `ivory-50` Marfil | `#F7F1E6` | Fondo claro principal y texto sobre negro (17.4:1) |
| `cream-100` Crema | `#EFE4D0` | Secciones claras alternas |
| `sand-300` Arena | `#D9C4A0` | Bordes y separadores en secciones claras |
| `amber-600` Ámbar | `#B8762E` | Acentos cálidos en fotografía y gráficos |
| `oud-800` Madera de oud | `#4A3020` | Fondos de bloques editoriales cálidos |
| `smoke-500` Humo | `#5E554A` | Texto secundario sobre claro (6.5:1) |
| `ruby-600` Rubí | `#8C1C2B` | Acento puntual: favorito activo y alertas |

Reglas:
- Ningún degradado decorativo. Solo uno: un barrido de luz muy sutil sobre el oro, en elementos de marca puntuales.
- **Botón principal**: fondo `gold-500` con texto `ink-950` (8.3:1). **Botón secundario**: borde dorado de 1 px y texto dorado.
- En secciones claras, el dorado aparece en líneas y ornamentos, no en texto pequeño.

### 4.2 Tipografía

| Rol | Fuente | Por qué |
|---|---|---|
| Titulares | **Cormorant Garamond** (500–600) | Serif de alto contraste, emparentada con la del logo, elegante en tamaños grandes |
| Textos, precios, botones, navegación | **Manrope** (400–700) | Sans serif moderna con números claros. Los precios en COP (`$ 285.000`) se leen muy bien |
| Etiquetas pequeñas ("NUEVO", "ÁRABES") | Manrope en mayúsculas con espaciado amplio (0.18em) | Hace eco del "S C E N T S" del logo sin añadir una tercera fuente |

Las fuentes se **alojan en el propio proyecto** (paquetes `@fontsource`) en lugar de cargarse desde Google: carga más rápida, sin dependencia externa y sin enviar datos de visitantes a terceros. Ambas son de licencia libre (SIL OFL).

### 4.3 Composición

- **Ritmo oscuro/claro** en la página de inicio: barra de anuncio (negro) → hero (negro) → categorías (marfil) → recomendados (crema) → colección premium (negro) → bloque editorial (oud) → cómo pedir por WhatsApp (marfil) → preguntas frecuentes (marfil) → footer (negro).
- **Elemento propio: el arco.** Las fotos de categorías y la colección premium se enmarcan con una silueta de **arco árabe** (forma de mihrab) con una línea dorada de 1 px. Es el gesto visual que distingue la tienda; se usa en 2 o 3 lugares, no en todas las tarjetas.
- **Tarjetas de producto sobrias**: foto grande sobre fondo neutro, marca en versalitas, nombre en serif y precio en sans. Sin sombras pesadas ni bordes redondeados exagerados (radio de 2–4 px).
- **Escritorio**: composiciones editoriales asimétricas (foto grande a un lado, texto alineado a una rejilla de 12 columnas), mucho aire.
- **Móvil**: primero. Hero vertical con la foto arriba y el titular abajo, categorías en carrusel horizontal con desplazamiento táctil, filtros en panel inferior, carrito en panel a pantalla completa, botones de al menos 44 × 44 px.

### 4.4 Estilo fotográfico (para pedir o producir las fotos)

- Iluminación **lateral y baja (low-key)**: fondo oscuro, el frasco recortado por una luz cálida.
- Texturas que evocan las familias olfativas: madera, arena, seda, resina de ámbar, humo, piedra.
- Paleta fotográfica cálida (ámbar, miel, bronce) que combine con el dorado.
- Para el catálogo: **fondo uniforme** (crema o negro, uno solo para todo el catálogo), mismo encuadre, mínimo 1600 px en el lado mayor.
- **Mientras no haya fotos**: un marcador elegante con el monograma "ES" en línea dorada sobre crema y el texto "Imagen próximamente". Se reconoce claramente como provisional.

### 4.5 Animaciones (Motion for React)

| Dónde | Animación | Duración |
|---|---|---|
| Al hacer scroll | Títulos que suben 16 px y aparecen; imágenes que se revelan con una máscara | 0.6–0.9 s, una sola vez |
| Hero | Entrada escalonada: logo → titular → botón; parallax leve de la foto (máx. 8–10 %) | 1.2 s total |
| Tarjetas | Zoom de la foto al 1.04 y aparición de "Agregar" y favorito | 0.4 s |
| Favoritos | El corazón se rellena de rubí con un pequeño rebote | 0.3 s |
| Carrito | El contador hace un pulso; el panel lateral entra deslizando | 0.35 s |
| Detalle de producto | La foto de la tarjeta "viaja" hasta la página de detalle (shared layout) | 0.5 s |

Con `prefers-reduced-motion` activo: sin parallax, sin desplazamientos ni rebotes; solo fundidos rápidos.

### 4.6 ¿3D con Three.js / React Three Fiber?

**Recomendación: no incluirlo en la v1.** No tenemos modelos 3D reales de los frascos y crear uno falso sería simular algo que no existe (lo pediste expresamente). Además, Three.js añade unos 150–600 KB de JavaScript, lo que perjudica la carga en móviles.

En su lugar: **presentación en capas** (foto del frasco, sombra, luz y una capa de "humo" muy tenue) que se mueven a velocidades distintas con el cursor o el scroll. Da profundidad sin peso. Si más adelante consigues modelos 3D (archivos `.glb`) de tus frascos, lo reevaluamos para una sola pieza (por ejemplo, el hero), cargada solo cuando se necesite.

---

## 5. Tecnologías y por qué

Versiones: al empezar cada fase consultaré la documentación oficial vigente de cada librería y usaré la última versión estable compatible. Las versiones exactas quedarán fijadas en `package-lock.json`.

### Frontend (`client/`)

| Librería | Problema que resuelve |
|---|---|
| React + TypeScript (estricto) | Interfaz por componentes; TypeScript detecta errores antes de ejecutar |
| Vite | Servidor de desarrollo instantáneo y build optimizado |
| Tailwind CSS v4 | Estilos con clases utilitarias; los tokens de la paleta se definen una sola vez en CSS (`@theme`) |
| Motion (`motion/react`) | Animaciones declarativas, de scroll y de layout con soporte de `prefers-reduced-motion` |
| React Router | URLs legibles (`/producto/oud-wood-100ml`) y navegación sin recargar |
| **Zustand** | Estado global de carrito y favoritos. **Recomendado frente a Context de React**: menos código, guarda en `localStorage` con una línea (`persist`) y evita re-renderizados innecesarios. Pesa ~1 KB |
| React Hook Form + Zod | Formulario de pedido con validación clara y mensajes en español |
| Lucide React | Iconos finos y coherentes; solo se incluyen los que se usan |
| @fontsource | Fuentes alojadas en el proyecto |

No incluyo en la v1: librerías de componentes (Material UI, etc.), porque impondrían un aspecto genérico; Three.js (ver 4.6); TanStack Query, que evaluaré en la Fase 5 cuando conectemos la API real.

### Backend (`server/`)

| Librería | Problema que resuelve |
|---|---|
| Node.js (LTS) + Express + TypeScript | API REST sencilla y muy documentada |
| Prisma + PostgreSQL | Base de datos relacional con migraciones versionadas y consultas tipadas |
| Zod | Valida cada petición (query, parámetros, cuerpo) antes de tocar la base de datos |
| helmet | Cabeceras HTTP de seguridad |
| cors | Solo permite peticiones desde el dominio de la tienda |
| express-rate-limit | Limita intentos de crear pedidos (anti-abuso) |
| pino | Registro de eventos rápido, ocultando datos sensibles (teléfono, dirección) |
| dotenv | Variables de entorno en desarrollo |

### Calidad y pruebas

ESLint, Prettier, TypeScript estricto, **Vitest** (pruebas unitarias en cliente y servidor), **Supertest** (pruebas de la API), Git y GitHub.

Funciones críticas que tendrán pruebas: cálculo de totales del carrito, formateo de precios COP, generación y codificación del mensaje de WhatsApp, filtros y orden del catálogo, validación de pedidos y cálculo del total en el servidor.

---

## 6. Arquitectura

```
 Navegador (React)                         Servidor (Express)              PostgreSQL
┌─────────────────────────────┐          ┌─────────────────────────┐     ┌──────────┐
│ pages/  → qué ve el usuario │          │ routes/      URL → acción│     │ Product  │
│ features/ → lógica por área │  HTTP    │ validators/  Zod         │     │ Category │
│ services/ → única puerta    │ ───────► │ controllers/ req/res     │ ──► │ Brand    │
│   a los datos               │  JSON    │ services/    reglas de   │     │ Order    │
│   (DEMO hoy, API mañana)    │ ◄─────── │   negocio + Prisma       │     │ ...      │
│ store (Zustand) → carrito,  │          │ middlewares/ errores,    │     └──────────┘
│   favoritos en localStorage │          │   seguridad, límites     │
└─────────────────────────────┘          └─────────────────────────┘
          │
          └─► WhatsApp (wa.me) — el cliente abre WhatsApp y pulsa "Enviar"
```

Decisiones clave:

1. **Capa de servicios en el cliente.** Los componentes nunca leen datos directamente; llaman a `productService.getProducts(filtros)`. En las Fases 2–4 ese servicio lee un archivo **DEMO**; en la Fase 5 se cambia por llamadas a la API **sin tocar los componentes**. Así el catálogo no queda "escrito dentro de React".
2. **Organización por funcionalidad (`features/`).** Todo lo del carrito vive junto (estado, hooks, componentes propios). Es más fácil de entender y ampliar que separar por tipo de archivo.
3. **El servidor es la fuente de verdad del dinero.** El navegador envía solo `{ productId, quantity }`. El servidor busca precios y existencias en la base de datos, calcula el total dentro de una **transacción** y guarda una copia del precio y nombre de cada línea.
4. **Monorepo con npm workspaces.** Un solo repositorio con `client/` y `server/` y un `package.json` raíz con scripts como `npm run dev` (arranca ambos). Es simple y suficiente; no necesitamos herramientas como Turborepo.
5. **Preparado para crecer.** El panel de administración será un nuevo grupo de rutas (`/api/admin/...`) protegido con autenticación, que reutiliza los mismos `services/` del servidor.

### Rutas del sitio (en español, legibles)

| URL | Página |
|---|---|
| `/` | Inicio |
| `/catalogo` | Todos los productos (filtros en la URL: `?marca=...&orden=precio-asc`) |
| `/catalogo/perfumes-arabes`, `/catalogo/disenador`, `/catalogo/nicho`, `/catalogo/equivalencias` | Categorías |
| `/producto/:slug` | Detalle |
| `/favoritos` | Favoritos |
| `/pedido` | Datos y resumen del pedido |
| `/pedido/confirmacion` | Pedido registrado, pendiente de confirmación |

Los filtros se guardan en la URL para que un enlace compartido muestre los mismos resultados y el botón "atrás" funcione.

### API REST (Fase 5)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/health` | Estado del servicio y de la base de datos |
| GET | `/api/products` | `?q, categoria, marca, precioMin, precioMax, tamano, familia, orden, pagina, porPagina` (máx. 48 por página). Solo productos publicados |
| GET | `/api/products/:slug` | Detalle; 404 si no existe o no está publicado |
| GET | `/api/categories` | |
| GET | `/api/brands` | |
| POST | `/api/orders` | Valida, recalcula y registra; devuelve número de pedido y resumen |
| GET | `/api/orders/:number` | **No se implementa** hasta tener un mecanismo seguro (por ejemplo, un token secreto por pedido) |

---

## 7. Modelo de datos (borrador para la Fase 5)

```
Category 1───* Product *───1 Brand
                 │  1
                 ├──* ProductImage
                 ├──* ProductNote *───1 Note        (notas de salida / corazón / fondo)
                 ├──* Favorite *───1 User           (User mínimo, sin login todavía)
                 └──* OrderItem *───1 Order
Product *───1 OlfactoryFamily (opcional)
```

Campos principales:

- **Product**: `id`, `sku` (único; `AR-0001` para árabes, `DS-`, `NI-`, `EQ-` para el resto), `slug` (único), `name`, `brandId`, `categoryId`, `shortDescription`, `description`, `price`, `compareAtPrice` (precio anterior, opcional y solo si es real), `sizeMl`, `concentration` (enum: EXTRAIT, PARFUM, EDP, EDT, EDC, ACEITE, OTRA), `olfactoryFamilyId?`, `gender?` (enum: FEMENINO, MASCULINO, UNISEX; solo si es la clasificación real), `stock`, `status` (BORRADOR, PUBLICADO, ARCHIVADO), `isNew`, `isFeatured`, `isBestSeller` (este último solo con datos de ventas reales), **`isDemo`**, `publishedAt`, `createdAt`, `updatedAt`. Índices por `categoryId`, `brandId`, `status`, `price`.
- **Equivalencias**: además, `inspirationReference?` (texto) y un aviso fijo en la ficha. Ver sección 9.
- **ProductImage**: `url`, `alt`, `position`, `isPrimary`.
- **Order**: `orderNumber` legible (`ES-2026-000123`), `status` (PENDIENTE_CONFIRMACION, CONFIRMADO, ENVIADO, ENTREGADO, CANCELADO), `customerName`, `customerPhone`, `city`, `address`, `notes?`, `paymentMethod` (CONTRA_ENTREGA, ACORDAR_POR_WHATSAPP), `subtotal`, `shippingCost?` (vacío = "por cotizar"), `total`, `dataConsentAt` (fecha de autorización de datos), fechas.
- **OrderItem**: `productId`, **`productNameSnapshot`** y **`skuSnapshot`** (sí conviene guardarlos: si mañana renombras o eliminas un producto, el pedido histórico sigue diciendo qué se vendió), `unitPrice` (precio histórico), `quantity`, `lineTotal`.

**Dinero**: tipo `Decimal(12,2)` en PostgreSQL y aritmética con `Prisma.Decimal` en el servidor. Nunca `Float`. El peso colombiano no usa centavos en la práctica, así que la interfaz muestra `$ 285.000` sin decimales.

**Inventario y pedidos.** Como el pedido queda "pendiente de confirmación" por WhatsApp, **recomiendo no descontar existencias al crear el pedido**: el servidor comprueba que hay suficiente, pero descuenta cuando el negocio confirma (futuro panel de administración). Evita que pedidos abandonados bloqueen productos. Necesito que me confirmes que te sirve (dato nº 10).

---

## 8. Estructura de carpetas

Ajusté tu propuesta: añadí `store/` dentro de cada feature (Zustand), `lib/` para utilidades con pruebas, y quité carpetas que hoy no tendrían contenido (`assets/`, `styles/` se reducen a un archivo, `public/icons` se crea cuando haya iconos de la marca). Las carpetas se crean **cuando su primer archivo las necesita**.

```
emirate-scents/
├── client/
│   ├── public/
│   │   └── images/brand/            logo y versiones (cuando las tengamos)
│   ├── src/
│   │   ├── app/                     App.tsx, router.tsx, providers
│   │   ├── components/
│   │   │   ├── layout/              Header, Footer, AnnouncementBar, MobileMenu
│   │   │   └── ui/                  Button, Drawer, Badge, ImageWithFallback, Price...
│   │   ├── features/
│   │   │   ├── catalog/             ProductCard, Filters, useCatalogFilters
│   │   │   ├── favorites/           favoritesStore, FavoriteButton
│   │   │   ├── cart/                cartStore, CartDrawer, CartLine
│   │   │   └── checkout/            OrderForm, OrderSummary, whatsappMessage.ts
│   │   ├── pages/                   HomePage, CatalogPage, ProductPage...
│   │   ├── services/                productService.ts, orderService.ts, apiClient.ts
│   │   ├── data/demo/               products.demo.ts  ← marcado DEMO
│   │   ├── lib/                     formatCOP.ts, whatsapp.ts (+ pruebas)
│   │   ├── types/                   product.ts, order.ts
│   │   ├── index.css                tokens de Tailwind (@theme) y estilos base
│   │   └── main.tsx
│   ├── index.html
│   ├── .env.example                 VITE_API_URL, VITE_WHATSAPP_NUMBER
│   └── package.json
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts                  solo categorías reales + productos DEMO marcados
│   ├── src/
│   │   ├── config/                  env.ts (variables validadas con Zod)
│   │   ├── routes/  controllers/  services/  validators/  middlewares/
│   │   ├── lib/                     prisma.ts, logger.ts, money.ts
│   │   ├── app.ts                   configuración de Express (testeable)
│   │   └── server.ts                arranque del servidor
│   ├── tests/
│   ├── .env.example                 DATABASE_URL, PORT, CORS_ORIGIN
│   └── package.json
├── docs/                            este documento y decisiones futuras
├── .gitignore
├── .editorconfig
├── .prettierrc
├── package.json                     workspaces + scripts dev/build/test/lint
└── README.md
```

`app.ts` y `server.ts` van separados para que las pruebas puedan usar la app sin abrir un puerto real.

---

## 9. Riesgos y avisos

1. **Equivalencias y marcas registradas.** Nombrar perfumes de otras marcas para vender equivalencias puede generar problemas de propiedad intelectual en Colombia. Propuesta: categoría propia "Equivalencias", sin logos ni fotos de las marcas originales, con un texto del tipo *"Perfil olfativo inspirado en…; no es un producto de esa marca ni está asociado a ella"*. **Te recomiendo validar la redacción con un asesor legal** antes de publicarlas.
2. **Datos personales.** El formulario pedirá solo nombre, teléfono, ciudad, dirección y observaciones, con una casilla de autorización y enlace a la política de datos (Ley 1581 de 2012).
3. **Imágenes de terceros.** No usaré fotos oficiales de marcas descargadas de internet sin permiso. Hasta tener fotos propias o autorizadas se verá el marcador provisional.

---

## 10. Preparar tu equipo Windows + VS Code

Puedes hacerlo ya; no depende de la siguiente fase. Abre **PowerShell** y ejecuta:

```powershell
# 1. Node.js (versión LTS) y Git
winget install OpenJS.NodeJS.LTS
winget install Git.Git

# 2. Cierra y vuelve a abrir PowerShell, luego comprueba:
node -v
npm -v
git --version
```

Extensiones de VS Code (pestaña Extensiones, `Ctrl+Shift+X`): **ESLint**, **Prettier – Code formatter**, **Tailwind CSS IntelliSense**, **Prisma**.

PostgreSQL lo instalaremos en la **Fase 5** (instalador oficial de Windows), para no sumar complejidad antes de necesitarlo.

Comandos que usarás a partir de la Fase 2 (se confirmarán con el código real):

```powershell
npm install          # instala dependencias de client y server
npm run dev          # arranca la tienda en http://localhost:5173
npm run test         # ejecuta las pruebas
npm run lint         # revisa el estilo del código
```

---

## 11. Qué se ha hecho en esta fase

- Análisis del logo y propuesta de identidad visual con contrastes verificados.
- Arquitectura, tecnologías, modelo de datos, rutas, API y estructura de carpetas.
- **No** se ha escrito código ni instalado dependencias: la Fase 1 es solo análisis. No hay nada que ver en el navegador todavía.

**Próximo paso (Fase 2)**, tras tu aprobación: crear el proyecto, configurar Tailwind con la paleta y las fuentes, y construir header, menú, hero, secciones de inicio y footer.
