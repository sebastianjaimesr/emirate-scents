# Fase 5: Backend (Express + PostgreSQL + Prisma)

## Qué cambia para quien visita la tienda

A simple vista, nada: el catálogo, los filtros, la ficha, el carrito y los favoritos funcionan igual
que en la Fase 4. La diferencia es de dónde salen los datos:

- **Antes:** los productos DEMO estaban escritos dentro del código de la tienda (React).
- **Ahora:** viven en una base de datos **PostgreSQL**. La tienda los pide a una **API** (el servidor
  Express), que filtra, ordena y pagina con consultas a la base de datos.

Esto permite cargar el catálogo real sin tocar el código de la tienda, y es la base de los pedidos de
la Fase 6.

## Cómo encajan las piezas

```
Navegador (tienda React)          Servidor (server/)                       PostgreSQL
productService.ts ── GET /api/products?marca=...&orden=... ──► Express
                                    routes → controllers → validators (Zod)
                                                         → services ── Prisma ──► tablas
                  ◄──────────────── JSON (productos, totales, filtros) ◄──
```

- **routes/**: qué URL atiende cada función.
- **controllers/**: leen la petición, la validan y devuelven JSON.
- **validators/**: reglas de cada parámetro con Zod. Si algo no cumple (por ejemplo,
  `porPagina=500`), la API responde **400** con el detalle y no llega a consultar la base de datos.
- **services/**: las consultas a la base de datos (con Prisma) y las reglas del negocio.
- **middlewares/errorHandler.ts**: convierte cualquier fallo en una respuesta JSON clara. Los errores
  inesperados se registran completos en el servidor, pero al navegador solo le llega
  "Error interno del servidor", sin detalles internos.

En desarrollo, Vite redirige todo lo que empieza por `/api` al servidor (puerto 4000). Para el
navegador, tienda y API parecen el mismo sitio.

## API

| Método | Ruta                              | Qué devuelve                                                                                                                                                      |
| ------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/health`                     | Estado del servicio y de la base de datos (503 si la base de datos no responde)                                                                                   |
| GET    | `/api/products`                   | Productos publicados con filtros: `q`, `categoria`, `marca`, `tamano`, `familia`, `precioMin`, `precioMax`, `orden`, `pagina`, `porPagina` (máximo 48 por página) |
| GET    | `/api/products/:slug`             | Detalle de un producto (404 si no existe o no está publicado)                                                                                                     |
| GET    | `/api/products/:slug/related`     | Relacionados: misma categoría, primero la misma familia olfativa                                                                                                  |
| GET    | `/api/catalog/filters?categoria=` | Opciones de los filtros (marcas, tamaños, familias, rango de precios) con su número de productos                                                                  |
| GET    | `/api/catalog/highlights/:tipo`   | Selecciones de inicio: `recomendados`, `novedades` o `mas-vendidos`                                                                                               |
| GET    | `/api/catalog/lookup?ids=`        | Varios productos por id, para el carrito y los favoritos (máximo 50)                                                                                              |
| GET    | `/api/categories`                 | Categorías con su número de productos publicados                                                                                                                  |
| GET    | `/api/brands`                     | Marcas con productos publicados                                                                                                                                   |

Los parámetros tienen los mismos nombres que la URL de la tienda: un enlace como
`/catalogo/nicho?marca=x&orden=precio-asc` se traduce directamente en una petición a la API.

## Modelo de datos

Está en [`server/prisma/schema.prisma`](../server/prisma/schema.prisma): `Category`, `Brand`,
`Product` y `ProductImage`. Decisiones que conviene conocer:

- **Dinero en `Decimal(12, 2)`**, nunca en `Float`, para no perder exactitud. La API lo entrega como
  pesos enteros (`285000`).
- **Estado del producto**: `BORRADOR`, `PUBLICADO` o `ARCHIVADO`. La tienda solo ve los publicados,
  así podrás preparar productos antes de mostrarlos.
- **Reglas dentro de la base de datos**: precios, existencias y tamaños nunca pueden ser negativos.
  Aunque un error de código lo intentara, PostgreSQL lo rechaza.
- **Notas olfativas** como tres listas dentro del producto (salida, corazón, fondo). Es más simple que
  la tabla aparte que propuse en la Fase 1; si más adelante queremos filtrar por nota, se migra.
- **Búsqueda**: cada producto guarda un `searchText` sin tildes ni mayúsculas (nombre, marca, familia
  y notas). Así "ambar" encuentra "Ámbar" en cualquier instalación de PostgreSQL.
- **Orden alfabético en español** ("Ámbar" junto a "Ambar"), igual en Windows y en el servidor de
  producción.
- **Ids de los productos DEMO** iguales a los de la Fase 4, para que los carritos guardados sigan
  funcionando.
- Las tablas de **pedidos** (`Order`, `OrderItem`) llegan en la Fase 6, junto con el formulario,
  para diseñarlas con tus respuestas sobre envío, pago contra entrega y existencias.

Cada cambio del modelo queda registrado como una **migración** en `server/prisma/migrations/`.
Así cualquier equipo, incluido el servidor de producción, puede reconstruir la misma base de datos
paso a paso.

## Seguridad incluida

- **helmet**: cabeceras HTTP de seguridad.
- **CORS**: solo la dirección de la tienda (`CORS_ORIGIN`) puede llamar a la API desde un navegador.
- **Límite anti-abuso**: 600 peticiones cada 15 minutos por dirección IP.
- **Validación con Zod** de todos los parámetros.
- **Búsqueda segura**: los caracteres especiales (`%`, `_`) no actúan como comodines.
- **Variables de entorno validadas al arrancar**: si falta `DATABASE_URL`, el servidor explica qué
  corregir en lugar de fallar más tarde.
- **Registro sin datos sensibles**: solo método, URL y código de respuesta.

## Pruebas

`npm test` ejecuta:

- **Tienda:** 21 pruebas (filtros en la URL, carrito, WhatsApp, precios).
- **API:** 22 pruebas con Supertest contra la base de datos de pruebas (`emirate_scents_test`):
  - filtros, búsqueda sin tildes, orden y paginación;
  - errores 400 y 404;
  - productos no publicados ocultos;
  - cabeceras de seguridad y CORS.

Las pruebas usan sus propios productos de ejemplo, no los DEMO, y nunca tocan la base de datos de
desarrollo. Si `TEST_DATABASE_URL` falta o coincide con `DATABASE_URL`, se niegan a ejecutarse.

## Para tener en cuenta

- **Si el servidor no responde**, la tienda lo dice ("No pudimos cargar el catálogo") con un botón
  **Intentar de nuevo**. Si es el carrito el que no carga, nunca se borra: los productos siguen
  guardados en el navegador.
- **Si un producto del carrito se retira del catálogo**, se quita del carrito al abrirlo, para que el
  contador del header coincida con lo que se ve.
- **`npm audit`** avisa de 4 vulnerabilidades "altas". Están en `mysql2`, una librería que la
  herramienta de Prisma incluye para MySQL:
  - solo se instala para desarrollo y no forma parte de la API que se publica;
  - no se usa con PostgreSQL;
  - el "arreglo" que propone `npm audit fix --force` bajaría Prisma a la versión 6, así que no lo
    apliqué.

  Lo revisaré de nuevo en la Fase 7.

- **Editar productos**: hasta que exista el panel de administración, el catálogo real se cargará con
  un script de importación desde la plantilla (`docs/catalogo-real.md`). Si editas un producto a mano
  en Prisma Studio, el buscador no verá el cambio de nombre o notas hasta volver a calcular su
  `searchText`.

## Siguiente fase

Fase 6, **pedidos y WhatsApp**:

- formulario de datos;
- `POST /api/orders`, que recalcula precios y existencias en el servidor;
- número de pedido;
- mensaje de WhatsApp con el resumen.

Para diseñarla necesito tus respuestas pendientes:

- condiciones de envío y de pago contra entrega;
- si se reservan existencias al crear el pedido;
- la política de tratamiento de datos (Ley 1581).
