# Cómo enviar el catálogo real

Llena una fila por producto en [`plantilla-catalogo.csv`](plantilla-catalogo.csv) (se abre con Excel o Google Sheets).
Deja vacía cualquier celda cuyo dato no conozcas con certeza: la tienda simplemente no mostrará ese campo.

| Columna                                          | Qué poner                                                                                   | Ejemplo de formato             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------ |
| `sku`                                            | Código único. Prefijos: `AR-` árabes, `DS-` diseñador, `NI-` nicho, `EQ-` equivalencias     | `AR-0001`                      |
| `nombre`                                         | Nombre comercial exacto                                                                     |                                |
| `marca`                                          | Marca exacta                                                                                |                                |
| `categoria`                                      | `perfumes-arabes`, `disenador`, `nicho` o `equivalencias`                                   | `nicho`                        |
| `descripcion_corta`                              | Una frase para tarjetas                                                                     |                                |
| `descripcion`                                    | Texto completo de la ficha                                                                  |                                |
| `precio_cop`                                     | Precio actual en pesos, solo números                                                        | `285000`                       |
| `precio_anterior_cop`                            | Solo si hay un descuento real                                                               | `320000`                       |
| `tamano_ml`                                      | Mililitros, solo números                                                                    | `100`                          |
| `concentracion`                                  | `EXTRAIT`, `PARFUM`, `EDP`, `EDT`, `EDC`, `ACEITE` u `OTRA`                                 | `EDP`                          |
| `familia_olfativa`                               | Una familia                                                                                 | `Amaderada`                    |
| `notas_salida` / `notas_corazon` / `notas_fondo` | Notas verificadas separadas por `;`                                                         | `Azafrán; Bergamota`           |
| `publico`                                        | `FEMENINO`, `MASCULINO` o `UNISEX`, solo si es la clasificación real                        |                                |
| `referencia_equivalencia`                        | Solo equivalencias: perfil olfativo de referencia (pendiente de validar la redacción legal) |                                |
| `inventario`                                     | Unidades disponibles                                                                        | `6`                            |
| `nuevo` / `recomendado`                          | `si` o vacío                                                                                | `si`                           |
| `fotos`                                          | Nombres de archivo de las fotos (propias o autorizadas) separados por `;`                   | `AR-0001-1.jpg; AR-0001-2.jpg` |

Las fotos se envían aparte, idealmente en fondo uniforme y de al menos 1600 px en el lado mayor.

## Cargar el catálogo en la tienda

Desde la Fase 8 hay un importador que lee la plantilla y guarda los productos.

1. **Guarda la hoja como CSV**. En Excel: _Archivo → Guardar como → CSV UTF-8_. En Google Sheets:
   _Archivo → Descargar → CSV_. Sirven tanto el separador `,` como el `;` de Excel en español.
2. **Pon las fotos** en `client/public/images/products/<SKU>/`. Por ejemplo,
   `client/public/images/products/AR-0001/frente.webp`. En la columna `fotos` escribe solo el
   nombre del archivo (`frente.webp`).

   Formatos aceptados: `.webp`, `.jpg`, `.png` o `.avif`. Para que la tienda cargue rápido,
   expórtalas en WebP de unos 1200 px y menos de 300 KB.

3. **Revisa** el archivo (no guarda nada):

   ```powershell
   npm run catalogo:importar -- C:\ruta\catalogo.csv
   ```

   Si algo falla, el importador muestra cada problema con su fila y columna, por ejemplo
   `fila 7 · AR-0004 · precio_cop: Escribe solo números`. Corrígelos en Excel y repite.

4. **Guarda** los productos. `--retirar-demo` oculta además todos los productos DEMO:

   ```powershell
   npm run catalogo:importar -- C:\ruta\catalogo.csv --aplicar --retirar-demo
   ```

Puedes volver a importar el mismo archivo cuando cambien precios o inventario:

- cada producto se reconoce por su `sku` y se actualiza;
- su dirección web (`/producto/...`) no cambia;
- los productos que no estén en el archivo no se tocan.

Para cargar el catálogo en la tienda publicada, sigue
[la guía de producción](fase-8-produccion.md#5-cargar-el-catálogo-real).

## Catálogo copiado del Canva (23-oct-2026)

Las 57 lociones de las páginas de Canva están en
`server/prisma/data/products.catalog.ts` (lo que muestra la vista previa de GitHub Pages) y en
`docs/catalogo-canva.csv` (listo para `npm run catalogo:importar`). Del Canva solo salen el
nombre y el precio. Antes de importarlo a la base de datos real hay que completar:

- `inventario`: vacío cuenta como 0, es decir **agotado**.
- `tamano_ml`, `concentracion`, notas y `publico`, si se conocen.
- Las lociones de marcas de diseñador o nicho quedaron como **equivalencias** ("Inspirado en …").
  Si alguna es original, pásala a `disenador` o `nicho` con su marca real y un código `DS-`/`NI-`.
- Fotos propias o autorizadas (las del Canva parecen fotos oficiales de las marcas).
