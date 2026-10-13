# Rediseño · Fase 5: base de datos y API del panel administrativo

Esta fase prepara el servidor para el panel. **Todavía no hay pantallas**: el panel (`/admin`)
llega en la Fase 6. Lo que existe ahora es la parte de atrás. Incluye las tablas nuevas, el
inicio de sesión seguro, las rutas que usará el panel y las pruebas que comprueban que nadie sin
sesión puede tocar nada.

## Qué cambió en la base de datos

Una migración nueva (`server/prisma/migrations/…_panel_admin`):

| Tabla o campo               | Para qué                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `AdminUser`                 | Personas con acceso al panel. Guarda la huella Argon2id de la contraseña, nunca la contraseña                                |
| `AdminSession`              | Sesiones abiertas. Guarda la huella del código de la cookie, no el código                                                    |
| `InventoryMovement`         | Historial de existencias: entrada, ajuste, venta y devolución, con cantidad, existencias resultantes, motivo, quién y cuándo |
| `OrderStatusChange`         | Historial de estados de cada pedido (se usará en la Fase 7)                                                                  |
| `Product.lowStockThreshold` | Desde cuántas unidades se avisa de "stock bajo" (por defecto 2)                                                              |
| `ProductImage`              | Ahora guarda dónde está la foto subida (`storageKey`) y sus medidas (`widths`)                                               |
| `Order.stockDeductedAt`     | Fecha en que se descontó el stock del pedido. Evita descontar dos veces (Fase 7)                                             |
| Estado `EN_PREPARACION`     | Nuevo estado de pedido entre "Confirmado" y "Enviado"                                                                        |

**Reglas que hace cumplir PostgreSQL**, aunque falle el código:

- El historial de inventario **no se puede editar, borrar ni vaciar**. Un error se corrige con un
  ajuste nuevo.
- Las entradas y devoluciones siempre suman y las ventas siempre restan. Ningún movimiento es de 0
  unidades ni deja existencias negativas.
- Un administrador con movimientos registrados no se puede borrar, solo desactivar.
- Los correos de administrador se guardan siempre en minúsculas.

## Inicio de sesión

- **Contraseñas con Argon2id**, con los parámetros mínimos que recomienda OWASP.
- **Cookie de sesión** `HttpOnly` (el JavaScript de la página no puede leerla), `SameSite=Strict`
  y, en producción, `Secure` con el prefijo `__Host-` (solo HTTPS y solo este dominio).
- La sesión **caduca tras 2 horas sin actividad** y, como máximo, **a las 12 horas**. También se
  cierra al cerrar sesión, al desactivar la cuenta o al cambiar la contraseña.
- **5 intentos fallidos cada 15 minutos**, por IP y por correo. Los inicios correctos no cuentan.
- **Siempre el mismo mensaje** ("Correo o contraseña incorrectos"), y con el mismo tiempo de
  respuesta, exista o no el correo.
- **Protección contra peticiones falsificadas:** toda petición que cambia datos debe venir de la
  dirección del panel (`ADMIN_ORIGIN`). Si no, responde 403, aunque haya una sesión abierta.
- Las rutas del panel **no tienen CORS**, así que la tienda en GitHub Pages no puede llamarlas.
  Tampoco se guardan en caché ni aparecen en buscadores.

### Crear el primer administrador

No hay ninguna contraseña en el código. Se crea desde la terminal:

```bash
npm run admin:crear
```

Pide nombre, correo y contraseña. La contraseña no se ve mientras la escribes y debe tener al
menos 12 caracteres. Una frase de varias palabras es lo ideal. Para cambiar una contraseña
olvidada:

```bash
npm run admin:crear -- --cambiar-contrasena
```

## Rutas nuevas (`/api/admin`)

Todas, salvo iniciar y cerrar sesión, exigen una sesión vigente. Sin ella responden 401.

| Ruta                                                    | Qué hace                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Iniciar sesión, cerrarla y saber quién está conectado                     |
| `GET /dashboard`                                        | Resumen con cifras reales de la base de datos                             |
| `GET`, `POST /products`                                 | Listar (búsqueda, estado, categoría, marca, stock bajo o agotado) y crear |
| `GET`, `PATCH`, `DELETE /products/:id`                  | Ver, editar y borrar                                                      |
| `PATCH /products/:id/status`                            | Publicar, pasar a borrador o archivar                                     |
| `POST /products/:id/images`                             | Subir una foto                                                            |
| `PUT /products/:id/images/order`                        | Ordenar la galería (la primera es la principal)                           |
| `PATCH`, `DELETE /products/:id/images/:imageId`         | Cambiar el texto alternativo y borrar una foto                            |
| `GET`, `POST /inventory/movements`                      | Historial de inventario y registrar entradas o ajustes                    |
| `/categories` y `/brands`                               | Listar, crear, editar y borrar                                            |

### Reglas de productos

- Un producto nuevo **nace como borrador**. Sus existencias iniciales quedan en el historial como
  una entrada ("Inventario inicial").
- **Las existencias no se editan a mano.** Solo cambian con una entrada o un ajuste, y quedan
  registradas con su motivo y con el nombre de quien las hizo.
- Para **publicar**, el producto necesita precio mayor que 0, descripción corta y descripción.
  Las fotos no son obligatorias: sin foto, la tienda muestra "Imagen próximamente".
- El precio anterior solo se acepta si es mayor que el precio actual, es decir, si el descuento es
  real.
- SKU y dirección repetidos se rechazan diciendo cuál choca.
- Un producto con pedidos o movimientos **no se borra: se archiva**. Así los pedidos antiguos y el
  historial siguen intactos.
- Una categoría o marca con productos no se borra.

### Existencias que nunca bajan de cero

El ajuste es una sola instrucción en la base de datos: "resta N solo si quedan al menos N". Si
llegan varios ajustes a la vez por la última unidad, PostgreSQL los aplica uno detrás de otro y solo
uno se aplica. La prueba lo comprueba con tres ajustes simultáneos: uno se acepta y dos se rechazan.

### Fotos

- Solo JPG, PNG o WebP, de **máximo 8 MB** y mínimo 300 px de ancho.
- El tipo se comprueba **leyendo el contenido del archivo**, no su nombre. Un texto renombrado a
  `.png` se rechaza.
- Se gira según la orientación de la cámara y **se borran los metadatos**, como la ubicación GPS.
- Se convierte a **WebP en tres medidas**: 480, 960 y 1600 px, sin agrandar fotos pequeñas.
- Se guardan en la carpeta `UPLOADS_DIR` del servidor y se sirven en `/uploads/...` con caché de un
  año. La tienda en GitHub Pages puede mostrarlas.

### Otros cambios

- **Importador de catálogo:** los cambios de existencias quedan en el historial. Al reimportar se
  conservan las fotos subidas desde el panel.
- **Semilla DEMO:** registra el inventario inicial como una entrada y, si la vuelves a ejecutar, ya
  no sobrescribe las existencias.

## Variables de entorno nuevas (`server/.env`)

| Variable       | En tu computador                              | En producción                                    |
| -------------- | --------------------------------------------- | ------------------------------------------------ |
| `ADMIN_ORIGIN` | `http://localhost:5173,http://localhost:4000` | La dirección del servicio en Railway             |
| `UPLOADS_DIR`  | `uploads`                                     | Una carpeta en un volumen persistente de Railway |

Si ya tienes `server/.env`, añade estas dos líneas (están en `server/.env.example`).

## Librerías nuevas (servidor)

| Librería          | Para qué                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| `@node-rs/argon2` | Huellas de contraseña Argon2id. Viene compilada, no requiere herramientas extra |
| `sharp`           | Revisar y convertir las fotos a WebP                                            |
| `multer`          | Recibir el archivo de la foto                                                   |

## Comprobaciones ejecutadas

| Comprobación                      | Resultado                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Lint, tipos y formato             | Sin errores                                                                  |
| Build                             | Correcto                                                                     |
| Pruebas unitarias del cliente     | 30 de 30                                                                     |
| Pruebas de la API                 | 112 de 112 (67 nuevas)                                                       |
| Playwright (escritorio y celular) | 63 pasan; 5 se omiten a propósito (las de escritorio en celular y viceversa) |

Las pruebas nuevas comprueban, contra una base de datos PostgreSQL real:

- que **las 23 rutas del panel** responden 401 sin sesión, también con una cookie inventada;
- que la cookie es `HttpOnly` y `SameSite=Strict`, y que la base de datos no guarda el código;
- el mismo mensaje para contraseña incorrecta, correo inexistente y cuenta inactiva;
- el bloqueo tras 5 intentos fallidos;
- el rechazo de peticiones desde otro sitio, incluso con sesión abierta;
- la caducidad de la sesión por inactividad (2 h), por tiempo máximo (12 h) y al desactivar la
  cuenta;
- la validación de productos: precio negativo o con decimales, SKU con formato incorrecto, SKU o
  dirección repetidos, descuento falso, intento de editar las existencias y publicación de un
  producto incompleto;
- que publicar muestra el producto en la tienda y archivar lo oculta;
- que no se borra un producto con historial;
- el inventario: entradas, ajustes que dejarían existencias negativas, tres ajustes simultáneos
  por la última unidad, y que PostgreSQL impide editar, borrar o vaciar el historial;
- las fotos: conversión a WebP, rechazo de archivos falsos, GIF, fotos pequeñas y de más de 8 MB,
  orden de la galería y borrado de los archivos;
- categorías y marcas: no se borran con productos, y renombrar una marca actualiza la búsqueda;
- que el resumen cuenta lo que hay en la base de datos.

Además probé a mano, en una terminal real, `npm run admin:crear`. Rechaza una contraseña corta,
no muestra la contraseña mientras se escribe y la cuenta creada inicia sesión contra la API. La
semilla DEMO ejecutada dos veces sobre una base vacía deja las existencias iguales a la suma del
historial.

## Cómo probarlo tú

```bash
npm install                 # instala las librerías nuevas
npm run db:migrate          # aplica la migración panel_admin
npm run admin:crear         # crea tu usuario
npm run dev
```

Como el panel aún no tiene pantallas, puedes comprobar el acceso con `curl`:

```bash
curl -i -c cookies.txt -H "Origin: http://localhost:5173" -H "Content-Type: application/json" \
  -d '{"email":"tu@correo.com","password":"tu contraseña"}' http://localhost:4000/api/admin/auth/login
curl -b cookies.txt http://localhost:4000/api/admin/dashboard
```

Sin la cookie, la segunda petición responde 401.

## Pendiente

- **Fase 6:** las pantallas del panel en `/admin`, que usarán estas rutas.
- **Fase 7:** pedidos en el panel, con descuento de stock al confirmar y devolución al cancelar.
- **Fotos en producción (Fase 8):** en Railway, `UPLOADS_DIR` debe estar en un volumen persistente.
  Si no, las fotos se pierden en cada despliegue. La otra opción es un almacenamiento externo como
  Cloudflare R2. El servidor ya está preparado para cambiar de almacenamiento sin tocar el resto,
  pero esa conexión no está hecha ni probada todavía.
