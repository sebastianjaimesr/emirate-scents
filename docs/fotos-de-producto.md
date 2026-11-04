# Fotos de producto

Las fotos de la tienda viven en `client/public/images/products/<SKU>/` y se publican con la
tienda (no dependen de enlaces externos que puedan desaparecer).

## Cómo se agrega o cambia una foto

1. Anota de dónde sale cada foto en `server/prisma/data/product-photos.sources.json`:

   ```json
   [
     {
       "sku": "AR-0006",
       "file": "lattafa-asad",
       "origin": "https://…/asad.png",
       "sourcePage": "https://…/products/asad",
       "source": "Lattafa (sitio oficial)"
     },
     {
       "sku": "EQ-0010",
       "file": "emirate-inspirado-en-sauvage",
       "origin": "docs/catalogo/fotos-propias/sauvage.jpg",
       "source": "Foto propia de Emirate Scents"
     }
   ]
   ```

   - `origin` es la imagen misma: una URL `https` o un archivo de tu computador dentro del
     proyecto (ruta desde la raíz del repositorio).
   - `sourcePage` es la página donde se ve el producto, para comprobar que es el perfume exacto.
   - `file` es el nombre del archivo final, en minúsculas y con guiones.

2. Ejecuta:

   ```bash
   npm run fotos:descargar                      # procesa lo nuevo o cambiado
   npm run fotos:descargar -- --revisar         # solo dice qué falta, no descarga
   npm run fotos:descargar -- --solo AR-0006    # un solo producto
   npm run fotos:descargar -- --reemplazar      # permite cambiar una foto ya aprobada
   npm run fotos:descargar -- --regenerar       # vuelve a optimizar todas desde su archivo
   npm run fotos:inventario                     # actualiza docs/catalogo/inventario-fotos.csv
   ```

3. Mira las fotos nuevas en la tienda (`npm run dev:client`) y sube los cambios.

## Qué hace el script (`server/scripts/productPhotos.ts`)

- Descarga cada imagen con 3 intentos y comprueba que de verdad sea una imagen
  (tipo de archivo, que se pueda abrir y que mida al menos 700 px de lado mayor).
- Si dos productos reciben la misma imagen, lo rechaza: casi seguro uno está equivocado.
- Recorta los bordes vacíos y centra el frasco en 800 × 1000 (la forma de las tarjetas, 4:5),
  sin estirarlo. Los frascos con el fondo ya recortado van sobre negro, para el escenario
  oscuro de la tienda. Guarda en WebP de alta calidad para que las letras se lean bien.
- Publica tres tamaños de cada foto: `<archivo>-400.webp` (celulares), `<archivo>.webp`
  (800 × 1000) y `<archivo>-1200.webp` (pantallas Retina). La de 1200 solo se crea si la foto
  original es lo bastante grande: nunca se agranda una foto, porque se vería borrosa. El
  navegador elige sola la que necesita.
- Anota cada foto lista en `server/prisma/data/product-photos.json` (fuente, tamaño
  original, huella del archivo). El catálogo lee ese archivo: los productos que aparecen ahí
  usan la foto nueva; los demás siguen con la recortada del Canva.
- Se puede repetir sin miedo: lo que ya está hecho se salta y una foto aprobada no se
  cambia sin `--reemplazar`. Al final muestra los productos que aún no tienen foto nueva.

## Inventario y revisión

`docs/catalogo/inventario-fotos.csv` (se abre con Excel) tiene una fila por producto: foto
anterior y nueva, fuente, resolución, formato, tamaños publicados y estado. El estado sale de
estos campos opcionales de cada fuente en `product-photos.sources.json`:

- `verification`: `verificada` (es el perfume exacto, comparado con el Canva, y se ve bien),
  `revisar` (sirve, pero tiene el problema anotado) o `pendiente` (falta la foto buena).
- `note`: el motivo, en una frase.
- `downloadedSize`: tamaño del archivo tal como lo publica la fuente (por ejemplo `1500×1500`).

Las fotos originales sin recortar están en el computador del dueño
(`Downloads\emirate-fotos`, con `fuentes.json`); en el repositorio quedan los recortes
(`docs/catalogo/fotos-oficiales/`) y las ilustraciones (`docs/catalogo/ilustraciones-equivalencias/`).

## Reglas

- Solo fotos del perfume exacto (misma marca, nombre y presentación). Nada de perfumes
  parecidos.
- Equivalencias ("Inspirado en …"): solo fotos propias de tus frascos. La foto del perfume
  original de la marca haría creer que vendes ese perfume.
- Prefiere fotos oficiales de la marca o de distribuidores que permitan usarlas. Las fotos de
  otras tiendas suelen tener derechos de autor.

## Equivalencias: frasco ilustrado

Mientras no haya fotos propias de los frascos de equivalencia, cada una usa un frasco
ilustrado de Emirate Scents con el logo, el nombre de la equivalencia ("Inspirado en …") y
la etiqueta "Línea Equivalencias N.º …". La tienda muestra encima "Imagen ilustrativa" para
que nadie crea que es una foto del frasco real:

```bash
npm run fotos:equivalencias   # dibuja las que falten en docs/catalogo/ilustraciones-equivalencias/
npm run fotos:descargar       # las optimiza y las conecta
```

Para cambiar una por una foto propia, edita su entrada en `product-photos.sources.json`
(`origin` = tu foto, `source` = "Foto propia de Emirate Scents") y ejecuta
`npm run fotos:descargar -- --reemplazar --solo EQ-0010`.

## Fotos oficiales con el fondo recortado (nov-2026)

Las 39 lociones árabes usan la foto oficial de la marca (o de un distribuidor autorizado
cuando la marca no la publica), con el fondo recortado para que el frasco quede sobre el
escenario negro de la tienda:

- Los recortes están en `docs/catalogo/fotos-oficiales/<SKU>.webp` (fondo transparente).
- En `product-photos.sources.json`, `origin` apunta al recorte, `imageUrl` a la imagen
  original y `sourcePage` a la página del producto.
- El script detecta que la foto es un recorte (tiene fondo transparente) y la pone sobre
  negro; las fotos con fondo blanco siguen sobre blanco.
- `minLongSide` permite, revisado a mano, una foto menor de 700 px cuando es la más grande
  que existe (Nitro Red y Yum Yum).
- Después de cambiar fotos, ejecuta `npm run fotos:portada` para actualizar la portada.

Para recortar una foto nueva puedes usar cualquier herramienta que quite el fondo
(Photoshop, remove.bg, `rembg`) y guardar el resultado como PNG o WebP con transparencia.
