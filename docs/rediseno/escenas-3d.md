# Secciones 3D del inicio

Reemplazan la vitrina de frascos ilustrados. Son dos secciones, en este orden en el inicio:

| Sección                    | Dónde está                    | Qué hace                                                                                                                                                                  |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Galería con pedestales** | Justo después del hero        | Una sala oscura con nichos en arco. La cámara camina de pedestal en pedestal. Cada pedestal muestra la foto real del perfume o, sin foto, una placa grabada con su nombre |
| **Pirámide olfativa**      | Antes de "familias olfativas" | Las notas de salida, corazón y fondo flotan en los tres pisos de una pirámide de hilos dorados que gira al bajar la página                                                |

Las dos se fijan en pantalla mientras se recorren (como la vitrina anterior) y nunca
bloquean el scroll. Al lado de la escena, el texto muestra el perfume que está al frente: marca,
detalles, precio, la etiqueta DEMO si corresponde y el enlace "Ver perfume".

## Qué datos usan

- **Galería:** los 8 primeros. Si el perfume tiene foto, se usa la primera. No se dibuja ningún
  frasco: sin foto, la placa solo lleva texto.
- **Pirámide:** los 4 primeros que tengan notas olfativas registradas. El color depende de la
  familia olfativa (`client/src/features/scenes/familyPalette.ts`). Si ninguno tiene notas, la
  sección no aparece. Los pisos sin notas no se muestran.

Nada se inventa: todo sale de los productos del catálogo.

## Sin 3D

Si el visitante pidió "reducir movimiento", si su navegador no tiene WebGL o si una escena
falla, cada sección muestra la misma información sin animación: la galería es una cuadrícula de placas y la pirámide muestra las notas de
cada perfume en tres filas. En esos casos no se descarga Three.js.

## Rendimiento

- Cada escena se descarga aparte (entre 3 y 5 KB comprimida; Three.js ya lo usa el hero).
- Una escena solo existe cuando su sección está cerca de la pantalla y se pausa cuando sale. Una
  prueba comprueba que nunca hay más de tres lienzos 3D a la vez.
- En celulares se usa resolución 1 y una versión más ligera de cada escena:
  sin reflejos de entorno (el oro es un color cálido con brillo propio), sin el foco ni los
  haces de luz de la galería y con materiales sencillos en el suelo y la pared. Medido en un
  celular simulado con el procesador 4 veces más lento: la galería pasó de 4 a 21 cuadros por
  segundo y el hero de 14 a 20.
- **Modo ligero:** si una escena no logra 20 cuadros por segundo durante unos segundos, se
  apaga sola y deja el texto en su sitio (la página no salta). Las demás escenas y el hero
  tampoco se cargan durante esa visita (`client/src/features/scenes/lowPower.ts`).

## Cambio en la API

Las fotos subidas desde el panel ahora se sirven con `Access-Control-Allow-Origin: *`. La
galería las usa como textura 3D y WebGL solo acepta fotos de otro dominio con ese permiso (la
tienda en GitHub Pages y la API en Railway están en dominios distintos). Son fotos públicas y se
piden sin cookies.

## Archivos

| Archivo                             | Qué es                                                         |
| ----------------------------------- | -------------------------------------------------------------- |
| `client/src/features/gallery/`      | Galería: sección, escena y placas grabadas                     |
| `client/src/features/notesPyramid/` | Pirámide: sección, escena y reparto de las notas por piso      |
| `client/src/features/scenes/`       | Piezas comunes: lienzo, montaje cercano, scroll fijado, textos |
| `e2e/escenas.spec.ts`               | Pruebas en el navegador (escritorio y celular)                 |

Se eliminó `client/src/features/showcase/` (la vitrina anterior) y su prueba. El 23-oct-2026 se
quitó también la sección del humo que formaba el nombre (`features/smoke/`), a pedido del dueño.
