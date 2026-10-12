# Emirate Scents

Tienda online de perfumería premium: perfumes árabes, de diseñador, de nicho y equivalencias.
**Exclusivity in every scent.**

- WhatsApp: [317 409 6898](https://wa.me/573174096898)
- Instagram: [@emirate_scents](https://www.instagram.com/emirate_scents/)

## Estado del proyecto

| Fase | Contenido                                                                     | Estado         |
| ---- | ----------------------------------------------------------------------------- | -------------- |
| 1    | Análisis y arquitectura ([documento](docs/fase-1-analisis-y-arquitectura.md)) | ✅             |
| 2    | Identidad visual y página de inicio                                           | 🔍 En revisión |
| 3    | Catálogo y productos                                                          | ⏳             |
| 4    | Favoritos, carrito e interacciones                                            | ⏳             |
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

React 19 · Vite · TypeScript (estricto) · Tailwind CSS v4 · Motion · React Router · Lucide ·
Vitest · Oxlint · Prettier. Las razones de cada elección están en el
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
│       │   └── ui/              Botones, títulos, estados vacíos...
│       ├── config/brand.ts      Datos oficiales: nombre, WhatsApp, Instagram, anuncios
│       ├── content/home.ts      Textos editables de la página de inicio
│       ├── data/categories.ts   Las cuatro categorías
│       ├── features/home/       Secciones de la página de inicio
│       ├── hooks/               Lógica reutilizable (paneles accesibles)
│       ├── lib/                 Utilidades con pruebas (enlaces de WhatsApp)
│       ├── pages/               Una página por ruta
│       └── index.css            Paleta, tipografías y estilos base
├── docs/                        Documentación de cada fase
└── package.json                 Scripts del proyecto (npm workspaces)
```

## Reglas del proyecto

- No se publican productos, precios, fotos, testimonios ni cifras inventadas. Los datos de ejemplo
  se marcan siempre como **DEMO**.
- Las equivalencias se identifican como tales y nunca se presentan como perfumes originales.
- El servidor (Fase 5) recalcula siempre precios y existencias; nunca confía en el navegador.
