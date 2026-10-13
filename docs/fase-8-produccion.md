# Fase 8: Preparación para producción

> **Guía anterior al rediseño.** Describe la tienda y la API en un solo servidor y sin panel. La
> guía vigente, con la tienda en GitHub Pages y el panel en Railway, es
> [rediseno/fase-8-publicacion.md](rediseno/fase-8-publicacion.md). Las secciones de catálogo,
> dominio y copias de seguridad siguen sirviendo.

## 1. Cómo queda montada la tienda publicada

```
Cliente → https://tudominio.com ──► Servicio Node (un solo proceso)
                                     ├── /            la tienda React (client/dist)
                                     ├── /api/...     la API Express
                                     └── /robots.txt, /sitemap.xml
                                              │
                                              ▼
                                         PostgreSQL
```

La API sirve también la tienda ya compilada. Eso deja **un solo servicio y una base de datos**:

- se paga y se administra una sola cosa;
- la tienda y la API comparten dominio, así que no hace falta configurar CORS;
- cada publicación actualiza las dos a la vez, sin versiones desfasadas.

En tu computador nada cambia: `npm run dev` sigue igual.

### Qué se agregó en esta fase

- **La API sirve la tienda** (`server/src/web/storefront.ts`) cuando `SERVE_CLIENT=true`:
  - los archivos con huella (`assets/index-a1b2c3.js`) se guardan un año en el navegador;
  - `index.html` nunca se guarda en caché, así cada visita recibe la última versión.
- **Compresión** de todas las respuestas: el JavaScript viaja unas 3 veces más liviano.
- **Cabeceras de seguridad** para la tienda (Content-Security-Policy de helmet). Solo se ejecuta
  código del propio dominio. Una prueba en el navegador comprueba que nada se bloquea por error.
- **`robots.txt` y `sitemap.xml`** (`server/src/web/seo.ts`) para Google:
  - el mapa del sitio se arma con los productos publicados y se actualiza solo;
  - nunca incluye productos DEMO;
  - carrito, favoritos y pedido quedan fuera de los buscadores.
- **La semilla no carga productos DEMO en producción**: solo crea las cuatro categorías.
- **Importador del catálogo real** desde la plantilla CSV
  ([instrucciones](catalogo-real.md#cargar-el-catálogo-en-la-tienda)).
- **Publicar sin romper pestañas abiertas.** Si alguien tiene la tienda abierta mientras publicas
  una versión nueva, sus archivos viejos ya no existen. Antes, la siguiente página que abriera
  fallaba. Ahora la tienda se recarga sola en la página a la que iba. Lo comprobé publicando una
  versión nueva con la tienda abierta en el navegador.
- **Validación al arrancar**: en producción el servidor no arranca sin `PUBLIC_URL` y explica qué
  falta.

## 2. Antes de publicar: lo que solo tú puedes dar

| Pendiente                                               | Por qué bloquea                                          |
| ------------------------------------------------------- | -------------------------------------------------------- |
| Datos de la política de tratamiento de datos (Ley 1581) | Razón social o titular, NIT o cédula, domicilio y correo |
| Catálogo real (plantilla) y fotos propias o autorizadas | Sin él, la tienda publicada se ve vacía                  |
| Condiciones de envío y de pago contra entrega           | Para los textos de la tienda y del pedido                |
| Redacción legal de las equivalencias                    | Antes de publicar productos de esa categoría             |
| Elegir hosting y, si quieres, comprar el dominio        | Lo contratas y pagas tú, con tu cuenta                   |

Sin estos datos se puede publicar una versión de prueba, pero no conviene anunciarla.

## 3. Configuración del servicio (cualquier hosting de Node)

Sirve igual para Railway, Render, Fly.io o un servidor propio:

| Ajuste                         | Valor                                     |
| ------------------------------ | ----------------------------------------- |
| Repositorio / rama             | `sebastianjaimesr/emirate-scents`, `main` |
| Comando de instalación y build | `npm ci --include=dev && npm run build`   |
| Comando antes de cada versión  | `npm run db:deploy`                       |
| Comando de arranque            | `npm start`                               |
| Comprobación de salud          | `/api/health`                             |
| Versión de Node                | 22 o superior (la toma de `package.json`) |

Por qué cada comando:

- **`--include=dev`**: TypeScript, Vite y Prisma solo se usan para compilar. Muchos hostings instalan
  sin ellos cuando `NODE_ENV=production`, y la compilación fallaría.
- **`npm run db:deploy`**: aplica las migraciones pendientes a la base de datos antes de arrancar.
  Nunca borra datos.

Variables de entorno:

| Variable       | Valor                                                              |
| -------------- | ------------------------------------------------------------------ |
| `NODE_ENV`     | `production`                                                       |
| `DATABASE_URL` | La da el hosting al crear PostgreSQL (empieza por `postgresql://`) |
| `SERVE_CLIENT` | `true`                                                             |
| `PUBLIC_URL`   | `https://tudominio.com`, o la dirección que te asigne el hosting   |
| `CORS_ORIGIN`  | La misma que `PUBLIC_URL`                                          |
| `TRUST_PROXY`  | `1`                                                                |
| `PORT`         | No la pongas: el hosting la asigna y la API la usa sola            |

`TEST_DATABASE_URL` no va en producción.

## 4. Paso a paso en Railway (recomendado)

Elegí Railway porque reúne servicio y PostgreSQL en un solo panel, no se duerme por inactividad y
hace copias de la base de datos. Cuesta unos 5 USD al mes para una tienda de este tamaño (revisa el
precio vigente en railway.com). Si eliges otro hosting, la sección 3 sigue valiendo.

Los nombres de los botones pueden cambiar con el tiempo; lo importante son los valores de la
sección 3.

1. Crea una cuenta en Railway e inicia sesión con tu GitHub (`sebastianjaimesr`).
2. **New Project → Deploy from GitHub repo** y elige `emirate-scents`.
3. En el mismo proyecto: **New → Database → PostgreSQL**.
4. En el servicio de la tienda, abre **Variables**:
   - agrega las de la sección 3;
   - en `DATABASE_URL`, usa la referencia a la base de datos que ofrece Railway (`${{Postgres.DATABASE_URL}}`).
5. En **Settings** del servicio:
   - comando de build `npm ci --include=dev && npm run build`;
   - _pre-deploy_ `npm run db:deploy`;
   - arranque `npm start`;
   - health check `/api/health`.
6. En **Settings → Networking**, genera un dominio (`…up.railway.app`) y ponlo en `PUBLIC_URL` y
   `CORS_ORIGIN`.
7. Carga las categorías una sola vez, desde tu computador, en PowerShell:

   ```powershell
   $env:DATABASE_URL = "<la URL pública de PostgreSQL que muestra Railway>"
   $env:NODE_ENV = "production"
   npm run db:seed
   Remove-Item Env:DATABASE_URL, Env:NODE_ENV
   ```

   Con `NODE_ENV=production` la semilla crea solo las 4 categorías, sin DEMO.

   `Remove-Item` evita que, por error, el siguiente comando de esa ventana toque la base de datos de
   producción.

8. Abre la dirección del paso 6 y comprueba:
   - `/api/health` responde `{"status":"ok","database":"ok"}`;
   - la tienda carga.

## 5. Cargar el catálogo real

1. Sigue [las instrucciones del importador](catalogo-real.md#cargar-el-catálogo-en-la-tienda) en
   tu computador hasta que la revisión no muestre problemas.
2. **Sube las fotos.** Crea una rama con las fotos de `client/public/images/products/`, súbela a
   GitHub y haz merge: Railway publica la versión nueva sola.
3. **Importa a producción**, en PowerShell:

   ```powershell
   $env:DATABASE_URL = "<la URL pública de PostgreSQL de Railway>"
   npm run catalogo:importar -- C:\ruta\catalogo.csv
   npm run catalogo:importar -- C:\ruta\catalogo.csv --aplicar --retirar-demo
   Remove-Item Env:DATABASE_URL
   ```

   El primer comando solo revisa; el segundo guarda.

   Si `DATABASE_URL` está definida en la ventana, tiene prioridad sobre `server/.env`, así que nunca
   tocas tu base de datos local por error.

## 6. Dominio propio y HTTPS

1. Compra el dominio (por ejemplo, en un registrador `.com` o `.co`).
2. En Railway: **Settings → Networking → Custom Domain**. Railway te indica un registro DNS (CNAME)
   que debes crear en el panel del registrador.
3. El certificado HTTPS lo emite Railway automáticamente.
4. Cambia `PUBLIC_URL` y `CORS_ORIGIN` a `https://tudominio.com`.
5. Registra `https://tudominio.com/sitemap.xml` en Google Search Console.

## 7. Copias de seguridad

Los pedidos y el catálogo viven en PostgreSQL:

- **Activa las copias automáticas** del hosting (en Railway: pestaña _Backups_ de la base de datos)
  y comprueba que exista al menos una antes de anunciar la tienda.
- **Haz una copia propia cada mes**, desde tu computador (pg_dump viene con PostgreSQL):

  ```powershell
  pg_dump "<URL pública de PostgreSQL>" --format=custom --file "emirate-$(Get-Date -Format yyyy-MM-dd).dump"
  ```

  Si `pg_dump` avisa de una diferencia de versión, instala la misma versión de PostgreSQL que
  usa el hosting.

  Guarda el archivo fuera de tu computador (por ejemplo, en Google Drive): incluye datos personales
  de clientes.

## 8. Publicar cambios después

El flujo de siempre:

1. rama;
2. Pull Request;
3. revisión;
4. merge a `main`.

Railway detecta el merge, compila, aplica migraciones y reemplaza la versión anterior sin cortar el
servicio. Si la compilación o las migraciones fallan, la versión anterior sigue funcionando.

Antes de cada merge, en tu computador:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## 9. Ver los pedidos

Todavía no hay panel de administración:

- los pedidos llegan a tu WhatsApp cuando el cliente pulsa Enviar;
- también puedes verlos con Prisma Studio contra producción, solo para consultar:

  ```powershell
  $env:DATABASE_URL = "<URL pública de PostgreSQL>"
  npm run db:studio
  Remove-Item Env:DATABASE_URL
  ```

## 10. Lista final antes de anunciar la tienda

- [ ] Política de datos completa y sin el aviso de "Borrador". Cambia su versión en
      `client/src/pages/PrivacyPolicyPage.tsx` y en `server/src/config/policies.ts`.
- [ ] Catálogo real importado con `--retirar-demo`. El catálogo no muestra ningún aviso DEMO.
- [ ] Un pedido de prueba completo, desde el celular, hasta tu WhatsApp. Después márcalo como
      cancelado en Prisma Studio.
- [ ] `PUBLIC_URL` con el dominio definitivo, y `/sitemap.xml` muestra tus productos.
- [ ] Copia de seguridad automática activa.
- [ ] Instagram y WhatsApp enlazan a la dirección definitiva.

## Pruebas de esta fase

- **API: 45 pruebas**, 15 nuevas:
  - tienda servida desde la API: caché, páginas internas, rutas de API inexistentes;
  - `robots.txt` y mapa del sitio, sin DEMO ni borradores;
  - lector de CSV (comas, `;`, comillas, BOM);
  - validación de filas con errores por fila y columna;
  - importación: crea, actualiza conservando la dirección y retira DEMO.
- **Navegador: 23 pruebas × 2 tamaños = 46**. Ahora corren contra el servidor en modo producción,
  con cabeceras de seguridad y compresión; 3 son nuevas.
- **Instalación limpia** como la haría el hosting:
  - `npm ci --include=dev` y `npm run build` con `NODE_ENV=production`;
  - arranque, `/api/health`, tienda, `robots.txt` y `sitemap.xml`.
- **No probado:** no publiqué en ningún hosting. Eso requiere tu cuenta, y los pasos de Railway de
  la sección 4 no los he podido ejecutar.
