# Rediseño · Fase 6: panel administrativo

El panel vive en **`/admin`**. Tiene su propio diseño (menú lateral negro y dorado, contenido claro)
y no muestra el header ni el footer de la tienda. Todo lo que ves en él viene de la base de datos
a través de la API de la Fase 5: no hay datos de ejemplo ni botones de adorno.

## Secciones

| Sección                 | Qué puedes hacer                                                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Iniciar sesión**      | Entrar con tu correo y contraseña. Si la sesión caduca mientras trabajas, el panel lo avisa y, al volver a entrar, sigues en la misma sección                                                   |
| **Resumen**             | Productos publicados, borradores, stock bajo y pedidos por confirmar. Incluye la lista de stock bajo, los pedidos recientes, los confirmados en 30 días y los últimos movimientos de inventario |
| **Productos**           | Buscar por nombre, marca, nota o SKU, y filtrar por estado, categoría o existencias (stock bajo o agotado)                                                                                      |
| **Ficha de producto**   | Crear y editar todos los datos, subir fotos, elegir la principal, ordenarlas, describirlas y borrarlas. Publicar, despublicar, archivar o eliminar. Registrar entradas y ajustes de inventario  |
| **Inventario**          | Registrar entradas de mercancía y ajustes de cualquier producto, y ver el historial completo filtrado por tipo                                                                                  |
| **Categorías y marcas** | Crear, renombrar y borrar. Solo se puede borrar si no tiene productos                                                                                                                           |

### Detalles importantes

- **Un producto nuevo se crea como borrador.** No aparece en la tienda hasta que pulses
  "Publicar". Si le faltan la descripción corta o la descripción, el panel dice exactamente qué
  falta.
- **Antes de publicar, despublicar, archivar o eliminar**, el panel pide confirmación y explica
  qué va a pasar.
- **"Eliminar" solo aparece** si el producto nunca tuvo pedidos ni movimientos de inventario. Si
  los tuvo, se archiva: deja de verse en la tienda y su historial se conserva.
- **La dirección del producto** (`/producto/...`) se crea sola a partir del nombre. Puedes
  cambiarla a mano.
- **Los errores salen junto a cada campo**, con el mensaje del servidor. Por ejemplo: "No puede
  ser negativo" o "Ya existe un producto con el SKU AR-0001".
- **El formulario no se borra** si subes fotos o registras inventario antes de guardarlo.
- **Las fotos** se revisan en el navegador (formato y 8 MB máximo) y otra vez en el servidor. Si
  no hay fotos, la tienda sigue mostrando "Imagen próximamente".
- **Las ventas y devoluciones** las registrará el sistema en la Fase 7, al confirmar o cancelar
  pedidos. Desde el panel solo se registran entradas y ajustes.
- **Categorías nuevas:** el menú de la tienda muestra las cuatro categorías principales, cada una
  con su diseño y sus textos. Si creas otra, sus productos aparecen en el catálogo completo y en
  la búsqueda, pero no tendrá sección propia en el menú hasta que se diseñe. El panel lo avisa.

## Seguridad

- **El código del panel solo se descarga al entrar en `/admin`.** Un cliente de la tienda nunca
  lo recibe.
- **No se incluye en GitHub Pages:** comprobé que la compilación de la vista previa no tiene
  ningún archivo del panel.
- **React nunca ve la sesión ni la contraseña.** La sesión es la cookie HttpOnly de la Fase 5 y
  el servidor la comprueba en cada petición. Ocultar un botón en la pantalla no protege nada: la
  protección real está en la API.
- **Fuera de los buscadores:** la página lleva `noindex` y el servidor añade la cabecera
  `X-Robots-Tag` en `/admin`.
- **No aparece en menús ni en el mapa del sitio.**

## Archivos

| Archivo                                        | Qué es                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `client/src/admin/AdminApp.tsx`                | Entrada del panel: comprueba la sesión y define sus rutas             |
| `client/src/admin/adminApi.ts`, `session.ts`   | Peticiones a la API del panel y estado de la sesión                   |
| `client/src/admin/components/AdminLayout.tsx`  | Menú lateral (arriba en celulares) y cierre de sesión                 |
| `client/src/admin/components/ui.tsx`           | Botones, campos, avisos, confirmaciones y paginación                  |
| `client/src/admin/components/Product*.tsx`     | Formulario, fotos e inventario de la ficha                            |
| `client/src/admin/components/Movement*.tsx`    | Formulario e historial de inventario                                  |
| `client/src/admin/pages/*`                     | Inicio de sesión, resumen, productos, inventario, categorías y marcas |
| `client/src/admin/productForm.ts` (+ prueba)   | Conversión de precios, notas y dirección del producto                 |
| `client/src/app/router.tsx`                    | Ruta `/admin`, excluida de GitHub Pages                               |
| `client/vite.config.ts`                        | En desarrollo, `/uploads` también va al servidor                      |
| `server/src/web/storefront.ts`                 | `X-Robots-Tag: noindex` en `/admin`                                   |
| `e2e/admin.spec.ts`, `server/tests/e2eSeed.ts` | Pruebas del panel y su administrador de pruebas                       |

No se añadió ninguna librería.

## Comprobaciones ejecutadas

| Comprobación                      | Resultado                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Lint, tipos y formato             | Sin errores                                                                  |
| Build                             | Correcto. La compilación de GitHub Pages no incluye el panel                 |
| Pruebas unitarias del cliente     | 33 de 33 (3 nuevas)                                                          |
| Pruebas de la API                 | 112 de 112                                                                   |
| Playwright (escritorio y celular) | 69 pasan; 7 se omiten a propósito (las de escritorio en celular y viceversa) |

Las pruebas nuevas recorren el panel con un navegador real:

- **Acceso:** sin sesión pide entrar. Con una contraseña incorrecta lo niega y, con la correcta,
  vuelve a la sección pedida. La cookie no es legible desde JavaScript y al cerrar sesión ya no se
  puede volver.
- **Sesión caducada:** el panel avisa y, al volver a entrar, sigue en la misma sección.
- **Producto completo:** crearlo con un precio negativo muestra el error junto al campo. Después
  se crea con el precio correcto y se sube una foto, que se convierte a WebP. Publicarlo sin
  descripciones lo impide; al completarlas se publica y se ve en la tienda con su foto. Al
  despublicarlo desaparece de la tienda.
- **Inventario:** una entrada suma las unidades y aparece en el historial. Un ajuste que dejaría
  existencias negativas se rechaza.

El acceso y la sesión caducada se prueban también en celular. Además revisé las pantallas en
escritorio y en celular.

## Cómo verlo

```bash
npm run dev
```

Abre http://localhost:5173/admin y entra con el usuario que creaste con `npm run admin:crear`. Si
aún no lo tienes, mira la guía de la Fase 5.

## Pendiente

- **Fase 7:** pedidos en el panel (búsqueda, detalle, cambio de estado, costo de envío), descuento
  de stock al confirmar y devolución al cancelar.
- **Configuración:** no la incluí. Hoy no hay nada configurable que funcione de verdad, y una
  sección vacía con botones falsos va contra lo que pediste.
