# Fase 7: Pruebas, seguridad y optimización

## Resumen

| Tema                            | Antes                          | Ahora                                                            |
| ------------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| Pruebas                         | 26 de la tienda + 30 de la API | Las mismas, más 20 en un navegador real (×2 tamaños = 40)        |
| `npm audit`                     | 4 vulnerabilidades "altas"     | 0                                                                |
| Accesibilidad                   | Sin revisión automática        | 11 páginas revisadas con axe en escritorio y celular, sin avisos |
| JavaScript inicial (comprimido) | 161 KB                         | 139 KB (−14 %)                                                   |
| Página de pedido (comprimido)   | 39 KB                          | 22 KB (−44 %)                                                    |

## Pruebas en el navegador (`e2e/`)

Con **Playwright**, un Chrome automático recorre la tienda como un cliente. Cada prueba se ejecuta
dos veces: en pantalla de escritorio y en pantalla de celular (Pixel 7).

- **Tienda** (`e2e/tienda.spec.ts`):
  - el inicio carga con la marca y el enlace de WhatsApp correcto;
  - el catálogo no muestra productos en borrador;
  - la búsqueda "AMBAR" encuentra "Ámbar Real" y "Ámbar Nocturno";
  - un producto que no existe muestra un aviso claro;
  - los favoritos siguen ahí al recargar.

  Cualquier error de JavaScript en la página hace fallar la prueba.

- **Pedido** (`e2e/pedido.spec.ts`):
  - agregar al carrito → formulario → errores en español si faltan datos;
  - registrar el pedido → número `ES-AAAA-000000`;
  - el mensaje de WhatsApp lleva el número, el producto y la dirección;
  - el carrito queda vacío y la confirmación sobrevive a una recarga;
  - un producto DEMO no se puede pedir.

- **Accesibilidad** (`e2e/accesibilidad.spec.ts`): revisa 11 páginas y estados (inicio, catálogo,
  catálogo sin resultados, producto, producto inexistente, carrito vacío, favoritos vacío, pedido,
  confirmación sin pedido, política de datos, página no encontrada…):
  - **axe**, la herramienta estándar de accesibilidad (normas WCAG 2.1 AA): contraste, etiquetas,
    nombres de botones, jerarquía de títulos. Solo se aceptan avisos "menores", y hoy no hay ninguno;
  - cada página tiene un único título principal (`h1`);
  - nada se sale de la pantalla a los lados;
  - el enlace "Saltar al contenido" funciona con el teclado;
  - con "reducir movimiento" activado, el contenido aparece.

Las pruebas usan la API conectada a la **base de datos de pruebas** con sus propios productos
(`server/tests/e2eSeed.ts`). Nunca tocan tu base de datos ni los productos DEMO.

### Lo que encontraron y se corrigió

- **Páginas sin título principal:** "Esta página no existe", "No hay un pedido reciente" y el error
  al cargar un producto usaban un subtítulo (`h2`). Los lectores de pantalla y Google esperan un
  `h1` por página. Ahora lo tienen.
- **Saltos en la jerarquía de títulos del catálogo:** las tarjetas (`h3`) venían justo después del
  título de la página (`h1`). Se añadió un título "Productos" (`h2`) que solo leen los lectores de
  pantalla.

## Seguridad

### `npm audit`: de 4 vulnerabilidades a 0

Venían de dos librerías que la herramienta de Prisma incluye por dentro:

- `mysql2`, para bases de datos MySQL (no la usamos);
- `deepmerge-ts`, para leer `prisma.config.ts`.

`npm audit fix --force` proponía bajar Prisma a la versión 6, lo que rompería el proyecto. En lugar
de eso, `package.json` tiene ahora **`overrides`**: le pide a npm usar las versiones corregidas
(`mysql2` 3.24.5 y `deepmerge-ts` 8.0.2) dentro de Prisma 7.

Lo comprobé así:

- Prisma genera el cliente;
- las migraciones están al día;
- `npm run db:seed` funciona;
- todas las pruebas pasan.

Cuando Prisma publique una versión que ya las traiga, se pueden quitar los `overrides`.

### Límite anti-abuso detrás del hosting

En producción, la API estará detrás del proxy del hosting (Render, Railway…). Sin configurarlo,
todos los clientes parecerían venir de la misma dirección IP, la del proxy. Bastarían 10 pedidos
de clientes distintos para bloquear a todos los demás durante 15 minutos.

Ahora existe la variable **`TRUST_PROXY`** en `server/.env`:

- en tu computador vale `0`;
- en el hosting será normalmente `1`. Lo configuraremos en la Fase 8.

### Revisión del código

Revisado sin cambios necesarios:

- **Datos de entrada:**
  - todo lo que llega a la API se valida con Zod, con longitudes máximas;
  - el cuerpo de una petición no puede pasar de 100 KB.
- **Precios y existencias:** los calcula siempre el servidor; el navegador solo envía qué productos
  y cuántos.
- **Errores:** el navegador nunca recibe detalles internos ("Error interno del servidor").
- **Registros:** no guardan teléfonos, direcciones, cookies ni IP.
- **Enlaces externos** (WhatsApp, Instagram): abren en otra pestaña con `rel="noopener noreferrer"`,
  así la otra página no puede controlar la tienda.
- **Contenido:** la tienda no inserta HTML sin escapar (`dangerouslySetInnerHTML`) ni usa `eval`.
- **Secretos:** `.env` está fuera de Git. La contraseña de `.env.example` solo sirve en tu computador.

### Para la Fase 8 (producción)

- HTTPS en la tienda y en la API.
- Contraseña fuerte para la base de datos de producción y copias de seguridad.
- `CORS_ORIGIN` con el dominio real.
- `TRUST_PROXY=1`.
- Cabeceras de seguridad para la tienda (Content-Security-Policy) en la configuración del hosting.

## Velocidad de carga

### Animaciones cargadas después (Motion)

El motor de animaciones (unos 26 KB comprimidos) ya no forma parte de la primera descarga:

1. la página se muestra primero;
2. después llegan las animaciones.

Técnicamente, `LazyMotion` en `RootLayout.tsx` lo carga aparte (`src/lib/motionFeatures.ts`). Los
componentes usan `m.div` en lugar de `motion.div`.

`strict` hace que, si alguien vuelve a escribir `motion.div`, la tienda avise con un error en lugar
de cargar todo de nuevo sin que nadie lo note.

### Formulario de pedido más liviano (Zod mini)

El formulario usa `zod/mini`, la versión compacta de Zod. Las reglas y los mensajes son los mismos,
con la mitad del JavaScript en esa página.

## Lo que no se probó

- **Navegadores:** las pruebas en navegador usan solo Chrome (Chromium); Safari y Firefox no.
- **Límite de pedidos:** los límites anti-abuso se desactivan en modo prueba para que no interfieran,
  así que las pruebas automáticas no los ejercitan.
- **Lighthouse:** no medí la velocidad con Lighthouse. Las cifras de arriba son el tamaño de los
  archivos que genera `npm run build`.

## Cómo ejecutar todo

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium   # solo la primera vez
npm run test:e2e
```

## Siguiente fase

Fase 8, **preparación para producción**:

- elegir el hosting de la tienda, la API y la base de datos;
- dominio y HTTPS;
- variables de producción;
- copias de seguridad;
- guía para publicar cambios.
