# Rediseño · Fase 3: vitrina "The Fragrance Collection"

## Qué cambió

Justo después del hero aparece **"Descubre el universo Emirate"**: una fila de perfumes que avanza
en horizontal mientras bajas por la página.

1. Al llegar a la sección, el contenido queda fijo en pantalla y la vitrina es el foco.
2. Al bajar, los frascos avanzan hacia la izquierda; al subir, retroceden. El movimiento sale
   directamente de la posición del scroll (no hay animaciones automáticas) y pasa por un resorte
   suave para que la rueda del ratón no produzca saltos.
3. El recorrido dura medio alto de pantalla por perfume (8 perfumes ≈ 3 pantallas y media).
4. Al terminar, la página sigue con normalidad. El scroll nunca se bloquea: un scroll rápido sale
   de la sección sin esfuerzo.

**Profundidad:** el perfume del centro está más grande, iluminado y de frente. Los de los lados se
alejan, pierden brillo y giran hacia el centro, como en una vitrina curva. Cada frasco tiene su
arco dorado, una luz cálida, sombra y reflejo en el piso. Un contador ("04 / 08") y una línea
dorada muestran el avance de la colección.

**Cada perfume es un enlace** a su ficha, con marca, nombre, tamaño, concentración y precio.

**Teclado:** al recorrer los perfumes con Tab, la página se desplaza para centrar el enfocado.

## Celulares y "reducir movimiento"

En pantallas de menos de 768 px, o con "reducir movimiento" activado, la vitrina es un carrusel
horizontal que se desliza con el dedo y se detiene en cada perfume. No fija la página.

## Qué perfumes muestra

Los 8 primeros del catálogo en su orden por defecto: primero los marcados como recomendados por la
casa y después los más recientes. Si no hay productos publicados, la sección no aparece.

## Imágenes

- **Si el producto tiene fotografía**, se muestra la foto (ideal: fondo transparente).
- **Si no tiene**, se dibuja un frasco **ilustrado** en línea dorada (tres siluetas y cuatro tonos,
  siempre los mismos para cada producto), con el aviso "Ilustración · foto próximamente". Es un
  dibujo genérico: no imita el frasco de ninguna marca.
- Los productos DEMO llevan su etiqueta y la sección avisa "Productos de demostración: no están a
  la venta".

## Archivos

| Archivo                                               | Qué es                                                |
| ----------------------------------------------------- | ----------------------------------------------------- |
| `client/src/features/showcase/FragranceShowcase.tsx`  | La sección: versión fijada, carrusel, contador, barra |
| `client/src/features/showcase/ShowcaseItem.tsx`       | Un perfume: profundidad, luz, sombra, datos y enlace  |
| `client/src/features/showcase/BottleIllustration.tsx` | Frasco ilustrado cuando no hay foto                   |
| `client/src/hooks/useMediaQuery.ts`                   | Detecta el tamaño de pantalla                         |
| `client/src/services/productService.ts`               | `getShowcaseProducts()`                               |
| `client/src/pages/HomePage.tsx`                       | La vitrina va después del hero                        |
| `client/src/features/home/HeroSection.tsx`            | "Descubrir perfumes" ahora lleva a la vitrina         |
| `client/src/content/home.ts`                          | Textos de la vitrina                                  |
| `e2e/vitrina.spec.ts`                                 | 4 pruebas nuevas                                      |

No se añadió ninguna librería: la vitrina usa CSS (`position: sticky`) y Motion, que ya estaba.

## Comprobaciones ejecutadas

| Comprobación                      | Resultado                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Lint y tipos                      | Sin errores                                                                  |
| Build                             | Correcto                                                                     |
| Pruebas unitarias / API           | 30 de 30 / 45 de 45                                                          |
| Playwright (escritorio y celular) | 56 pasan; 4 se omiten a propósito (las de escritorio en celular y viceversa) |

Las pruebas nuevas comprueban, con un navegador real:

- que al bajar la fila se mueve a la izquierda, a mitad de camino queda en medio y al subir vuelve
  a su posición inicial;
- que pasada la vitrina se ve la sección siguiente;
- que cada perfume abre su ficha;
- que con "reducir movimiento" y en celular es un carrusel que se desliza en horizontal.

La prueba de accesibilidad (axe) del inicio sigue pasando con la vitrina.

## Cómo verlo

```bash
npm run dev
```

Abre http://localhost:5173 y baja despacio después del hero; luego sube. En el celular (o con la
ventana estrecha), desliza la fila con el dedo.

## Pendiente

- Fotos de producto, idealmente con fondo transparente: con ellas la vitrina mostrará los frascos
  reales en lugar de las ilustraciones.
- Fase 4: mejoras de la tienda pública (tarjetas, fichas, transiciones, carrito y favoritos).
