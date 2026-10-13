/**
 * Semilla de la base de datos: `npm run db:seed`.
 * Carga las categorías reales y los productos DEMO (marcados con isDemo: true).
 * En producción (NODE_ENV=production) carga solo las categorías.
 * Se puede ejecutar varias veces: actualiza lo que ya existe en lugar de duplicarlo.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { buildSearchText } from '../src/lib/text.js'
import { categories } from './data/categories.js'
import { demoProducts } from './data/products.demo.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString)
  throw new Error('Falta DATABASE_URL (copia server/.env.example como server/.env)')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function main() {
  for (const [position, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, position },
      update: { name: category.name, position },
    })
  }

  // En producción, la tienda real no debe mostrar productos de demostración.
  // (SEED_DEMO=true los carga igual, por ejemplo en un sitio de pruebas.)
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO !== 'true') {
    console.log(
      `Semilla lista: ${categories.length} categorías. Productos DEMO omitidos (producción).`,
    )
    return
  }

  for (const product of demoProducts) {
    const brand = await prisma.brand.upsert({
      where: { slug: product.brand.slug },
      create: product.brand,
      update: { name: product.brand.name },
    })
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: product.categorySlug },
    })

    const data = {
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      brandId: brand.id,
      categoryId: category.id,
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price,
      sizeMl: product.sizeMl ?? null,
      concentration: product.concentration ?? null,
      olfactoryFamily: product.olfactoryFamily ?? null,
      notesTop: product.notes?.top ?? [],
      notesHeart: product.notes?.heart ?? [],
      notesBase: product.notes?.base ?? [],
      audience: product.audience ?? null,
      inspirationReference: product.inspirationReference ?? null,
      stock: product.stock,
      status: 'PUBLICADO' as const,
      isNew: product.isNew ?? false,
      isFeatured: product.isFeatured ?? false,
      isBestSeller: product.isBestSeller ?? false,
      isDemo: true,
      searchText: buildSearchText({
        ...product,
        brandName: product.brand.name,
        ...(product.notes && {
          notesTop: product.notes.top,
          notesHeart: product.notes.heart,
          notesBase: product.notes.base,
        }),
      }),
      publishedAt: new Date(`${product.publishedAt}T12:00:00Z`),
    }

    // Las existencias solo se fijan al crear el producto, como una entrada del historial de
    // inventario. Al repetir la semilla no se tocan: las cambia el panel con sus movimientos.
    const { stock, ...withoutStock } = data
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        ...data,
        ...(stock > 0 && {
          inventoryMovements: {
            create: {
              type: 'ENTRADA',
              quantity: stock,
              stockAfter: stock,
              reason: 'Inventario DEMO',
            },
          },
        }),
      },
      update: withoutStock,
    })
  }

  console.log(
    `Semilla lista: ${categories.length} categorías y ${demoProducts.length} productos DEMO.`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
