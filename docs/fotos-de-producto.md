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
   ```

3. Mira las fotos nuevas en la tienda (`npm run dev:client`) y sube los cambios.

## Qué hace el script (`server/scripts/productPhotos.ts`)

- Descarga cada imagen con 3 intentos y comprueba que de verdad sea una imagen
  (tipo de archivo, que se pueda abrir y que mida al menos 700 px de lado mayor).
- Si dos productos reciben la misma imagen, lo rechaza: casi seguro uno está equivocado.
- Pone fondo blanco, recorta los bordes vacíos y centra el frasco en 800 × 1000 (la forma
  de las tarjetas, 4:5), sin estirarlo. Guarda en WebP de alta calidad para que las letras
  de la etiqueta se lean bien.
- Anota cada foto lista en `server/prisma/data/product-photos.json` (fuente, tamaño
  original, huella del archivo). El catálogo lee ese archivo: los productos que aparecen ahí
  usan la foto nueva; los demás siguen con la recortada del Canva.
- Se puede repetir sin miedo: lo que ya está hecho se salta y una foto aprobada no se
  cambia sin `--reemplazar`. Al final muestra los productos que aún no tienen foto nueva.

## Reglas

- Solo fotos del perfume exacto (misma marca, nombre y presentación). Nada de perfumes
  parecidos.
- Equivalencias ("Inspirado en …"): solo fotos propias de tus frascos. La foto del perfume
  original de la marca haría creer que vendes ese perfume.
- Prefiere fotos oficiales de la marca o de distribuidores que permitan usarlas. Las fotos de
  otras tiendas suelen tener derechos de autor.

## Equivalencias: frasco ilustrado

Mientras no haya fotos propias de los frascos de equivalencia, cada una usa un frasco
ilustrado de Emirate Scents con el logo y la etiqueta "Línea Equivalencias N.º …":

```bash
npm run fotos:equivalencias   # dibuja las que falten en docs/catalogo/ilustraciones-equivalencias/
npm run fotos:descargar       # las optimiza y las conecta
```

Para cambiar una por una foto propia, edita su entrada en `product-photos.sources.json`
(`origin` = tu foto, `source` = "Foto propia de Emirate Scents") y ejecuta
`npm run fotos:descargar -- --reemplazar --solo EQ-0010`.
