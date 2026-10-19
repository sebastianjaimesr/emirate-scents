# Guía de estudio: Emirate Scents

Guía para entender, explicar y sustentar la tienda. Complementa el `README.md` (instalación y comandos), los documentos de `docs/` (decisiones de cada fase) y los comentarios en español del código.

---

## 1. ¿Qué es este proyecto?

Una **tienda online de perfumes** completa (full-stack):

- **Tienda pública:** inicio con un frasco 3D, catálogo con filtros, ficha de producto, favoritos, carrito y formulario de compra. El pedido se confirma con el negocio por **WhatsApp**.
- **Panel de administración (`/admin`):** productos y fotos, categorías y marcas, inventario, pedidos y un resumen con cifras reales.
- **API propia** que guarda todo en **PostgreSQL**.

## 2. Lenguajes y tecnologías

| Parte                | Tecnología                                        | Para qué                                                              |
| -------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| Todo                 | **TypeScript**                                    | Un solo lenguaje con tipos en el frontend, el backend y las pruebas.  |
| Frontend (`client/`) | **React 19** + **Vite**                           | Interfaz por componentes y servidor de desarrollo.                    |
|                      | **React Router**                                  | Páginas y rutas (`/catalogo`, `/producto/:slug`, `/admin`…).          |
|                      | **Tailwind CSS**                                  | Estilos con clases utilitarias.                                       |
|                      | **Zustand**                                       | Estado global: carrito, favoritos, sesión del panel.                  |
|                      | **React Hook Form + Zod**                         | Formulario de compra y sus validaciones.                              |
|                      | **Motion**                                        | Animaciones.                                                          |
|                      | **Three.js + React Three Fiber**                  | El frasco 3D del inicio.                                              |
| Backend (`server/`)  | **Node.js + Express 5**                           | La API REST (`/api/...`).                                             |
|                      | **Prisma** + **PostgreSQL**                       | Base de datos y acceso a ella con tipos.                              |
|                      | **Zod**                                           | Validación de todo lo que llega a la API.                             |
|                      | **Argon2**                                        | Cifrado de contraseñas de administradores.                            |
|                      | **sharp** + **multer**                            | Subida y conversión de fotos a WebP.                                  |
|                      | **helmet**, **express-rate-limit**, **pino**      | Seguridad de cabeceras, límite de peticiones y registros.             |
| Pruebas              | **Vitest**, **Supertest**, **Playwright** (+ axe) | Unitarias, de la API y de extremo a extremo (incluida accesibilidad). |
| Calidad              | **oxlint**, **Prettier**, **GitHub Actions**      | Linter, formato y ejecución automática de pruebas.                    |

## 3. Cómo está organizado (monorepo)

```
emirate-scents/
├── client/            Tienda y panel (React)
│   └── src/
│       ├── app/          Rutas y estructura común (RootLayout)
│       ├── pages/        Una página por ruta (CatalogPage, ProductPage, CartPage…)
│       ├── features/     Lógica por funcionalidad: cart, catalog, checkout, favorites, hero3d…
│       ├── components/   Piezas reutilizables (layout, products, ui, brand)
│       ├── services/     Llamadas a la API (apiClient, productService, orderService)
│       ├── admin/        Panel de administración completo (se descarga solo al entrar)
│       ├── lib/ hooks/   Utilidades (formato de pesos, WhatsApp, disponibilidad…)
│       └── types/        Tipos compartidos (Product, Order…)
├── server/            API (Express)
│   ├── prisma/           schema.prisma (tablas), migraciones y datos iniciales (seed)
│   └── src/
│       ├── routes/       Qué URL va a qué controlador
│       ├── controllers/  Reciben la petición, validan y responden
│       ├── services/     Reglas de negocio y consultas con Prisma
│       ├── validators/   Esquemas Zod de cada entrada
│       ├── admin/        Sesiones y protecciones del panel
│       └── middlewares/  Manejo central de errores
├── e2e/               Pruebas de extremo a extremo (Playwright)
└── docs/              Decisiones y documentación de cada fase
```

**En el servidor el flujo es:** ruta → controlador → (validador Zod) → servicio → Prisma → PostgreSQL.

## 4. Flujos principales

### 4.1 Ver el catálogo

1. `CatalogPage` lee los filtros de la **URL** (`?marca=…&tamano=…`) con `useCatalogQuery`. Por eso un enlace con filtros se puede compartir.
2. `productService.getProducts()` llama a `GET /api/products` con esos parámetros.
3. En el servidor, `catalogQuerySchema` (Zod) valida los parámetros y `catalogService.listProducts()` arma la consulta de Prisma (solo productos **publicados**), cuenta el total y devuelve una página.

### 4.2 Carrito y favoritos

- Viven en el navegador con **Zustand + `persist`** (localStorage): sobreviven a recargar la página sin necesidad de cuenta.
- El carrito solo guarda `id` y cantidad. Para mostrarlo, `useCartDetails` pide los productos actualizados (`GET /api/catalog/lookup?ids=…`), así el precio y el stock siempre son los reales.
- Las funciones del carrito (`cartItems.ts`) son **puras** (reciben datos y devuelven datos nuevos), lo que las hace fáciles de probar.

### 4.3 Hacer un pedido (el más importante para sustentar)

1. `CheckoutForm` valida los datos con **React Hook Form + Zod** (`checkoutSchema`): nombre, celular colombiano, departamento, ciudad, dirección, método de pago y autorización de datos.
2. Se envía `POST /api/orders` con los datos del cliente y solo **ids y cantidades** (nunca precios).
3. En el servidor, `createOrderSchema` valida todo otra vez, y `createOrder()` dentro de una **transacción**:
   - Busca los productos en la base y rechaza los que no existen, son DEMO, están agotados o no tienen unidades suficientes (responde con la lista de problemas).
   - Calcula los totales con los **precios de la base de datos**.
   - Guarda el pedido con una copia ("snapshot") del nombre, marca, SKU y precio de cada producto.
4. La tienda guarda el pedido en `sessionStorage` y muestra `OrderConfirmationPage`, que arma el mensaje y el enlace de **WhatsApp** para confirmarlo con el negocio.

### 4.4 Inventario (regla del negocio)

- Un pedido nuevo **no** descuenta unidades: queda "Pendiente de confirmación".
- Cuando el administrador lo pasa a **CONFIRMADO**, se descuentan las unidades (movimiento VENTA).
- Si se **cancela** un pedido ya descontado, las unidades vuelven (movimiento DEVOLUCION).
- Las transiciones permitidas están en `ORDER_TRANSITIONS` (`orderAdmin.ts`); todo ocurre en una transacción.

### 4.5 Panel de administración

- Inicio de sesión con correo y contraseña (cifrada con **Argon2**). Se crea una sesión en la base y se envía una **cookie httpOnly** (JavaScript no la puede leer).
- En la base se guarda la **huella SHA-256** del token, no el token real.
- Todas las rutas `/api/admin` revisan la sesión (`requireAdmin`) y el origen de la petición (`requireAdminOrigin`), y tienen límite de intentos.
- El código del panel se carga con _lazy loading_: un cliente de la tienda nunca lo descarga.

## 5. Seguridad (pregunta casi segura)

| Riesgo                                   | Cómo se protege                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Alguien cambia el precio en el navegador | El servidor ignora precios del cliente y usa los de la base.                                      |
| Datos inválidos o maliciosos             | Zod valida cada entrada en el servidor (además de la validación del formulario).                  |
| Robots que envían pedidos                | Campo trampa invisible (`website`) y límite de 10 pedidos cada 15 minutos por IP.                 |
| Fuerza bruta en el login                 | Límite de intentos y el mismo mensaje de error para correo o contraseña incorrectos.              |
| Adivinar correos midiendo el tiempo      | Si el correo no existe, se compara contra una huella falsa (`getDummyHash`) para tardar lo mismo. |
| Robo de la sesión con JavaScript         | Cookie `httpOnly`; en la base solo se guarda la huella del token.                                 |
| Cabeceras inseguras                      | `helmet`.                                                                                         |
| Datos personales en los registros        | Los logs del pedido solo guardan número y total.                                                  |
| Productos de ejemplo vendidos por error  | Los productos DEMO no se pueden comprar.                                                          |

## 6. Conceptos clave

**API REST.** El frontend y el backend se comunican con peticiones HTTP (`GET` para leer, `POST` para crear, `PATCH`/`PUT`/`DELETE` en el panel) y respuestas JSON.

**ORM (Prisma).** En vez de escribir SQL, se usa `prisma.product.findMany({ where: … })`. El esquema (`schema.prisma`) define las tablas y Prisma genera tipos de TypeScript.

**Migraciones.** Archivos SQL versionados (`prisma/migrations`) que crean o cambian las tablas de forma ordenada.

**Transacción.** `prisma.$transaction(...)`: varias operaciones que se aplican todas o ninguna (crear pedido, cambiar estado y stock).

**DTO.** Objeto que se envía al cliente (`toProductDto`), distinto del registro de la base: solo lleva lo necesario y en el formato que espera la tienda.

**Validar en ambos lados.** El formulario valida para dar una buena experiencia; el servidor valida porque es el único lugar confiable.

**Lazy loading.** El panel, la escena 3D y las páginas se descargan solo cuando se necesitan.

**Modo vista previa.** Con `VITE_PREVIEW=true` la tienda funciona sin servidor, con productos DEMO filtrados en el navegador (`services/preview`).

## 7. Cómo ejecutarlo

```powershell
npm install
npm run db:migrate     # crea las tablas
npm run db:seed        # carga categorías y productos DEMO
npm run dev            # API en :4000 y tienda en :5173
npm run admin:crear    # crea un administrador para /admin
npm test               # pruebas unitarias y de la API
npm run test:e2e       # pruebas en el navegador (Playwright)
```

## 8. Preguntas de sustentación (con respuesta)

1. **¿Por qué TypeScript en todo el proyecto?** Un solo lenguaje con tipos: los errores (un campo mal escrito, un tipo incorrecto) aparecen al compilar y no en producción.
2. **¿Cómo evitas que alguien compre a un precio falso?** El cliente solo envía ids y cantidades; el servidor busca el precio en la base dentro de la transacción.
3. **¿Por qué el pedido no descuenta inventario al crearse?** Porque el pago se acuerda por WhatsApp; si el cliente no confirma, no se deben bloquear unidades. Se descuentan al confirmar y se devuelven si se cancela.
4. **¿Qué es Prisma y por qué lo usaste?** Un ORM: permite consultar la base con funciones tipadas, maneja migraciones y evita la inyección SQL.
5. **¿Dónde se guarda el carrito?** En el navegador (Zustand + localStorage). Al mostrarlo se piden precios y stock actualizados a la API.
6. **¿Cómo funciona el inicio de sesión del panel?** Argon2 compara la contraseña; si es correcta se crea una sesión en la base (guardando la huella del token) y se envía una cookie httpOnly.
7. **¿Por qué validas con Zod en el servidor si el formulario ya valida?** Porque cualquiera puede enviar peticiones sin usar el formulario; el servidor no puede confiar en el cliente.
8. **¿Qué pruebas tiene?** Vitest para funciones (carrito, filtros, validaciones), Supertest para la API con una base de pruebas, y Playwright para el flujo completo de compra, el panel y la accesibilidad.
9. **¿Cómo cuidaste el rendimiento?** Lazy loading de páginas, panel y escena 3D; imágenes WebP en varios anchos; compresión de respuestas; paginación del catálogo.
10. **¿Qué es un "snapshot" en las líneas del pedido?** Una copia del nombre, SKU y precio al momento de la compra: si después cambia el producto, el pedido sigue mostrando lo que se compró.

## 9. Retos para practicar (hazlos tú)

1. **Fácil:** cambia el umbral de "Últimas unidades" (`LOW_STOCK_THRESHOLD` en `client/src/lib/availability.ts`) y comprueba dónde se nota.
2. **Medio:** agrega un orden "Nombre Z-A" al catálogo. Pista: copia cómo funciona "nombre" en `sortOptions` (cliente), `sortValues` (`server/src/validators/catalog.ts`) y el `orderBy` de `catalogService`.
3. **Medio:** escribe una prueba en `cartItems.test.ts` para `countItems` (total de unidades del carrito) y otra para `removeItem` con un id que no está en el carrito.
4. **Avanzado:** sigue un pedido desde `CheckoutForm` hasta `createOrder` con las herramientas del navegador (pestaña Red) y anota qué se envía y qué responde la API.
