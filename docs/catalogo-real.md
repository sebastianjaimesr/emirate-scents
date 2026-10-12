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
