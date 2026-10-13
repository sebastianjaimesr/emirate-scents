# Rediseño · Fase 8: seguridad, pruebas y publicación

Esta fase deja todo listo para publicar la tienda como elegiste: **tienda en GitHub Pages; API,
panel, base de datos y fotos en Railway**. Hay tres partes:

1. una revisión de seguridad, con sus correcciones;
2. pruebas automáticas en cada Pull Request;
3. la guía paso a paso para publicar.

**No publiqué nada.** Railway necesita tu cuenta y tu forma de pago, y la variable de GitHub la
pones tú. Sí probé el montaje completo en mi entorno: la tienda en una carpeta como la de GitHub
Pages, hablando con la API en otra dirección.

## 1. Cómo queda montado

```
Cliente ──► https://sebastianjaimesr.github.io/emirate-scents/    (GitHub Pages, gratis)
              la tienda: páginas, imágenes propias, carrito
                    │  productos y pedidos (HTTPS, sin cookies)
                    ▼
            https://<tu-servicio>.up.railway.app                   (Railway)
              ├── /api/...    la API
              ├── /admin      el panel (aquí sí hay cookie de sesión)
              ├── /uploads    las fotos subidas desde el panel (volumen)
              └── PostgreSQL  productos, pedidos, inventario
```

- **La tienda no tiene secretos.** Solo sabe la dirección de la API.
- **El panel vive en el mismo dominio que la API.** Así la cookie de sesión funciona con
  `SameSite=Strict` y ningún otro sitio puede usarla.
- **Si alguien abre una página de la tienda en la dirección de Railway** (por ejemplo
  `…railway.app/catalogo`), lo envía a GitHub Pages. Así solo existe una tienda.

## 2. Revisión de seguridad

Revisé el inicio de sesión, las sesiones, la protección contra peticiones falsificadas, los
permisos, las consultas a la base de datos, la subida de fotos, los pedidos, las variables de
entorno, los registros y el código del navegador. Además, `npm audit` sobre las librerías de
producción da **0 vulnerabilidades**.

**No encontré problemas graves.** Corregí estos:

| Gravedad | Problema                                                                                                                                                              | Corrección                                                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Media    | El límite de "5 intentos por correo" contaba desde cualquier conexión. Quien conociera tu correo podía equivocarse 5 veces cada 15 minutos y dejarte sin poder entrar | Se quitó el límite por correo. Queda el límite de 5 intentos por conexión. Contra un ataque desde muchas conexiones protegen la contraseña de 12+ caracteres y Argon2id, que hace cada intento lento a propósito |
| Baja     | Si en Railway faltaba `NODE_ENV=production`, el servidor arrancaba con la cookie del panel sin `Secure`                                                               | Con `ADMIN_ONLY=true`, el servidor no arranca sin `NODE_ENV=production`                                                                                                                                          |
| Baja     | Un error al escribir `CORS_ORIGIN` o `ADMIN_ORIGIN` (por ejemplo, con `/emirate-scents` al final) no daba ningún aviso: la tienda o el panel simplemente fallaban     | El servidor no arranca y explica el error. En producción exige `https://`                                                                                                                                        |
| Baja     | Una foto con muchísimos píxeles pero pocos megas podía agotar la memoria de un servidor pequeño                                                                       | Máximo 24 megapíxeles (más que cualquier celular habitual), comprobado antes de abrir la foto. Las tres medidas se generan una detrás de otra                                                                    |
| Info     | Las búsquedas del panel (`?q=nombre del cliente`) quedaban en el registro del servidor                                                                                | El registro guarda la dirección sin la búsqueda                                                                                                                                                                  |
| Info     | Una foto inexistente en `/uploads` respondía con la página de la tienda                                                                                               | Responde 404                                                                                                                                                                                                     |

Lo que revisé y está bien:

- **Sesiones:** código aleatorio de 32 bytes del que solo se guarda la huella. Se crea uno nuevo
  en cada inicio de sesión y caduca a las 2 horas sin uso o a las 12 horas.
- **Peticiones falsificadas:** las que cambian datos exigen el origen exacto del panel.
- **Base de datos:** todas las consultas manuales usan parámetros, sin texto pegado.
- **Formularios:** no aceptan campos de más; por ejemplo, el stock no se cambia editando el
  producto.
- **Fotos:** el tipo se comprueba por el contenido del archivo, y todas se convierten a WebP con
  un nombre que genera el servidor.
- **Pedidos:** precios y existencias salen siempre de la base de datos.
- **Errores:** un error interno nunca muestra detalles.
- **Navegador:** el panel no se incluye en la versión de GitHub Pages, y no hay secretos en el
  código.

### Política de contenido en GitHub Pages

GitHub Pages no deja configurar cabeceras de seguridad. Por eso la tienda real lleva su política
de contenido dentro del HTML:

- solo ejecuta código de la propia tienda;
- solo pide datos e imágenes a la tienda y a tu API;
- no permite plugins.

La comprobé en el navegador: con fotos subidas desde el panel, catálogo, ficha y un pedido, no
hubo ningún bloqueo.

## 3. Pruebas automáticas en cada Pull Request

Hay un flujo nuevo, `.github/workflows/pruebas.yml`. En cada Pull Request, GitHub hace lo mismo
que haces tú antes de fusionar:

1. lint, tipos y formato;
2. pruebas del cliente y de la API, con una base de datos PostgreSQL temporal;
3. build;
4. pruebas en el navegador.

Si algo falla, el PR lo muestra en rojo y guarda el informe de Playwright. Este mismo PR será
el primero en usarlo.

## 4. Publicar: paso a paso

Los nombres de los botones de Railway y GitHub pueden cambiar. Lo importante son los valores.

### 4.1 Railway: API, panel y base de datos

1. Crea una cuenta en <https://railway.com> con tu GitHub (`sebastianjaimesr`).
2. **New Project → Deploy from GitHub repo** → `emirate-scents`.
3. En el mismo proyecto: **New → Database → PostgreSQL**.
4. **Volumen para las fotos.** En el servicio de la tienda: **New → Volume**, con punto de montaje
   `/data`. Sin volumen, las fotos subidas desde el panel se borran en cada publicación.
5. **Settings → Networking → Generate Domain.** Apunta la dirección que te da, por ejemplo
   `https://emirate-scents-production.up.railway.app`. Abajo la llamo `<RAILWAY>`.
6. **Variables** del servicio:

   | Variable       | Valor                                                           |
   | -------------- | --------------------------------------------------------------- |
   | `NODE_ENV`     | `production`                                                    |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (la referencia que ofrece Railway) |
   | `SERVE_CLIENT` | `true`                                                          |
   | `ADMIN_ONLY`   | `true`                                                          |
   | `PUBLIC_URL`   | `https://sebastianjaimesr.github.io/emirate-scents`             |
   | `CORS_ORIGIN`  | `https://sebastianjaimesr.github.io` (sin nada después)         |
   | `ADMIN_ORIGIN` | `<RAILWAY>` (sin `/` al final)                                  |
   | `TRUST_PROXY`  | `1`                                                             |
   | `UPLOADS_DIR`  | `/data/uploads`                                                 |

   **No pongas `VITE_API_URL` en Railway.** Esa variable es solo para GitHub. Si existe al
   compilar, el panel no se incluye y `/admin` no aparece.

   `PORT` tampoco: Railway la asigna sola.

7. **Settings → Deploy:**

   | Ajuste             | Valor                                   |
   | ------------------ | --------------------------------------- |
   | Build command      | `npm ci --include=dev && npm run build` |
   | Pre-deploy command | `npm run db:deploy`                     |
   | Start command      | `npm start`                             |
   | Healthcheck path   | `/api/health`                           |
   - `--include=dev`: TypeScript, Vite y Prisma solo se usan para compilar.
   - `db:deploy`: aplica las migraciones pendientes. Nunca borra datos.

8. **Crea tu usuario del panel** desde tu computador, en PowerShell. Usa la URL pública de
   PostgreSQL que muestra Railway (pestaña _Connect_ de la base de datos):

   ```powershell
   $env:DATABASE_URL = "<URL pública de PostgreSQL>"
   $env:NODE_ENV = "production"
   npm run db:seed          # con production solo crea las 4 categorías, sin DEMO
   Remove-Item Env:NODE_ENV
   npm run admin:crear      # tu nombre, correo y una contraseña de 12+ caracteres
   Remove-Item Env:DATABASE_URL
   ```

   `admin:crear` se ejecuta sin `NODE_ENV=production`: usa tu `server/.env` para todo lo
   demás, y ahí las direcciones son las de tu computador.

   `Remove-Item` evita que el siguiente comando de esa ventana toque producción por error.

9. **Comprueba:**
   - `<RAILWAY>/api/health` responde `{"status":"ok","database":"ok"}`;
   - `<RAILWAY>/admin` muestra el inicio de sesión y puedes entrar;
   - `<RAILWAY>/` te lleva a GitHub Pages.

Si el servidor no arranca, el registro de Railway (_Deployments → View logs_) dice qué variable
falta o está mal escrita.

### 4.2 GitHub Pages: la tienda real

1. En GitHub: **Settings → Secrets and variables → Actions → Variables → New repository
   variable**:
   - nombre: `VITE_API_URL`
   - valor: `<RAILWAY>/api`

   Es una **variable**, no un secreto: la dirección de la API no es secreta, y la tienda la
   necesita a la vista.

2. **Actions → Tienda en GitHub Pages → Run workflow** (o fusiona cualquier cambio a `main`).
3. Abre `https://sebastianjaimesr.github.io/emirate-scents/`. Desaparecen los avisos DEMO y los
   productos salen de tu base de datos.

Si borras la variable, la siguiente publicación vuelve a la vista previa DEMO.

### 4.3 Prueba completa antes de anunciar

1. En el panel, crea un producto real con foto y publícalo.
2. En la tienda de GitHub Pages, verifica que aparece con su foto.
3. Haz un pedido desde tu celular y envíalo por WhatsApp.
4. En el panel, búscalo, fija el envío, confírmalo (baja el stock) y cancélalo (vuelve).

## 5. Copias de seguridad

- **Base de datos:** activa las copias automáticas de PostgreSQL en Railway (pestaña
  _Backups_). Haz además una copia propia cada mes con `pg_dump`, como explica la
  [guía anterior](../fase-8-produccion.md#7-copias-de-seguridad).
- **Fotos:** el volumen también admite copias en Railway. Guarda además los originales de tus
  fotos en tu computador o en Google Drive.

## 6. Lo que debes saber de este montaje

- **Unos segundos sin servicio al publicar.** Según la documentación de Railway, un servicio con
  volumen tiene una pequeña interrupción en cada publicación, porque el volumen no puede estar
  conectado a dos versiones a la vez. La tienda de GitHub Pages sigue en pie; durante esos
  segundos no cargan productos ni se pueden enviar pedidos.
- **Buscadores.** GitHub Pages no sabe que `/producto/oud-rosa` es una página: responde "404"
  y muestra la tienda igualmente (así funcionan los enlaces directos). Las personas no lo notan,
  pero Google puede no indexar las fichas. Tampoco hay `sitemap.xml` en GitHub Pages.
  - Si el posicionamiento en Google es importante, la solución es pasar la tienda a Railway
    con un dominio propio: todo en un servidor.
  - El código ya lo permite: `ADMIN_ONLY=false`, sin la variable de GitHub, y `PUBLIC_URL`,
    `CORS_ORIGIN` y `ADMIN_ORIGIN` con tu dominio.
- **Cloudflare R2 no está conectado.** Las fotos van al volumen de Railway, que es más simple y
  no requiere otra cuenta. El código está preparado para cambiar de almacenamiento, pero esa
  conexión no está hecha ni probada.
- **Costo.** Railway cobra según el uso. Revisa el precio vigente en railway.com. GitHub Pages
  es gratis para repositorios públicos.
- **El archivo `railway.json` no se usa.** Railway marca la configuración por archivo como
  obsoleta para servicios nuevos, así que los ajustes van en su panel (paso 4.1).

## 7. Archivos

| Archivo                                        | Qué cambió                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `server/src/config/env.ts`                     | `ADMIN_ONLY` y validación de orígenes y de producción                           |
| `server/src/web/storefront.ts`, `seo.ts`       | Modo "solo API y panel": redirige la tienda a GitHub Pages y no se deja indexar |
| `server/src/routes/admin.ts`                   | Límite de intentos solo por conexión                                            |
| `server/src/services/admin/imageAdmin.ts`      | Máximo 24 megapíxeles; medidas una detrás de otra                               |
| `server/src/app.ts`                            | El registro no guarda las búsquedas                                             |
| `client/vite.config.ts`, `client/package.json` | `build:pages`: tienda real para GitHub Pages, con política de contenido         |
| `client/src/lib/mediaUrl.ts` (+ prueba)        | Las fotos del panel se piden a la API; las propias, a la subcarpeta de Pages    |
| `.github/workflows/tienda-pages.yml`           | Tienda real si existe `VITE_API_URL`; si no, vista previa DEMO                  |
| `.github/workflows/pruebas.yml`                | Pruebas automáticas en cada Pull Request                                        |
| `server/.env.example`                          | `ADMIN_ONLY` y el volumen de fotos                                              |
| `server/tests/env.test.ts`, `web.test.ts`, ... | Pruebas nuevas                                                                  |

No se añadió ninguna librería.

## 8. Comprobaciones ejecutadas

Ejecutadas desde una copia limpia del repositorio, con los mismos pasos del flujo de GitHub:

| Comprobación                      | Resultado                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Lint, tipos y formato             | Sin errores                                                                  |
| Build                             | Correcto                                                                     |
| Pruebas unitarias del cliente     | 36 de 36 (3 nuevas)                                                          |
| Pruebas de la API                 | 136 de 136 (8 nuevas)                                                        |
| Playwright (escritorio y celular) | 70 pasan; 8 se omiten a propósito (las de escritorio en celular y viceversa) |
| `npm audit` (producción)          | 0 vulnerabilidades                                                           |

Las pruebas nuevas comprueban:

- las reglas de las variables de entorno;
- el modo "solo API y panel" (el panel se sirve; la tienda redirige a GitHub Pages; robots.txt
  no deja indexar);
- el 404 de fotos inexistentes;
- el rechazo de fotos de más de 24 megapíxeles;
- las direcciones de las fotos en GitHub Pages.

**Montaje GitHub Pages + API, probado a mano en mi entorno.** Compilé la tienda con
`build:pages` y la serví en una subcarpeta `/emirate-scents/`, como GitHub Pages. La API corría
en otra dirección. Comprobé que:

- una foto subida desde el panel se ve en la ficha, pedida al dominio de la API;
- el catálogo carga desde la API;
- `/admin` no existe en esa versión;
- un pedido desde la tienda llega a la API (201);
- la tienda no puede llamar a la API del panel (el navegador lo bloquea);
- la política de contenido no bloqueó nada.

**No probado:** Railway y GitHub Pages reales, porque requieren tu cuenta y tu variable. El
flujo nuevo de pruebas se ejecutará por primera vez en GitHub con este PR.

## 9. Pendiente (solo tú puedes darlo)

- Cuenta de Railway y los pasos de la sección 4.
- Datos de la política de tratamiento de datos: razón social o titular, NIT o cédula, domicilio y
  correo.
- Catálogo real con fotos propias o autorizadas.
- Condiciones de envío y de pago contra entrega.
