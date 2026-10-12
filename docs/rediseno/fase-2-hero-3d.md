# Rediseño · Fase 2: hero 3D cinematográfico

## Qué cambió

La primera sección del inicio ahora es un escenario oscuro. Un frasco 3D descansa sobre un pedestal,
**dentro del arco dorado de la marca**, con luz cálida, reflejos y un polvo dorado muy discreto.

- **Frasco genérico creado por código:** vidrio tallado de 8 caras, perfume ámbar dentro y tapa
  dorada con remate de cúpula. No lleva marca ni representa ningún perfume real.
- **Movimiento:**
  - flota suavemente;
  - en escritorio se inclina un poco siguiendo el cursor;
  - al bajar, el frasco gira y la cámara se aleja; al subir, todo vuelve atrás de forma natural,
    porque cada posición se calcula a partir del progreso del scroll.
- **Texto editorial:** el título aparece palabra por palabra y el texto se desvanece al bajar.
- **Botones:**
  - "Explorar la colección" abre el catálogo;
  - "Descubrir perfumes" baja a las colecciones (en la Fase 3 llevará a la vitrina);
  - la asesoría por WhatsApp sigue en el hero como enlace, además del botón flotante.
- **Indicación de scroll** en escritorio: una línea dorada que desciende.

## Plan B (la tienda nunca depende del 3D)

| Situación                                        | Qué se ve                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| Mientras se descarga la escena                   | Arcos dorados + logo (el hero anterior)                                  |
| Navegador sin WebGL                              | Arcos dorados + logo                                                     |
| Sistema con "reducir movimiento"                 | Arcos dorados + logo; la escena ni siquiera se descarga                  |
| La escena falla o el equipo se queda sin memoria | Vuelve a arcos + logo, sin errores en pantalla                           |
| Celular                                          | 3D ligero: vidrio satinado sin refracción, menos partículas, sombra fija |

## Rendimiento

- Three.js y la escena (~264 KB comprimidos) se descargan **aparte y después** de mostrar el texto.
  Quien no ve el inicio o no tiene WebGL nunca los descarga. El JavaScript inicial de la tienda no
  cambió (~93 KB comprimidos).
- La escena se **pausa** cuando sale de la pantalla y se libera al salir de la página.
- Un solo `<Canvas>` en toda la tienda; resolución limitada en pantallas de alta densidad.
- Los reflejos usan un "estudio virtual" de paneles de luz: no se descarga ninguna imagen HDR
  externa, así que la política de seguridad de contenido sigue intacta.

## Archivos

| Archivo                                             | Qué es                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| `client/src/features/hero3d/HeroVisual.tsx`         | Decide entre 3D y plan B; arcos, logo y fundidos                            |
| `client/src/features/hero3d/HeroScene.tsx`          | Escena 3D: cámara, luces, pedestal, sombra, polvo dorado                    |
| `client/src/features/hero3d/PerfumeBottle.tsx`      | El frasco (vidrio, perfume, anillo y tapa)                                  |
| `client/src/features/hero3d/SceneErrorBoundary.tsx` | Si la escena falla, vuelve al plan B                                        |
| `client/src/features/hero3d/webgl.ts`               | Detecta WebGL y espera a que el navegador esté libre                        |
| `client/src/features/home/HeroSection.tsx`          | Hero rediseñado (texto, botones, scroll)                                    |
| `client/src/content/home.ts`                        | Textos de los botones                                                       |
| `client/src/components/ui/ButtonLink.tsx`           | Admite anclas (`#colecciones`)                                              |
| `client/src/features/home/CategoriesSection.tsx`    | Ancla `#colecciones`                                                        |
| `e2e/hero.spec.ts`                                  | 3 pruebas nuevas en escritorio y celular                                    |
| `client/package.json`                               | `three`, `@react-three/fiber`, `@react-three/drei`; React fijado en `~19.3` |

## Comprobaciones ejecutadas

| Comprobación                         | Resultado                                                              |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Lint y tipos                         | Sin errores                                                            |
| Build normal y build de GitHub Pages | Correctos                                                              |
| Pruebas unitarias de la tienda       | 30 de 30                                                               |
| Pruebas de la API                    | 45 de 45                                                               |
| Playwright (escritorio y celular)    | 52 de 52 (incluye las 6 nuevas, accesibilidad y política de seguridad) |
| `npm audit`                          | 0 vulnerabilidades                                                     |

Las pruebas nuevas comprueban que con WebGL aparece el frasco, que sin WebGL se ve el logo y los dos
botones funcionan, y que con "reducir movimiento" la escena no se descarga.

## Cómo verlo en tu computador

```bash
npm install
npm run dev
```

Abre http://localhost:5173, mueve el cursor y baja despacio. Para probar el plan B, activa
"reducir movimiento" en la configuración de accesibilidad de tu sistema y recarga.

Al hacer merge, GitHub Pages publica la vista previa con el hero nuevo.

## Pendiente

- Fase 3: la vitrina horizontal ligada al scroll; el botón "Descubrir perfumes" apuntará a ella.
- Sigue faltando fotografía de producto (la necesita sobre todo la vitrina).
