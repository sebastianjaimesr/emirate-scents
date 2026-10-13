# Rediseño · Fase 4: tienda pública pulida

## Qué cambió

| Dónde                    | Antes                         | Ahora                                                                                                                                         |
| ------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Tarjetas de producto     | La foto se ampliaba un poco   | La tarjeta sube, la foto se inclina siguiendo el cursor (máx. 6°), una luz dorada sigue al cursor y aparece una sombra. Al salir, vuelve sola |
| Corazón de favoritos     | Cambiaba de color             | Al marcarlo, un anillo rubí y ocho destellos dorados salen del corazón. Al desmarcarlo no hay destello                                        |
| Agregar al carrito       | Se abría el carrito al pulsar | Un sello dorado con una bolsa vuela en curva desde el botón hasta el icono del carrito, el icono da un salto y entonces se abre el carrito    |
| Cambio de página         | Cambio seco                   | La página nueva aparece con un fundido y un leve ascenso                                                                                      |
| Colecciones del inicio   | Aparecían de golpe            | Al llegar a ellas, cada arco revela su contenido (zoom suave hacia atrás), uno tras otro                                                      |
| Foto en la ficha         | Fija                          | Con ratón, al pasar sobre una foto real se amplía hacia el punto señalado (lupa). No se activa sobre el marcador "imagen próximamente"        |
| Menú y panel del carrito | Ya tenían transiciones        | Sin cambios: ya funcionaban bien                                                                                                              |

## Movimiento reducido, celulares y teclado

- Con "reducir movimiento": no hay inclinación, ni destellos, ni vuelo; el carrito se abre al
  instante y los cambios de página son solo un fundido.
- En pantallas táctiles no hay inclinación ni lupa (dependen del cursor). El vuelo al carrito sí
  funciona.
- Si el icono del carrito no está visible, el carrito se abre al instante sin vuelo.
- Todas las animaciones son decorativas: los lectores de pantalla no las anuncian, y los botones
  hacen lo mismo que antes.

## Archivos

| Archivo                                            | Qué es                                                       |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `client/src/components/products/useTilt.ts`        | Calcula la inclinación y la luz según el cursor              |
| `client/src/components/products/TiltFrame.tsx`     | Marco de la foto que se inclina y se ilumina                 |
| `client/src/components/products/ProductCard.tsx`   | La tarjeta usa el marco; el corazón queda por encima         |
| `client/src/features/favorites/FavoriteButton.tsx` | Destello al marcar favorito                                  |
| `client/src/features/cart/cartFlight.ts`           | Lanza un vuelo hacia el icono del carrito                    |
| `client/src/features/cart/CartFlight.tsx`          | Dibuja el sello dorado en vuelo                              |
| `client/src/features/cart/AddToCartButton.tsx`     | Lanza el vuelo y abre el carrito al aterrizar                |
| `client/src/components/layout/Header.tsx`          | Marca el icono del carrito como destino del vuelo            |
| `client/src/app/RootLayout.tsx`                    | Transición entre páginas y capa de vuelos                    |
| `client/src/features/home/CategoriesSection.tsx`   | Revelado de las colecciones                                  |
| `client/src/features/product/ProductGallery.tsx`   | Lupa sobre la foto                                           |
| `e2e/interacciones.spec.ts`                        | 4 pruebas nuevas                                             |
| `e2e/vitrina.spec.ts`                              | Corrección de una prueba que fallaba a veces (ver más abajo) |

No se añadió ninguna librería: todo usa Motion, que ya estaba, y la API de animaciones del
navegador para el salto del icono.

## Comprobaciones ejecutadas

| Comprobación                      | Resultado                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Lint, tipos y formato             | Sin errores                                                                  |
| Build                             | Correcto                                                                     |
| Pruebas unitarias / API           | 30 de 30 / 45 de 45                                                          |
| Playwright (escritorio y celular) | 63 pasan; 5 se omiten a propósito (las de escritorio en celular y viceversa) |

Las pruebas nuevas comprueban, con un navegador real:

- que al agregar al carrito el sello está en el aire, el carrito aún no se abre, y al aterrizar
  el sello desaparece y el carrito se abre con el producto;
- que con "reducir movimiento" el carrito se abre al instante y no hay vuelo;
- que el corazón de una tarjeta marca el favorito sin abrir el producto;
- que la foto de la tarjeta se inclina con el cursor y vuelve a su sitio al salir.

**Prueba de la vitrina corregida.** La prueba del scroll de la vitrina (Fase 3) fallaba 1 de cada
10 veces, también en `main`: medía el final del recorrido mientras el resorte aún se movía. Ahora
espera a que la fila se detenga antes de medir. Pasó 15 de 15 veces seguidas.

**Un error encontrado y corregido durante la revisión:** con la foto inclinada, el corazón de la
tarjeta quedaba debajo del enlace del producto y no se podía pulsar. El corazón ahora está fuera del
marco que se inclina.

## Cómo verlo

```bash
npm run dev
```

Abre http://localhost:5173/catalogo, pasa el cursor sobre una tarjeta, marca un favorito y agrega
un producto al carrito desde su ficha.

## Pendiente

- Fotos de producto: la lupa de la ficha y la luz de las tarjetas lucen más con fotos reales.
- Fase 5: base de datos y API del panel administrativo.
