/**
 * Catálogo real de Emirate Scents, copiado de las páginas de Canva que envió el dueño
 * (13 capturas, 23-oct-2026). Del Canva solo salen el NOMBRE y el PRECIO de cada loción;
 * todo lo demás queda vacío hasta que el dueño lo confirme (nunca se inventa).
 *
 * Decisiones provisionales (pendientes de confirmar con el dueño):
 * - Las lociones que evocan marcas de diseñador o nicho (Dior, Chanel, Creed…) se publican
 *   como EQUIVALENCIAS con el nombre comercial completo del perfume que evocan
 *   ("Dior Sauvage Elixir"), siempre bajo la marca "Línea Equivalencias", en su categoría y con
 *   el aviso de la ficha: nunca como si fueran el original.
 * - La marca de las lociones árabes es la que aparece en el nombre o en la etiqueta del frasco.
 * - Fotos: las lociones árabes usan la foto oficial de la marca o de un distribuidor autorizado
 *   (nov-2026), con el fondo recortado para el escenario negro de la tienda; fuentes en
 *   product-photos.sources.json (`npm run fotos:descargar`). Las equivalencias usan, a pedido
 *   del dueño (nov-2026), la foto oficial del perfume original como referencia del aroma; la
 *   ficha aclara que el cliente recibe la loción en el frasco de Emirate Scents.
 * - Sin mililitros, concentración ni notas: el Canva no los trae.
 * - Público (M = hombre, F = mujer, U = unisex): el que publica la marca o sus distribuidores
 *   (nov-2026). Noble, Shaheen Gold, Cookie Crave y Berry On Top quedan sin público porque las
 *   fuentes no coinciden: aparecen en el catálogo, pero no en las secciones Hombre / Mujer.
 *
 * Lo usa la vista previa de GitHub Pages (client/src/services/preview/previewCatalog.ts).
 * Para la tienda con base de datos se importa con docs/catalogo/lociones-canva.csv.
 */
import productPhotos from './product-photos.json' with { type: 'json' }
import type { DemoBrand, DemoProduct } from './products.demo.js'

export type CatalogProduct = DemoProduct & {
  /** Ruta dentro de client/public, por ejemplo /images/products/AR-0009/lattafa-khamrah.webp */
  images?: {
    url: string
    alt: string
    srcSet?: string
    illustrative?: boolean
    referenceOfOriginal?: boolean
  }[]
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
  lattafaPride: { slug: 'lattafa-pride', name: 'Lattafa Pride' },
  equivalencias: { slug: 'linea-equivalencias', name: 'Línea Equivalencias' },
} satisfies Record<string, DemoBrand>

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Foto descargada con `npm run fotos:descargar` (server/scripts/productPhotos.ts), si la hay. */
const photos: Partial<Record<string, { url: string; source: string; widths?: number[] }>> =
  productPhotos

/** srcset con las copias de 400, 800 y 1200 px que crea productPhotos.ts (la de 800 no lleva sufijo). */
function srcSetOf(photo: { url: string; widths?: number[] }) {
  if (!photo.widths || photo.widths.length < 2) return undefined
  return photo.widths
    .map((width) =>
      width === 800
        ? `${photo.url} 800w`
        : `${photo.url.replace(/\.webp$/, `-${width}.webp`)} ${width}w`,
    )
    .join(', ')
}

const askMore = 'Escríbenos por WhatsApp para conocer el tamaño, las notas y la disponibilidad.'

type Audience = NonNullable<DemoProduct['audience']>
const M: Audience = 'MASCULINO'
const F: Audience = 'FEMENINO'
const U: Audience = 'UNISEX'

function arabic(
  n: number,
  name: string,
  brand: DemoBrand,
  price: number,
  audience?: Audience,
  publishedAt = PUBLISHED_AT,
): CatalogProduct {
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
    audience,
    // Sin foto: la tienda muestra "Imagen próximamente"
    images: photos[sku]
      ? [
          {
            url: photos[sku].url,
            srcSet: srcSetOf(photos[sku]),
            alt: `Frasco de ${name}, de ${brand.name}`,
          },
        ]
      : [],
    stock: PREVIEW_STOCK,
    publishedAt,
  }
}

/** Las fotos propias y las ilustraciones son de Emirate; cualquier otra es del perfume original. */
function isOriginalPhoto(source: string) {
  return !source.startsWith('Ilustración') && !source.startsWith('Foto propia')
}

/**
 * fullName = nombre comercial completo del perfume que evoca, con su marca
 * ("Dior Sauvage Elixir"). La tarjeta muestra ese nombre tal cual (sin "Inspirado en"),
 * pero la equivalencia sigue identificada como tal: la marca de la tarjeta es
 * "Línea Equivalencias", está en su propia categoría y la ficha explica que no es el original.
 */
function equivalence(n: number, fullName: string, price: number, audience?: Audience) {
  const sku = `EQ-${String(n).padStart(4, '0')}`
  const photo = photos[sku]
  return {
    id: sku.toLowerCase(),
    sku,
    slug: slugify(fullName),
    name: fullName,
    brand: brands.equivalencias,
    categorySlug: 'equivalencias',
    shortDescription: `Equivalencia de Emirate Scents con el perfil olfativo de ${fullName}.`,
    description: `Loción con el perfil olfativo de ${fullName}. Es una equivalencia: no es el perfume original ni está asociada a esa marca. ${askMore}`,
    price,
    audience,
    inspirationReference: fullName,
    ...(photo && {
      images: [
        {
          url: photo.url,
          srcSet: srcSetOf(photo),
          illustrative: photo.source.startsWith('Ilustración'),
          // Foto del perfume de la marca (no es nuestro frasco): la ficha lo explica
          referenceOfOriginal: isOriginalPhoto(photo.source),
          // Las ilustraciones las crea server/scripts/equivalenceArt.ts
          alt: photo.source.startsWith('Ilustración')
            ? `Ilustración del frasco Emirate Scents, equivalencia de ${fullName}`
            : isOriginalPhoto(photo.source)
              ? `Frasco de ${fullName}, como referencia de la equivalencia`
              : `Frasco de Emirate Scents, equivalencia de ${fullName}`,
        },
      ],
    }),
    stock: PREVIEW_STOCK,
    publishedAt: PUBLISHED_AT,
  } satisfies CatalogProduct
}

const { lattafa, orientica, afnan, alHaramain, armaf } = brands

// En el orden de las páginas del Canva
export const catalogProducts: CatalogProduct[] = [
  // Página 1
  arabic(1, 'Vulcan Feu', brands.frenchAvenue, 110000, U),
  arabic(2, 'Sehr', lattafa, 110000, U),
  arabic(3, 'Fakhar Black', lattafa, 105000, M),
  arabic(4, 'Noble', orientica, 100000),
  // Página 2
  arabic(5, 'Asad Bourbon', lattafa, 90000, M),
  arabic(6, 'Asad Clásico', lattafa, 90000, M),
  arabic(7, 'Asad Elixir', lattafa, 90000, M),
  arabic(8, 'Khamrah Dukhan', lattafa, 105000, U),
  arabic(9, 'Khamrah', lattafa, 105000, U),
  arabic(10, 'Khamrah Qahwa', lattafa, 105000, U),
  arabic(11, 'Khamrah Waha', lattafa, 110000, U),
  // Página 3
  arabic(12, '9PM Rebel', afnan, 90000, U),
  arabic(13, '9PM Night Out', afnan, 110000, M),
  arabic(14, '9AM', afnan, 90000, M),
  arabic(15, '9PM', afnan, 90000, M),
  // Página 4
  equivalence(1, 'Xerjoff Erba Pura', 110000, U),
  arabic(16, 'Nitro Red', brands.dumont, 90000, M),
  equivalence(2, 'Jean Paul Gaultier Le Male Le Parfum', 105000, M),
  equivalence(3, 'Jean Paul Gaultier Le Beau Le Parfum', 105000, M),
  equivalence(4, 'Jean Paul Gaultier Le Male Elixir', 105000, M),
  // Página 5
  arabic(17, 'Amber Oud Dubai Night', alHaramain, 105000, U),
  arabic(18, 'Amber Oud', alHaramain, 105000, U),
  arabic(19, 'Amber Oud Aqua Dubai', alHaramain, 105000, U),
  arabic(20, 'Club de Nuit', armaf, 90000, M),
  arabic(21, 'Club de Nuit Sillage', armaf, 90000, U),
  // Página 6
  equivalence(5, 'Creed Silver Mountain Water', 80000, U),
  equivalence(6, 'Chanel Bleu de Chanel', 80000, M),
  equivalence(7, 'Lacoste Red', 80000, M),
  equivalence(8, 'Carolina Herrera 212 VIP Black', 80000, M),
  // Página 7
  arabic(22, 'Odyssey Aqua', armaf, 90000, M),
  equivalence(9, 'Le Labo Santal 33', 90000, U),
  arabic(23, 'Shaheen Gold', lattafa, 95000),
  arabic(24, 'Hawas for Him', brands.rasasi, 95000, M),
  // Página 8
  arabic(25, 'Honor & Glory', lattafa, 100000, U),
  arabic(26, 'Amethyst', lattafa, 100000, U),
  equivalence(10, 'Dior Sauvage', 80000, M),
  equivalence(11, 'Dior Sauvage Elixir', 90000, M),
  // Página 9
  arabic(27, 'Yum Yum', armaf, 110000, F),
  arabic(28, 'Yara Candy', lattafa, 90000, F),
  equivalence(12, 'Lancôme La Vie Est Belle', 80000, F),
  arabic(29, 'Yara', lattafa, 90000, F),
  arabic(30, 'Yara Elixir', lattafa, 90000, F),
  // Página 10
  equivalence(13, 'Moschino Toy 2 Bubble Gum', 80000, U),
  equivalence(14, 'Carolina Herrera La Bomba', 95000, F),
  arabic(31, 'Mayar', lattafa, 110000, F),
  arabic(32, 'Rose', brands.bharara, 105000, F),
  // Página 11
  equivalence(15, 'Ariana Grande Cloud', 100000, F),
  equivalence(16, 'Ariana Grande Thank U, Next', 95000, F),
  equivalence(17, 'Carolina Herrera Good Girl', 85000, F),
  equivalence(18, 'Carolina Herrera Good Girl Blush', 85000, F),
  // Página 12
  arabic(33, 'Cookie Crave', lattafa, 115000),
  arabic(34, 'Berry On Top', lattafa, 115000),
  arabic(35, 'Vanilla Freak', lattafa, 110000, U),
  // Página 13
  arabic(36, 'Royal Amber', orientica, 100000, U),
  arabic(37, 'Amber Rouge', orientica, 100000, U),
  arabic(38, 'Eclaire', lattafa, 95000, F),
  arabic(39, 'Now Women', brands.rave, 90000, F),
  // Fuera del Canva: enviados por el dueño el 8-nov-2026 (nombre, precio y foto)
  arabic(40, 'Hawas Fire', brands.rasasi, 95000, M, '2026-11-08'),
  arabic(41, 'Hawas Ice', brands.rasasi, 95000, M, '2026-11-08'),
  arabic(42, 'Art of Universe', brands.lattafaPride, 100000, U, '2026-11-08'),
]
