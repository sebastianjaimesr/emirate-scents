# Emirate Scents

Tienda online de perfumería premium: perfumes árabes, de diseñador, de nicho y equivalencias.
**Exclusivity in every scent.**

- WhatsApp: [317 409 6898](https://wa.me/573174096898)
- Instagram: [@emirate_scents](https://www.instagram.com/emirate_scents/)

## Estado del proyecto

| Fase | Contenido                                                                     | Estado         |
| ---- | ----------------------------------------------------------------------------- | -------------- |
| 1    | Análisis y arquitectura ([documento](docs/fase-1-analisis-y-arquitectura.md)) | ✅             |
| 2    | Identidad visual y página de inicio                                           | ✅             |
| 3    | Catálogo y productos                                                          | ✅             |
| 4    | Favoritos, carrito e interacciones                                            | 🔍 En revisión |
| 5    | Backend (Express + PostgreSQL + Prisma)                                       | ⏳             |
| 6    | Pedidos y WhatsApp                                                            | ⏳             |
| 7    | Pruebas, seguridad y optimización                                             | ⏳             |
| 8    | Preparación para producción                                                   | ⏳             |

## Requisitos (Windows + VS Code)

1. **Node.js 22.22 o superior** (recomendado: la versión LTS) y **Git**. En PowerShell:

   ```powershell
   winget install OpenJS.NodeJS.LTS
   winget install Git.Git
   ```

   Cierra y vuelve a abrir PowerShell y comprueba con `node -v` y `git --version`.

2. Al abrir la carpeta en VS Code, acepta instalar las **extensiones recomendadas**
   (Prettier, Tailwind CSS IntelliSense y Oxc).

## Instalación y ejecución

```powershell
git clone https://github.com/sebastianjaimesr/emirate-scents.git
cd emirate-scents
npm install
npm run dev
```

Abre <http://localhost:5173> en el navegador.

| Comando             | Qué hace                                                            |
| ------------------- | ------------------------------------------------------------------- |
| `npm run dev`       | Arranca la tienda en modo desarrollo (se recarga al guardar)        |
| `npm run build`     | Comprueba los tipos y genera la versión optimizada en `client/dist` |
| `npm run preview`   | Sirve la versión optimizada para probarla                           |
| `npm test`          | Ejecuta las pruebas automáticas                                     |
| `npm run lint`      | Revisa errores comunes en el código                                 |
| `npm run typecheck` | Revisa los tipos de TypeScript                                      |
| `npm run format`    | Da formato a todo el código con Prettier                            |

## Tecnologías

React 19 · Vite · TypeScript (estricto) · Tailwind CSS v4 · Motion · React Router · Zustand ·
Lucide · Vitest · Oxlint · Prettier. Las razones de cada elección están en el
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
│       ├── data/categories.ts   Las cuatro categorías
│       ├── data/demo/           Productos DEMO (ficticios, no están a la venta)
│       ├── features/cart/       Carrito: estado guardado, panel lateral y resumen (lógica con pruebas)
│       ├── features/catalog/    Búsqueda, filtros, orden y paginación (lógica con pruebas)
│       ├── features/favorites/  Favoritos guardados en este navegador
│       ├── features/home/       Secciones de la página de inicio
│       ├── features/product/    Galería, notas olfativas y pedido de la ficha de producto
│       ├── hooks/               Lógica reutilizable (paneles accesibles, carga de datos)
│       ├── lib/                 Utilidades con pruebas (WhatsApp, precios COP, disponibilidad)
│       ├── pages/               Una página por ruta
│       ├── services/            Única puerta a los datos (hoy DEMO, en la Fase 5 la API)
│       ├── types/               Modelo de producto
│       └── index.css            Paleta, tipografías y estilos base
├── docs/                        Documentación de cada fase
└── package.json                 Scripts del proyecto (npm workspaces)
```

## Catálogo real

Mientras no tengamos el catálogo real, la tienda muestra productos **DEMO** marcados en rojo, con
pedidos desactivados. Para enviar los productos reales usa la
[plantilla del catálogo](docs/catalogo-real.md).

## Reglas del proyecto

- No se publican productos, precios, fotos, testimonios ni cifras inventadas. Los datos de ejemplo
  se marcan siempre como **DEMO**.
- Las equivalencias se identifican como tales y nunca se presentan como perfumes originales.
- El servidor (Fase 5) recalcula siempre precios y existencias; nunca confía en el navegador.
