# Rediseño · Fase 7: pedidos y existencias

El panel tiene ahora una sección **Pedidos** (`/admin/pedidos`). Los pedidos que hacen los
clientes en la tienda llegan ahí como "Pendiente de confirmar". Desde el panel los confirmas,
sigues su avance y, si hace falta, los cancelas. Las existencias se descuentan y se devuelven
solas, y todo queda en el historial.

## Qué puedes hacer

| Pantalla               | Qué puedes hacer                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lista de pedidos**   | Buscar por número (`ES-2026-000123` o solo `123`), nombre del cliente, celular o ciudad. Filtrar por estado con pestañas que muestran cuántos pedidos hay en cada uno  |
| **Detalle del pedido** | Ver los productos con el nombre y el precio del momento del pedido, los datos del cliente, el historial de estados y los movimientos de inventario que causó el pedido |
| **Cambiar el estado**  | Cada botón abre una confirmación que explica qué va a pasar (por ejemplo, "Se descuentan del inventario 2 unidades"). Puedes dejar una nota, que queda en el historial |
| **Costo de envío**     | Escribir el valor en pesos. El servidor recalcula el total. Vacío = "por cotizar"; 0 = gratis                                                                          |
| **WhatsApp**           | El botón "Escribir por WhatsApp" abre el chat con el celular del cliente                                                                                               |

El **resumen** enlaza a cada pedido reciente y a la lista de pedidos por confirmar. En el
**inventario**, las ventas y devoluciones enlazan al pedido que las causó.

## Estados y existencias

```
Pendiente de confirmar ──► Confirmado ──► En preparación ──► Enviado ──► Entregado
          │                    │                │                │
          └────────────────────┴────────────────┴────────────────┴──► Cancelado
```

- **Confirmar descuenta las existencias.** Cada producto del pedido genera una "Venta" en el
  historial de inventario. Hazlo después de hablar con el cliente por WhatsApp. Muchos clientes
  abren WhatsApp y no envían el mensaje; si se descontara al hacer el pedido, esas unidades
  quedarían apartadas para nadie.
- **Nunca se descuenta dos veces.** El pedido guarda cuándo se descontó. Pasar a "En
  preparación", "Enviado" o "Entregado" no vuelve a descontar.
- **Cancelar devuelve las unidades** si ya se habían descontado. Cada producto genera una
  "Devolución" en el historial. Si el pedido estaba pendiente, cancelar no toca el inventario.
- **Cancelar pide un motivo**, que queda en el historial del pedido y en el de inventario.
- **Se puede cancelar un pedido enviado.** Sirve cuando la transportadora lo devuelve, por
  ejemplo si el cliente rechaza el pago contra entrega. Las unidades vuelven al inventario.
- **"Entregado" y "Cancelado" son finales.** Después no cambian de estado ni de costo de envío.
- **No se puede saltar pasos ni volver atrás.** Por ejemplo, un pedido pendiente no se puede
  marcar como enviado sin confirmarlo antes.

### Si no alcanzan las existencias

Si falta alguna unidad, el pedido **no se confirma y no cambia nada**. Tampoco se descuentan
los productos que sí alcanzaban. El panel dice cuál falta y cuántas quedan, por ejemplo: "Oud
Rosa (AR-0002) pide 3 y quedan 1". Antes de confirmar, la ficha del pedido muestra cuántas
unidades quedan de cada producto y avisa si alguna no alcanza.

### Dos confirmaciones a la vez

- **Dos pedidos distintos por la última unidad:** el descuento es una sola instrucción de la base
  de datos ("resta 1 solo si queda al menos 1"). PostgreSQL las aplica una detrás de otra. La
  primera confirma y la segunda recibe "no hay unidades suficientes".
- **El mismo pedido confirmado dos veces** (por ejemplo, desde dos pestañas): el cambio de estado
  solo se aplica si el pedido sigue en el estado en que lo viste. La segunda confirmación ve que
  ya cambió, no descuenta nada y el panel te pide recargar.

Las dos situaciones tienen su prueba automática con peticiones simultáneas.

## Cambio en el diseño del panel

Al revisar las capturas encontré que, en escritorio, las pestañas de estados empujaban la página
hacia la derecha y aparecía una franja vacía. La columna del contenido ya no crece más que la
pantalla: las pestañas y las tablas anchas se desplazan dentro de su recuadro. Una prueba lo
comprueba.

En el celular, el detalle del pedido muestra primero el estado, el cliente y el envío, que es lo
que se usa al atender. Después vienen los productos y el historial.

## Archivos

| Archivo                                            | Qué es                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `server/src/services/admin/orderAdmin.ts`          | Lista, detalle, cambios de estado con existencias y costo de envío |
| `server/src/validators/admin.ts`                   | Validación de la búsqueda, el cambio de estado y el envío          |
| `server/src/routes/admin.ts`, `adminController.ts` | Las cuatro rutas nuevas                                            |
| `server/src/middlewares/errorHandler.ts`           | Devuelve qué productos no alcanzan                                 |
| `server/src/services/admin/inventoryAdmin.ts`      | Los movimientos incluyen el pedido que los causó                   |
| `server/tests/adminOrders.test.ts`                 | 12 pruebas nuevas de la API                                        |
| `client/src/admin/pages/OrdersPage.tsx`            | Lista de pedidos                                                   |
| `client/src/admin/pages/OrderDetailPage.tsx`       | Detalle, cambio de estado y costo de envío                         |
| `client/src/admin/components/AdminLayout.tsx`      | "Pedidos" en el menú y corrección del desbordamiento               |
| `client/src/admin/pages/DashboardPage.tsx`         | Enlaces a los pedidos                                              |
| `client/src/admin/components/MovementsTable.tsx`   | Enlace al pedido desde el historial de inventario                  |
| `e2e/admin.spec.ts`                                | Recorrido completo de un pedido en el navegador                    |

No hay migración nueva: las tablas y campos que usa esta fase (`OrderStatusChange`,
`stockDeductedAt`, el estado "En preparación") se crearon en la Fase 5. No se añadió ninguna
librería.

### Rutas nuevas (`/api/admin`, todas exigen sesión)

| Ruta                         | Qué hace                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| `GET /orders`                | Lista con búsqueda (`q`), estado y paginación                |
| `GET /orders/:id`            | Detalle completo                                             |
| `PATCH /orders/:id/status`   | Cambiar el estado (con nota; motivo obligatorio al cancelar) |
| `PATCH /orders/:id/shipping` | Fijar el costo de envío o dejarlo por cotizar                |

## Comprobaciones ejecutadas

| Comprobación                      | Resultado                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Lint, tipos y formato             | Sin errores                                                                  |
| Build                             | Correcto                                                                     |
| Pruebas unitarias del cliente     | 33 de 33                                                                     |
| Pruebas de la API                 | 128 de 128 (16 nuevas)                                                       |
| Playwright (escritorio y celular) | 70 pasan; 8 se omiten a propósito (las de escritorio en celular y viceversa) |

Las pruebas nuevas de la API comprueban, contra PostgreSQL real:

- la búsqueda por número, nombre, celular y ciudad, y el filtro por estado;
- que el detalle muestra el precio del momento del pedido aunque el producto cambie después;
- que confirmar descuenta, deja una "Venta" por producto y una línea en el historial con el
  nombre del administrador, y que los estados siguientes no vuelven a descontar;
- los cambios de estado no permitidos;
- que cancelar exige motivo, que cancelar un pendiente no toca las existencias y que cancelar
  uno enviado las devuelve;
- que si falta una unidad no cambia nada (ni el estado, ni las existencias, ni el historial);
- dos pedidos confirmados a la vez por la última unidad: uno gana y el otro recibe el aviso;
- el mismo pedido confirmado tres veces a la vez: descuenta una sola vez;
- que cambiar el estado exige el origen del panel;
- el costo de envío: total recalculado, gratis, por cotizar, valores inválidos y pedidos
  cerrados;
- que las 4 rutas nuevas responden 401 sin sesión.

La prueba nueva de Playwright hace el recorrido completo en un navegador: un cliente hace un
pedido, el administrador lo busca por número, fija el envío (el total pasa de $600.000 a
$612.000), lo confirma (aparece la venta de −2) y lo cancela. Primero lo intenta sin motivo y
el panel lo pide; luego con motivo, y aparece la devolución de +2. También comprueba que la
página no se sale de la pantalla. Comprobé que esta última parte falla sin la corrección del
diseño y pasa con ella.

## Cómo verlo

```bash
npm run dev
```

Haz un pedido en http://localhost:5173 y ábrelo en http://localhost:5173/admin/pedidos. En tu
base de datos de desarrollo solo hay productos DEMO, y la tienda no deja pedirlos. Para probar,
crea un producto en el panel (sin marcarlo como DEMO), publícalo y pídelo desde la tienda.
Cuando termines, archívalo.

## Pendiente

- **Fase 8:** revisión de seguridad, despliegue en Railway (API, panel y base de datos), fotos en
  un volumen persistente o en Cloudflare R2, y la tienda en GitHub Pages apuntando a la API.
- **Tus datos para lanzar:** catálogo real con fotos, datos de la política de tratamiento de
  datos, y condiciones de envío y de pago contra entrega.
