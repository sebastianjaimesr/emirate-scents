import { prisma } from '../src/lib/prisma.js'
import { buildSearchText } from '../src/lib/text.js'

/*
  Datos de prueba propios (no los DEMO): así las pruebas no dependen del catálogo
  de demostración, que desaparecerá cuando llegue el real.
*/

interface FixtureProduct {
  id: string
  name: string
  brand: 'marca-a' | 'marca-b'
  category: 'perfumes-arabes' | 'nicho'
  price: number
  sizeMl?: number
  olfactoryFamily?: string
  notesHeart?: string[]
  isFeatured?: boolean
  isNew?: boolean
  status?: 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO'
  publishedAt: string
}

export const fixtureProducts: FixtureProduct[] = [
  {
    id: 'p1',
    name: 'Ámbar Real',
    brand: 'marca-a',
    category: 'perfumes-arabes',
    price: 200000,
    sizeMl: 100,
    olfactoryFamily: 'Oriental',
    publishedAt: '2026-03-01',
  },
  {
    id: 'p2',
    name: 'Oud Rosa',
    brand: 'marca-a',
    category: 'perfumes-arabes',
    price: 300000,
    sizeMl: 50,
    olfactoryFamily: 'Amaderada',
    notesHeart: ['Rosa'],
    isFeatured: true,
    publishedAt: '2026-01-01',
  },
  {
    id: 'p3',
    name: 'Cuero',
    brand: 'marca-b',
    category: 'nicho',
    price: 700000,
    sizeMl: 100,
    olfactoryFamily: 'Amaderada',
    isNew: true,
    publishedAt: '2026-02-01',
  },
  {
    id: 'p4',
    name: 'Ámbar Nocturno',
    brand: 'marca-b',
    category: 'perfumes-arabes',
    price: 250000,
    sizeMl: 100,
    olfactoryFamily: 'Oriental',
    publishedAt: '2026-04-01',
  },
  {
    id: 'p5',
    name: 'Borrador Secreto',
    brand: 'marca-a',
    category: 'perfumes-arabes',
    price: 1000,
    status: 'BORRADOR',
    publishedAt: '2026-05-01',
  },
]

const brandNames = { 'marca-a': 'Marca A', 'marca-b': 'Marca B' }

export async function resetCatalog() {
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.category.deleteMany()

  await prisma.category.createMany({
    data: [
      { id: 'c-arabes', slug: 'perfumes-arabes', name: 'Perfumes árabes', position: 0 },
      { id: 'c-nicho', slug: 'nicho', name: 'Perfumería de nicho', position: 1 },
    ],
  })
  await prisma.brand.createMany({
    data: Object.entries(brandNames).map(([slug, name]) => ({ id: slug, slug, name })),
  })

  for (const product of fixtureProducts) {
    await prisma.product.create({
      data: {
        id: product.id,
        sku: product.id.toUpperCase(),
        slug: product.id,
        name: product.name,
        brandId: product.brand,
        categoryId: product.category === 'nicho' ? 'c-nicho' : 'c-arabes',
        shortDescription: '',
        description: '',
        price: product.price,
        sizeMl: product.sizeMl,
        olfactoryFamily: product.olfactoryFamily,
        notesHeart: product.notesHeart ?? [],
        isFeatured: product.isFeatured ?? false,
        isNew: product.isNew ?? false,
        status: product.status ?? 'PUBLICADO',
        stock: 5,
        searchText: buildSearchText({ ...product, brandName: brandNames[product.brand] }),
        publishedAt: new Date(product.publishedAt),
      },
    })
  }
}
