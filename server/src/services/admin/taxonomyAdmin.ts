import { HttpError, notFound } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { buildSearchText } from '../../lib/text.js'

/*
  Categorías y marcas. Una categoría o marca con productos no se puede borrar
  (la base de datos lo impide con "Restrict"): primero hay que mover esos productos.
*/

interface CategoryInput {
  name: string
  slug: string
  position: number
}

async function checkCategorySlug(slug: string | undefined, exceptId?: string) {
  if (!slug) return
  const other = await prisma.category.findUnique({ where: { slug } })
  if (other && other.id !== exceptId) {
    throw new HttpError(409, 'DUPLICATE_SLUG', `Ya existe una categoría con la dirección ${slug}`)
  }
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  })
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    position: category.position,
    productCount: category._count.products,
  }))
}

export async function createCategory(input: CategoryInput) {
  await checkCategorySlug(input.slug)
  return prisma.category.create({
    data: input,
    select: { id: true, slug: true, name: true, position: true },
  })
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  if (!(await prisma.category.findUnique({ where: { id } })))
    throw notFound('Categoría no encontrada')
  await checkCategorySlug(input.slug, id)
  return prisma.category.update({
    where: { id },
    data: input,
    select: { id: true, slug: true, name: true, position: true },
  })
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!category) throw notFound('Categoría no encontrada')
  if (category._count.products > 0) {
    throw new HttpError(
      409,
      'CATEGORY_IN_USE',
      `La categoría tiene ${category._count.products} producto(s): muévelos a otra antes de borrarla`,
    )
  }
  await prisma.category.delete({ where: { id } })
}

interface BrandInput {
  name: string
  slug: string
}

async function checkBrandSlug(slug: string | undefined, exceptId?: string) {
  if (!slug) return
  const other = await prisma.brand.findUnique({ where: { slug } })
  if (other && other.id !== exceptId) {
    throw new HttpError(409, 'DUPLICATE_SLUG', `Ya existe una marca con la dirección ${slug}`)
  }
}

export async function listBrands() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
  return brands.map((brand) => ({
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    productCount: brand._count.products,
  }))
}

export async function createBrand(input: BrandInput) {
  await checkBrandSlug(input.slug)
  return prisma.brand.create({ data: input, select: { id: true, slug: true, name: true } })
}

/** Al renombrar una marca se actualiza el texto de búsqueda de sus productos. */
export async function updateBrand(id: string, input: Partial<BrandInput>) {
  if (!(await prisma.brand.findUnique({ where: { id } }))) throw notFound('Marca no encontrada')
  await checkBrandSlug(input.slug, id)
  return prisma.$transaction(async (tx) => {
    const brand = await tx.brand.update({
      where: { id },
      data: input,
      select: { id: true, slug: true, name: true },
    })
    if (input.name) {
      const products = await tx.product.findMany({ where: { brandId: id } })
      for (const product of products) {
        await tx.product.update({
          where: { id: product.id },
          data: { searchText: buildSearchText({ ...product, brandName: brand.name }) },
        })
      }
    }
    return brand
  })
}

export async function deleteBrand(id: string) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!brand) throw notFound('Marca no encontrada')
  if (brand._count.products > 0) {
    throw new HttpError(
      409,
      'BRAND_IN_USE',
      `La marca tiene ${brand._count.products} producto(s): cámbiales la marca antes de borrarla`,
    )
  }
  await prisma.brand.delete({ where: { id } })
}
