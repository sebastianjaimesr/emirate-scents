/**
 * ⚠️  DATOS DE DEMOSTRACIÓN — NO SON PRODUCTOS REALES NI ESTÁN A LA VENTA ⚠️
 *
 * Sirven solo para construir y probar la tienda mientras llega la información real.
 * Las marcas ("Casa DEMO ...") y los productos son ficticios, los precios son de ejemplo
 * y no hay fotografías. Todos llevan isDemo: true, y la tienda lo muestra con una
 * etiqueta "DEMO" y desactiva los pedidos.
 *
 * La semilla (prisma/seed.ts) los carga en la base de datos. Cuando tengamos el catálogo
 * real, se cargará con su propio script y estos productos se eliminarán.
 */

export interface DemoBrand {
  slug: string
  name: string
}

export interface DemoProduct {
  id: string
  sku: string
  slug: string
  name: string
  brand: DemoBrand
  categorySlug: string
  shortDescription: string
  description: string
  price: number
  sizeMl?: number
  concentration?: 'EXTRAIT' | 'PARFUM' | 'EDP' | 'EDT' | 'EDC' | 'ACEITE' | 'OTRA'
  olfactoryFamily?: string
  notes?: { top: string[]; heart: string[]; base: string[] }
  audience?: 'FEMENINO' | 'MASCULINO' | 'UNISEX'
  inspirationReference?: string
  stock: number
  isNew?: boolean
  isFeatured?: boolean
  isBestSeller?: boolean
  publishedAt: string
}

const brands = {
  noor: { slug: 'casa-demo-noor', name: 'Casa DEMO Noor' },
  sahar: { slug: 'casa-demo-sahar', name: 'Casa DEMO Sahar' },
  atelier: { slug: 'atelier-demo', name: 'Atelier DEMO' },
  maison: { slug: 'maison-demo', name: 'Maison DEMO' },
  studio: { slug: 'studio-demo-niche', name: 'Studio DEMO Niche' },
  equivalencias: { slug: 'linea-demo-equivalencias', name: 'Línea DEMO Equivalencias' },
} satisfies Record<string, DemoBrand>

type DemoInput = Omit<DemoProduct, 'id' | 'description'> & { description?: string }

function demo(input: DemoInput): DemoProduct {
  return {
    ...input,
    // Mismo id que en las fases 3 y 4, para que los carritos guardados en el navegador sigan valiendo
    id: `demo-${input.sku.toLowerCase()}`,
    description:
      input.description ??
      `${input.shortDescription} Este es un producto de demostración creado para probar la tienda: no está a la venta y su información es ficticia.`,
  }
}

export const demoProducts: DemoProduct[] = [
  // ── Perfumes árabes ─────────────────────────────────────────
  demo({
    sku: 'AR-0001',
    slug: 'demo-oud-nocturno',
    name: 'Oud Nocturno',
    brand: brands.noor,
    categorySlug: 'perfumes-arabes',
    shortDescription: 'Oud ahumado con rosa y azafrán.',
    price: 285000,
    sizeMl: 100,
    concentration: 'EDP',
    olfactoryFamily: 'Amaderada',
    notes: {
      top: ['Azafrán', 'Bergamota'],
      heart: ['Rosa', 'Pachulí'],
      base: ['Oud', 'Ámbar', 'Almizcle'],
    },
    audience: 'UNISEX',
    stock: 8,
    isFeatured: true,
    publishedAt: '2026-09-02',
  }),
  demo({
    sku: 'AR-0002',
    slug: 'demo-ambar-del-desierto',
    name: 'Ámbar del Desierto',
    brand: brands.noor,
    categorySlug: 'perfumes-arabes',
    shortDescription: 'Ámbar resinoso, vainilla y especias cálidas.',
    price: 240000,
    sizeMl: 100,
    concentration: 'EDP',
    olfactoryFamily: 'Oriental',
    notes: { top: ['Cardamomo'], heart: ['Canela', 'Benjuí'], base: ['Ámbar', 'Vainilla'] },
    audience: 'UNISEX',
    stock: 2,
    isNew: true,
    publishedAt: '2026-10-01',
  }),
  demo({
    sku: 'AR-0003',
    slug: 'demo-rosa-de-taif',
    name: 'Rosa de Taif',
    brand: brands.sahar,
    categorySlug: 'perfumes-arabes',
    shortDescription: 'Rosa luminosa sobre un fondo de almizcle blanco.',
    price: 198000,
    sizeMl: 80,
    concentration: 'EDP',
    olfactoryFamily: 'Floral',
    notes: { top: ['Lichi', 'Pimienta rosa'], heart: ['Rosa'], base: ['Almizcle', 'Sándalo'] },
    audience: 'FEMENINO',
    stock: 12,
    publishedAt: '2026-08-15',
  }),
  demo({
    sku: 'AR-0004',
    slug: 'demo-musk-al-sahar',
    name: 'Musk Al Sahar',
    brand: brands.sahar,
    categorySlug: 'perfumes-arabes',
    shortDescription: 'Almizcle limpio y suave, cercano a la piel.',
    price: 95000,
    sizeMl: 12,
    concentration: 'ACEITE',
    olfactoryFamily: 'Almizclada',
    notes: { top: ['Aldehídos'], heart: ['Flor de algodón'], base: ['Almizcle blanco'] },
    audience: 'UNISEX',
    stock: 0,
    publishedAt: '2026-07-20',
  }),

  // ── Perfumes de diseñador ───────────────────────────────────
  demo({
    sku: 'DS-0001',
    slug: 'demo-noir-intense',
    name: 'Noir Intense',
    brand: brands.maison,
    categorySlug: 'disenador',
    shortDescription: 'Lavanda y haba tonka con un fondo amaderado.',
    price: 520000,
    sizeMl: 100,
    concentration: 'EDP',
    olfactoryFamily: 'Aromática',
    notes: { top: ['Lavanda', 'Bergamota'], heart: ['Salvia'], base: ['Haba tonka', 'Cedro'] },
    audience: 'MASCULINO',
    stock: 5,
    isFeatured: true,
    publishedAt: '2026-06-10',
  }),
  demo({
    sku: 'DS-0002',
    slug: 'demo-fleur-de-soie',
    name: 'Fleur de Soie',
    brand: brands.maison,
    categorySlug: 'disenador',
    shortDescription: 'Jazmín y flor de azahar envueltos en vainilla.',
    price: 465000,
    sizeMl: 50,
    concentration: 'EDP',
    olfactoryFamily: 'Floral',
    notes: { top: ['Pera'], heart: ['Jazmín', 'Azahar'], base: ['Vainilla', 'Almizcle'] },
    audience: 'FEMENINO',
    stock: 9,
    isNew: true,
    publishedAt: '2026-09-25',
  }),
  demo({
    sku: 'DS-0003',
    slug: 'demo-aqua-citrus',
    name: 'Aqua Citrus',
    brand: brands.atelier,
    categorySlug: 'disenador',
    shortDescription: 'Cítricos frescos y notas marinas.',
    price: 310000,
    sizeMl: 100,
    concentration: 'EDT',
    olfactoryFamily: 'Cítrica',
    notes: { top: ['Limón', 'Mandarina'], heart: ['Notas marinas'], base: ['Vetiver'] },
    audience: 'MASCULINO',
    stock: 14,
    publishedAt: '2026-05-05',
  }),
  demo({
    sku: 'DS-0004',
    slug: 'demo-velvet-iris',
    name: 'Velvet Iris',
    brand: brands.atelier,
    categorySlug: 'disenador',
    shortDescription: 'Iris empolvado con cacao y pachulí.',
    price: 389000,
    sizeMl: 80,
    concentration: 'PARFUM',
    olfactoryFamily: 'Floral',
    notes: { top: ['Mandarina'], heart: ['Iris', 'Cacao'], base: ['Pachulí'] },
    audience: 'FEMENINO',
    stock: 3,
    publishedAt: '2026-08-30',
  }),

  // ── Perfumería de nicho ─────────────────────────────────────
  demo({
    sku: 'NI-0001',
    slug: 'demo-incienso-sagrado',
    name: 'Incienso Sagrado',
    brand: brands.studio,
    categorySlug: 'nicho',
    shortDescription: 'Olíbano, mirra y madera de cedro.',
    price: 690000,
    sizeMl: 100,
    concentration: 'EXTRAIT',
    olfactoryFamily: 'Amaderada',
    notes: { top: ['Pimienta negra'], heart: ['Olíbano', 'Mirra'], base: ['Cedro', 'Labdano'] },
    audience: 'UNISEX',
    stock: 4,
    isFeatured: true,
    publishedAt: '2026-07-01',
  }),
  demo({
    sku: 'NI-0002',
    slug: 'demo-cuero-y-tabaco',
    name: 'Cuero y Tabaco',
    brand: brands.studio,
    categorySlug: 'nicho',
    shortDescription: 'Cuero suave, hoja de tabaco y miel.',
    price: 745000,
    sizeMl: 100,
    concentration: 'EDP',
    olfactoryFamily: 'Cuero',
    notes: { top: ['Ron'], heart: ['Hoja de tabaco', 'Miel'], base: ['Cuero', 'Haba tonka'] },
    audience: 'UNISEX',
    stock: 6,
    isNew: true,
    publishedAt: '2026-10-05',
  }),
  demo({
    sku: 'NI-0003',
    slug: 'demo-te-verde-de-kioto',
    name: 'Té Verde de Kioto',
    brand: brands.studio,
    categorySlug: 'nicho',
    shortDescription: 'Té verde, bambú e higo, sereno y transparente.',
    price: 560000,
    sizeMl: 50,
    concentration: 'EDP',
    olfactoryFamily: 'Verde',
    notes: { top: ['Té verde'], heart: ['Bambú', 'Higo'], base: ['Almizcle'] },
    audience: 'UNISEX',
    stock: 7,
    publishedAt: '2026-04-18',
  }),
  demo({
    sku: 'NI-0004',
    slug: 'demo-especias-de-zanzibar',
    name: 'Especias de Zanzíbar',
    brand: brands.studio,
    categorySlug: 'nicho',
    shortDescription: 'Clavo, nuez moscada y vainilla oscura.',
    price: 615000,
    sizeMl: 75,
    concentration: 'EXTRAIT',
    olfactoryFamily: 'Oriental',
    notes: { top: ['Clavo'], heart: ['Nuez moscada', 'Canela'], base: ['Vainilla', 'Sándalo'] },
    audience: 'UNISEX',
    stock: 0,
    publishedAt: '2026-06-28',
  }),

  // ── Equivalencias ───────────────────────────────────────────
  demo({
    sku: 'EQ-0001',
    slug: 'demo-equivalencia-fresca-amaderada',
    name: 'Equivalencia Fresca Amaderada',
    brand: brands.equivalencias,
    categorySlug: 'equivalencias',
    shortDescription: 'Inspirada en un perfil fresco y amaderado.',
    inspirationReference: 'Perfil olfativo de referencia (DEMO)',
    price: 85000,
    sizeMl: 100,
    concentration: 'EDP',
    olfactoryFamily: 'Amaderada',
    notes: { top: ['Bergamota', 'Pimienta'], heart: ['Lavanda'], base: ['Ambroxán', 'Cedro'] },
    audience: 'MASCULINO',
    stock: 20,
    publishedAt: '2026-09-10',
  }),
  demo({
    sku: 'EQ-0002',
    slug: 'demo-equivalencia-floral-dulce',
    name: 'Equivalencia Floral Dulce',
    brand: brands.equivalencias,
    categorySlug: 'equivalencias',
    shortDescription: 'Inspirada en un perfil floral y gourmand.',
    inspirationReference: 'Perfil olfativo de referencia (DEMO)',
    price: 85000,
    sizeMl: 100,
    concentration: 'EDP',
    olfactoryFamily: 'Floral',
    notes: { top: ['Pera'], heart: ['Jazmín'], base: ['Praliné', 'Vainilla'] },
    audience: 'FEMENINO',
    stock: 15,
    isNew: true,
    publishedAt: '2026-10-08',
  }),
  demo({
    sku: 'EQ-0003',
    slug: 'demo-equivalencia-oriental',
    name: 'Equivalencia Oriental',
    brand: brands.equivalencias,
    categorySlug: 'equivalencias',
    shortDescription: 'Inspirada en un perfil oriental especiado.',
    inspirationReference: 'Perfil olfativo de referencia (DEMO)',
    price: 72000,
    sizeMl: 50,
    concentration: 'EDP',
    olfactoryFamily: 'Oriental',
    notes: { top: ['Cardamomo'], heart: ['Rosa'], base: ['Oud', 'Ámbar'] },
    audience: 'UNISEX',
    stock: 11,
    publishedAt: '2026-08-02',
  }),
  demo({
    sku: 'EQ-0004',
    slug: 'demo-equivalencia-citrica',
    name: 'Equivalencia Cítrica',
    brand: brands.equivalencias,
    categorySlug: 'equivalencias',
    shortDescription: 'Inspirada en un perfil cítrico y luminoso.',
    inspirationReference: 'Perfil olfativo de referencia (DEMO)',
    price: 72000,
    sizeMl: 50,
    concentration: 'EDT',
    olfactoryFamily: 'Cítrica',
    notes: { top: ['Limón', 'Pomelo'], heart: ['Neroli'], base: ['Almizcle'] },
    audience: 'UNISEX',
    stock: 1,
    publishedAt: '2026-05-22',
  }),
]
