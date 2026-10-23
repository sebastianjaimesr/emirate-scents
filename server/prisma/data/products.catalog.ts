/**
 * Catálogo real de Emirate Scents, copiado de las páginas de Canva que envió el dueño
 * (13 capturas, 23-oct-2026). Del Canva solo salen el NOMBRE y el PRECIO de cada loción;
 * todo lo demás queda vacío hasta que el dueño lo confirme (nunca se inventa).
 *
 * Decisiones provisionales (pendientes de confirmar con el dueño):
 * - Las lociones que evocan marcas de diseñador o nicho (Dior, Chanel, Creed…) se publican
 *   como EQUIVALENCIAS: "Inspirado en …", nunca con la marca como si fuera la original.
 * - La marca de las lociones árabes es la que aparece en el nombre o en la etiqueta del frasco.
 * - Fotos: las lociones árabes usan la foto del frasco recortada del Canva (el dueño lo
 *   autorizó el 23-oct-2026). Las equivalencias no llevan foto: la del frasco original
 *   haría creer que es el perfume de esa marca.
 * - Sin mililitros, concentración, notas ni público: el Canva no los trae.
 *
 * Lo usa la vista previa de GitHub Pages (client/src/services/preview/previewCatalog.ts).
 * Para la tienda con base de datos se importa con docs/catalogo/lociones-canva.csv.
 */
import type { DemoBrand, DemoProduct } from './products.demo.js'

export type CatalogProduct = DemoProduct & {
  /** Ruta dentro de client/public, por ejemplo /images/products/AR-0001/AR-0001-1.webp */
  images?: { url: string; alt: string }[]
}

/**
 * La vista previa no lleva inventario. Este número solo permite pedir por WhatsApp,
 * donde se confirma la disponibilidad real. NO es el inventario real.
 */
export const PREVIEW_STOCK = 10

const PUBLISHED_AT = '2026-10-23'

const brands = {
  lattafa: { slug: 'lattafa', name: 'Lattafa' },
  frenchAvenue: { slug: 'french-avenue', name: 'French Avenue' },
  orientica: { slug: 'orientica', name: 'Orientica' },
  afnan: { slug: 'afnan', name: 'Afnan' },
  dumont: { slug: 'dumont', name: 'Dumont' },
  alHaramain: { slug: 'al-haramain', name: 'Al Haramain' },
  armaf: { slug: 'armaf', name: 'Armaf' },
  rasasi: { slug: 'rasasi', name: 'Rasasi' },
  bharara: { slug: 'bharara', name: 'Bharara' },
  rave: { slug: 'rave', name: 'Rave' },
  equivalencias: { slug: 'linea-equivalencias', name: 'Línea Equivalencias' },
} satisfies Record<string, DemoBrand>

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const askMore = 'Escríbenos por WhatsApp para conocer el tamaño, las notas y la disponibilidad.'

function arabic(n: number, name: string, brand: DemoBrand, price: number): CatalogProduct {
  const sku = `AR-${String(n).padStart(4, '0')}`
  return {
    id: sku.toLowerCase(),
    sku,
    slug: slugify(`${name} ${brand.name}`),
    name,
    brand,
    categorySlug: 'perfumes-arabes',
    shortDescription: `${name}, de ${brand.name}.`,
    description: `${name}, de ${brand.name}. ${askMore}`,
    price,
    images: [
      { url: `/images/products/${sku}/${sku}-1.webp`, alt: `Frasco de ${name}, de ${brand.name}` },
    ],
    stock: PREVIEW_STOCK,
    publishedAt: PUBLISHED_AT,
  }
}

/** reference = el perfume que evoca, con su marca, tal como lo nombra el Canva. */
function equivalence(n: number, original: string, reference: string, price: number) {
  const sku = `EQ-${String(n).padStart(4, '0')}`
  const name = `Inspirado en ${original}`
  return {
    id: sku.toLowerCase(),
    sku,
    slug: slugify(name),
    name,
    brand: brands.equivalencias,
    categorySlug: 'equivalencias',
    shortDescription: `Equivalencia inspirada en ${reference}.`,
    description: `Loción inspirada en ${reference}. No es el perfume original ni está asociada a esa marca. ${askMore}`,
    price,
    inspirationReference: reference,
    stock: PREVIEW_STOCK,
    publishedAt: PUBLISHED_AT,
  } satisfies CatalogProduct
}

const { lattafa, orientica, afnan, alHaramain, armaf } = brands

// En el orden de las páginas del Canva
export const catalogProducts: CatalogProduct[] = [
  // Página 1
  arabic(1, 'Vulcan Feu', brands.frenchAvenue, 110000),
  arabic(2, 'Sehr', lattafa, 110000),
  arabic(3, 'Fakhar Black', lattafa, 105000),
  arabic(4, 'Noble', orientica, 100000),
  // Página 2
  arabic(5, 'Asad Bourbon', lattafa, 90000),
  arabic(6, 'Asad Clásico', lattafa, 90000),
  arabic(7, 'Asad Elixir', lattafa, 90000),
  arabic(8, 'Khamrah Dukhan', lattafa, 105000),
  arabic(9, 'Khamrah', lattafa, 105000),
  arabic(10, 'Khamrah Qahwa', lattafa, 105000),
  arabic(11, 'Khamrah Waha', lattafa, 110000),
  // Página 3
  arabic(12, '9PM Rebel', afnan, 90000),
  arabic(13, '9PM Night Out', afnan, 110000),
  arabic(14, '9AM', afnan, 90000),
  arabic(15, '9PM', afnan, 90000),
  // Página 4
  equivalence(1, 'Erba Pura', 'Erba Pura de Xerjoff', 110000),
  arabic(16, 'Nitro Red', brands.dumont, 90000),
  equivalence(2, 'Le Male Le Parfum', 'Le Male Le Parfum de Jean Paul Gaultier', 105000),
  equivalence(3, 'Le Beau Le Parfum', 'Le Beau Le Parfum de Jean Paul Gaultier', 105000),
  equivalence(4, 'Le Male Elixir', 'Le Male Elixir de Jean Paul Gaultier', 105000),
  // Página 5
  arabic(17, 'Amber Oud Dubai Night', alHaramain, 105000),
  arabic(18, 'Amber Oud', alHaramain, 105000),
  arabic(19, 'Amber Oud Aqua Dubai', alHaramain, 105000),
  arabic(20, 'Club de Nuit', armaf, 90000),
  arabic(21, 'Club de Nuit Sillage', armaf, 90000),
  // Página 6
  equivalence(5, 'Creed Silver', 'Creed Silver de Creed', 80000),
  equivalence(6, 'Bleu de Chanel', 'Bleu de Chanel', 80000),
  equivalence(7, 'Lacoste Red', 'Red de Lacoste', 80000),
  equivalence(8, '212 VIP Black', '212 VIP Black de Carolina Herrera', 80000),
  // Página 7
  arabic(22, 'Odyssey Aqua', armaf, 90000),
  equivalence(9, 'Santal 33', 'Santal 33 de Le Labo', 90000),
  arabic(23, 'Shaheen Gold', lattafa, 95000),
  arabic(24, 'Hawas for Him', brands.rasasi, 95000),
  // Página 8
  arabic(25, 'Honor & Glory', lattafa, 100000),
  arabic(26, 'Amethyst', lattafa, 100000),
  equivalence(10, 'Sauvage', 'Sauvage de Dior', 80000),
  equivalence(11, 'Sauvage Elixir', 'Sauvage Elixir de Dior', 90000),
  // Página 9
  arabic(27, 'Yum Yum', armaf, 110000),
  arabic(28, 'Yara Candy', lattafa, 90000),
  equivalence(12, 'La Vie Est Belle', 'La Vie Est Belle de Lancôme', 80000),
  arabic(29, 'Yara', lattafa, 90000),
  arabic(30, 'Yara Elixir', lattafa, 90000),
  // Página 10
  equivalence(13, 'Moschino Bubble Gum', 'Bubble Gum de Moschino', 80000),
  equivalence(14, 'La Bomba', 'La Bomba de Carolina Herrera', 95000),
  arabic(31, 'Mayar', lattafa, 110000),
  arabic(32, 'Rose', brands.bharara, 105000),
  // Página 11
  equivalence(15, 'Cloud', 'Cloud de Ariana Grande', 100000),
  equivalence(16, 'Thank U, Next', 'Thank U, Next de Ariana Grande', 95000),
  equivalence(17, 'Good Girl', 'Good Girl de Carolina Herrera', 85000),
  equivalence(18, 'Good Girl Blush', 'Good Girl Blush de Carolina Herrera', 85000),
  // Página 12
  arabic(33, 'Cookie Crave', lattafa, 115000),
  arabic(34, 'Berry On Top', lattafa, 115000),
  arabic(35, 'Vanilla Freak', lattafa, 110000),
  // Página 13
  arabic(36, 'Royal Amber', orientica, 100000),
  arabic(37, 'Amber Rouge', orientica, 100000),
  arabic(38, 'Eclaire', lattafa, 95000),
  arabic(39, 'Now Women', brands.rave, 90000),
]
