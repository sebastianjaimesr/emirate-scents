# Emirate Scents

Tienda online de perfumería premium: perfumes árabes, de diseñador, de nicho y equivalencias.
**Exclusivity in every scent.**

- WhatsApp: [317 409 6898](https://wa.me/573174096898)
- Instagram: [@emirate_scents](https://www.instagram.com/emirate_scents/)

## Estado del proyecto

| Fase | Contenido                                                                     | Estado |
| ---- | ----------------------------------------------------------------------------- | ------ |
| 1    | Análisis y arquitectura ([documento](docs/fase-1-analisis-y-arquitectura.md)) | ✅     |
| 2    | Identidad visual y página de inicio                                           | ✅     |
| 3    | Catálogo y productos                                                          | ✅     |
| 4    | Favoritos, carrito e interacciones                                            | ✅     |
| 5    | Backend (Express + PostgreSQL + Prisma) ([documento](docs/fase-5-backend.md)) | ✅     |
| 6    | Pedidos y WhatsApp ([documento](docs/fase-6-pedidos.md))                      | ✅     |
| 7    | Pruebas, seguridad y optimización ([documento](docs/fase-7-calidad.md))       | ✅     |
| 8    | Preparación para producción ([documento](docs/fase-8-produccion.md))          | ✅     |

**Rediseño (2026-10):** hero 3D, vitrina, panel `/admin`, pedidos e inventario. Documentos en
[docs/rediseno](docs/rediseno/). Para publicar, la guía vigente es
[fase-8-publicacion.md](docs/rediseno/fase-8-publicacion.md).

## Requisitos (Windows + VS Code)

1. **Node.js 22.22 o superior** (recomendado: la versión LTS) y **Git**. En PowerShell:

   ```powershell
   winget install OpenJS.NodeJS.LTS
   winget install Git.Git
   ```

   Cierra y vuelve a abrir PowerShell y comprueba con `node -v` y `git --version`.

2. **PostgreSQL 16 o superior** (la base de datos). Descarga el instalador oficial en
   <https://www.postgresql.org/download/windows/>, acepta las opciones por defecto (puerto 5432) y
   **apunta la contraseña** que elijas para el usuario `postgres`.

3. Al abrir la carpeta en VS Code, acepta instalar las **extensiones recomendadas**
   (Prettier, Tailwind CSS IntelliSense, Oxc y Prisma).

## Instalación (solo la primera vez)

1. Crea el usuario y las bases de datos. Abre **SQL Shell (psql)** desde el menú Inicio, pulsa
   Enter en cada pregunta, escribe la contraseña de `postgres` y pega:

   ```sql
   CREATE USER emirate WITH PASSWORD 'emirate_dev' CREATEDB;
   CREATE DATABASE emirate_scents OWNER emirate;
   CREATE DATABASE emirate_scents_test OWNER emirate;
   ```

   `emirate_scents` es la de la tienda y `emirate_scents_test` la usan solo las pruebas.
   Esta contraseña es solo para tu equipo; en producción (Fase 8) se usará otra.

2. Descarga el proyecto y prepáralo, en la terminal de VS Code (PowerShell):

   ```powershell
   git clone https://github.com/sebastianjaimesr/emirate-scents.git
   cd emirate-scents
   Copy-Item server\.env.example server\.env
   npm install
   npm run db:migrate
   npm run db:seed
   ```

   `db:migrate` crea las tablas y `db:seed` carga las categorías y los productos DEMO.

## Uso diario

```powershell
npm run dev
```

Arranca a la vez la API (<http://localhost:4000/api>) y la tienda (<http://localhost:5173>).
Ábrela en el navegador. `Ctrl + C` detiene ambas.

| Comando                                    | Qué hace                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                              | Arranca API y tienda en modo desarrollo (se recargan al guardar)                                                    |
| `npm run build`                            | Comprueba los tipos y genera las versiones optimizadas (`dist/`)                                                    |
| `npm run preview`                          | Sirve la tienda optimizada (necesita la API en marcha)                                                              |
| `npm test`                                 | Ejecuta las pruebas automáticas de la tienda y de la API                                                            |
| `npm run test:e2e`                         | Recorre la tienda en un navegador real (ver más abajo)                                                              |
| `npm run lint`                             | Revisa errores comunes en el código                                                                                 |
| `npm run typecheck`                        | Revisa los tipos de TypeScript                                                                                      |
| `npm run format`                           | Da formato a todo el código con Prettier                                                                            |
| `npm run db:migrate`                       | Aplica cambios del modelo de datos (`server/prisma/schema.prisma`)                                                  |
| `npm run db:seed`                          | Vuelve a cargar categorías y productos DEMO (no duplica)                                                            |
| `npm run db:studio`                        | Abre Prisma Studio, un visor de la base de datos en el navegador                                                    |
| `npm run catalogo:importar -- archivo.csv` | Revisa (y con `--aplicar`, guarda) el catálogo real ([cómo](docs/catalogo-real.md#cargar-el-catálogo-en-la-tienda)) |
| `npm start`                                | Arranca la versión de producción (ver [Fase 8](docs/fase-8-produccion.md))                                          |
| `npm run db:deploy`                        | Aplica migraciones sin borrar nada (lo usa el hosting)                                                              |

### Pruebas en el navegador (e2e)

Un navegador automático recorre la tienda como un cliente: busca, guarda favoritos, hace un pedido
y revisa la accesibilidad de cada página, en tamaño escritorio y celular. Usa la base de datos de
pruebas (`TEST_DATABASE_URL`), nunca la tuya.

```powershell
npx playwright install chromium   # solo la primera vez: descarga el navegador
npm run build                     # las pruebas usan la versión optimizada
npm run test:e2e
npm run test:e2e:informe          # abre el informe con capturas si algo falló
```

No ejecutes `npm test` y `npm run test:e2e` a la vez: comparten la base de datos de pruebas.

## Vista previa en GitHub Pages

Para mostrar la tienda sin servidor existe una **vista previa** en
`https://sebastianjaimesr.github.io/emirate-scents/`:

- muestra los productos DEMO, con los mismos filtros, búsqueda y orden que la API;
- los pedidos están desactivados;
- pide a Google no indexarla.

Se publica sola con cada cambio en `main` (`.github/workflows/tienda-pages.yml`). Cuando
configures la variable `VITE_API_URL` en GitHub, ese mismo flujo publica la tienda real conectada
a la API ([guía](docs/rediseno/fase-8-publicacion.md#42-github-pages-la-tienda-real)).

Requisitos, una sola vez:

1. que el repositorio sea público, o tener GitHub Pro;
2. en **Settings → Pages → Source**, elegir **GitHub Actions**.

Para probarla en tu computador:

```powershell
npm run build:preview --workspace client
```

La tienda completa, con pedidos reales, se publica como explica la
[guía de publicación](docs/rediseno/fase-8-publicacion.md).

## Tecnologías

**Tienda:** React 19 · Vite · TypeScript (estricto) · Tailwind CSS v4 · Motion · React Router ·
Zustand · Lucide.
**API:** Node.js · Express 5 · Prisma 7 · PostgreSQL · Zod · helmet · pino.
**Calidad:** Vitest · Supertest · Playwright · axe · Oxlint · Prettier. Las razones de cada elección están en el
[documento de la Fase 1](docs/fase-1-analisis-y-arquitectura.md#5-tecnologías-y-por-qué).

## Estructura

```
emirate-scents/
├── client/                      Tienda (React)
│   ├── public/                  Favicon e imágenes de marca
│   └── src/
│       ├── app/                 Router y estructura común de páginas
│       ├── components/
│       │   ├── brand/           Logo, wordmark, arcos e iconos de marca
│       │   ├── layout/          Header, menú móvil, buscador, footer
│       │   ├── products/        Tarjeta, imagen con reserva, precio, etiquetas
│       │   └── ui/              Botones, títulos, estados vacíos...
│       ├── config/brand.ts      Datos oficiales: nombre, WhatsApp, Instagram, anuncios
│       ├── content/home.ts      Textos editables de la página de inicio
│       ├── data/categories.ts   Textos de las cuatro categorías
│       ├── features/cart/       Carrito: estado guardado, panel lateral y resumen (lógica con pruebas)
│       ├── features/catalog/    Búsqueda, filtros, orden y paginación (lógica con pruebas)
│       ├── features/checkout/   Formulario de pedido y su validación
│       ├── features/favorites/  Favoritos guardados en este navegador
│       ├── features/home/       Secciones de la página de inicio
│       ├── features/product/    Galería, notas olfativas y pedido de la ficha de producto
│       ├── hooks/               Lógica reutilizable (paneles accesibles, carga de datos)
│       ├── lib/                 Utilidades con pruebas (WhatsApp, precios COP, disponibilidad)
│       ├── pages/               Una página por ruta
│       ├── services/            Única puerta a los datos: llama a la API
│       ├── types/               Modelo de producto
│       └── index.css            Paleta, tipografías y estilos base
├── server/                      API (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma        Modelo de datos
│   │   ├── migrations/          Historial de cambios de la base de datos
│   │   ├── data/                Categorías reales y productos DEMO
│   │   └── seed.ts              Carga esos datos en la base de datos
│   ├── src/
│   │   ├── config/env.ts        Variables de entorno validadas
│   │   ├── routes/              URL → controlador
│   │   ├── controllers/         Petición HTTP → servicio → JSON
│   │   ├── validators/          Reglas de los parámetros (Zod)
│   │   ├── services/            Consultas, pedidos y reglas de negocio
│   │   ├── middlewares/         Manejo de errores
│   │   ├── lib/                 Conexión a la base de datos, registro, búsqueda
│   │   ├── web/                 Tienda compilada, robots.txt y sitemap.xml (producción)
│   │   ├── catalogImport/       Lectura y validación de la plantilla del catálogo
│   │   ├── app.ts               Configuración de Express (seguridad, CORS, límites)
│   │   └── server.ts            Arranque
│   ├── scripts/                 Importador del catálogo (npm run catalogo:importar)
│   └── tests/                   Pruebas de la API contra la base de datos de pruebas
├── e2e/                         Pruebas en el navegador (Playwright)
├── docs/                        Documentación de cada fase
└── package.json                 Scripts del proyecto (npm workspaces)
```

## Catálogo real

Mientras no tengamos el catálogo real, la tienda muestra productos **DEMO** marcados en rojo, con
pedidos desactivados. Llena la [plantilla del catálogo](docs/catalogo-real.md) y cárgala con
`npm run catalogo:importar` (en producción, la semilla ya no carga los DEMO).

## Reglas del proyecto

- No se publican productos, precios, fotos, testimonios ni cifras inventadas. Los datos de ejemplo
  se marcan siempre como **DEMO**.
- Las equivalencias se identifican como tales y nunca se presentan como perfumes originales.
- El servidor es la fuente de verdad de precios y existencias; nunca confía en el navegador.
