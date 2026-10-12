# Fase 6: Pedidos y WhatsApp

## Qué puede hacer ahora el cliente

1. Desde el carrito (o el panel lateral) pulsa **Continuar con el pedido**.
2. En `/pedido` escribe:
   - nombre y celular;
   - departamento, ciudad, dirección y observaciones;
   - la forma de pago.

   También acepta la política de datos.

3. Pulsa **Registrar pedido**. El servidor revisa todo y guarda el pedido con un número, por ejemplo
   `ES-2026-000001`.
4. En `/pedido/confirmacion` ve el resumen y el botón **Enviar pedido por WhatsApp**. WhatsApp se abre
   con el mensaje listo, con número de pedido, productos, totales, forma de pago y dirección. El
   cliente solo pulsa Enviar.

El pedido queda **pendiente de confirmación**. Tú confirmas por WhatsApp la disponibilidad, el costo
de envío y el pago.

## Reglas que aplica el servidor

- **El navegador solo envía qué productos y cuántos.** Precios, nombres y existencias salen de la base
  de datos; el subtotal y el total se calculan en el servidor con aritmética decimal exacta.
- **No acepta:**
  - productos DEMO;
  - productos agotados, retirados o no publicados;
  - más unidades de las disponibles.

  Responde cuáles fallaron y por qué, y la tienda lo explica ("Incienso Sagrado se agotó") y
  actualiza el carrito.

- **Valida los datos:**
  - celular colombiano de 10 dígitos que empieza por 3;
  - departamento de una lista cerrada;
  - longitudes máximas;
  - autorización de datos obligatoria.

  La tienda usa las mismas reglas para avisar al instante, en español.

- **Guarda una copia de cada producto pedido** (nombre, marca, referencia, tamaño y precio). Si mañana
  cambias un precio o un nombre, el pedido histórico no cambia.
- **Anti-abuso:**
  - máximo 10 pedidos cada 15 minutos por dirección IP;
  - un campo trampa invisible que solo llenan los robots.
- **Privacidad:**
  - la respuesta de la API no incluye teléfono ni dirección;
  - los registros del servidor solo anotan el número de pedido y el total.
  - la dirección que ve el cliente en la confirmación se guarda solo en su pestaña y se borra al
    cerrarla.

## Decisiones provisionales (cámbialas cuando tengas los datos reales)

| Tema              | Cómo quedó                                                                                            | Dónde se cambia                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Existencias       | Se **comprueban** pero **no se descuentan** al registrar; se descuentan cuando confirmas el pedido    | `server/src/services/orderService.ts`                   |
| Envío             | "Pendiente de cotización" (el total es el subtotal)                                                   | Campo `shippingCost` del pedido                         |
| Formas de pago    | "Pago contra entrega" (sujeto a cobertura, se confirma por WhatsApp) o "Acordar por WhatsApp"         | `PaymentMethod` en `schema.prisma` y `CheckoutForm.tsx` |
| Política de datos | **Borrador** en `/politica-de-datos`, con aviso visible; faltan razón social, NIT, domicilio y correo | `client/src/pages/PrivacyPolicyPage.tsx`                |

Cada pedido guarda la **fecha** en que el cliente autorizó el tratamiento de datos y la **versión**
de la política que aceptó (Ley 1581 de 2012). Si cambias el texto de la política, cambia también su
versión en `PrivacyPolicyPage.tsx` y en `server/src/config/policies.ts`.

## Cómo ver los pedidos

Todavía no hay panel de administración. Mientras tanto:

- Llegan a tu WhatsApp cuando el cliente pulsa Enviar.
- Puedes verlos en la base de datos con `npm run db:studio`, tabla `Order`. El número visible
  `ES-2026-000123` corresponde al campo `number` (123).

## Pruebas

- **API:** 8 pruebas nuevas de pedidos (30 en total):
  - totales calculados en el servidor (ignora un precio enviado por el navegador);
  - no se descuentan existencias;
  - rechazo de DEMO, agotados, inexistentes y existencias insuficientes, sin guardar nada;
  - validación de datos, autorización obligatoria, productos repetidos;
  - campo trampa y JSON mal formado;
  - número de pedido con el año de Colombia.
- **Tienda:** 5 pruebas nuevas (26 en total): reglas del formulario, normalización del celular y
  mensaje de WhatsApp. Ese mensaje lleva un `#` de dirección bien codificado en el enlace.

## Siguiente fase

Fase 7, **pruebas, seguridad y optimización**:

- pruebas de punta a punta en el navegador;
- revisión de seguridad y de `npm audit`;
- accesibilidad;
- reducción del tamaño del JavaScript.
