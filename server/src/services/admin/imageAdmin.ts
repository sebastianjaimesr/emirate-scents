import { randomBytes } from 'node:crypto'
import sharp, { type Metadata } from 'sharp'
import { HttpError, notFound } from '../../lib/httpError.js'
import { logger } from '../../lib/logger.js'
import { prisma } from '../../lib/prisma.js'
import { imageStorage } from '../../storage/imageStorage.js'

/*
  Fotos de producto subidas desde el panel:
  1. se comprueba el tipo REAL del archivo leyendo su contenido (no su nombre ni lo que
     declara el navegador): solo JPG, PNG o WebP;
  2. se gira según la orientación de la cámara y se eliminan los metadatos (GPS, cámara...);
  3. se convierte a WebP en varias medidas (480, 960 y 1600 px de ancho, sin agrandar);
  4. se guarda en el almacenamiento y la base de datos registra la dirección.
*/

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_IMAGES_PER_PRODUCT = 12
const WIDTHS = [480, 960, 1600]
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp'])

const imageSelect = { id: true, url: true, alt: true, position: true, widths: true } as const

async function processImage(data: Buffer) {
  let metadata: Metadata
  try {
    metadata = await sharp(data, { limitInputPixels: 50_000_000 }).metadata()
  } catch {
    throw new HttpError(400, 'INVALID_IMAGE', 'El archivo no es una imagen válida')
  }
  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new HttpError(400, 'INVALID_IMAGE', 'Formato no admitido: usa JPG, PNG o WebP')
  }
  if ((metadata.pages ?? 1) > 1) {
    throw new HttpError(400, 'INVALID_IMAGE', 'Las imágenes animadas no se admiten')
  }
  // Ancho real después de aplicar la orientación de la cámara
  const width = (metadata.autoOrient?.width ?? metadata.width) || 0
  if (width < 300) {
    throw new HttpError(400, 'IMAGE_TOO_SMALL', 'La foto es muy pequeña: mínimo 300 px de ancho')
  }
  const widths = WIDTHS.filter((target) => target <= width)
  if (widths.length === 0 || widths.at(-1)! < width) widths.push(Math.min(width, WIDTHS.at(-1)!))
  const uniqueWidths = [...new Set(widths)].sort((a, b) => a - b)

  const variants = await Promise.all(
    uniqueWidths.map(async (target) => ({
      width: target,
      data: await sharp(data, { limitInputPixels: 50_000_000 })
        .rotate()
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer(),
    })),
  )
  return variants
}

export async function addProductImage(productId: string, data: Buffer, alt?: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { brand: { select: { name: true } }, _count: { select: { images: true } } },
  })
  if (!product) throw notFound('Producto no encontrado')
  if (product._count.images >= MAX_IMAGES_PER_PRODUCT) {
    throw new HttpError(
      409,
      'TOO_MANY_IMAGES',
      `Máximo ${MAX_IMAGES_PER_PRODUCT} fotos por producto: borra alguna antes de subir otra`,
    )
  }

  const variants = await processImage(data)
  const storageKey = `products/${product.id}/${randomBytes(8).toString('hex')}`
  let url = ''
  try {
    for (const variant of variants) {
      url = await imageStorage.put(`${storageKey}/${variant.width}.webp`, variant.data)
    }
    const last = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    const sizeLabel = product.sizeMl ? `, ${product.sizeMl} ml` : ''
    return await prisma.productImage.create({
      data: {
        productId,
        url,
        storageKey,
        widths: variants.map((variant) => variant.width),
        alt: alt || `${product.name} de ${product.brand.name}${sizeLabel}`,
        position: last ? last.position + 1 : 0,
      },
      select: imageSelect,
    })
  } catch (error) {
    // Si algo falla, no quedan archivos huérfanos
    await imageStorage.removeFolder(storageKey).catch(() => {})
    throw error
  }
}

async function findImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } })
  if (!image) throw notFound('Foto no encontrada')
  return image
}

export async function updateImageAlt(productId: string, imageId: string, alt: string) {
  await findImage(productId, imageId)
  return prisma.productImage.update({ where: { id: imageId }, data: { alt }, select: imageSelect })
}

/** Nuevo orden de la galería: la primera foto de la lista pasa a ser la principal. */
export async function reorderImages(productId: string, imageIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const images = await tx.productImage.findMany({ where: { productId }, select: { id: true } })
    const current = new Set(images.map((image) => image.id))
    if (images.length !== imageIds.length || !imageIds.every((id) => current.has(id))) {
      throw new HttpError(
        400,
        'INVALID_IMAGE_ORDER',
        'La lista debe incluir todas las fotos del producto',
      )
    }
    for (const [position, id] of imageIds.entries()) {
      await tx.productImage.update({ where: { id }, data: { position } })
    }
    return tx.productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
      select: imageSelect,
    })
  })
}

export async function deleteProductImage(productId: string, imageId: string) {
  const image = await findImage(productId, imageId)
  await prisma.$transaction(async (tx) => {
    await tx.productImage.delete({ where: { id: imageId } })
    // Las fotos siguientes suben un puesto: la galería no queda con huecos
    await tx.productImage.updateMany({
      where: { productId, position: { gt: image.position } },
      data: { position: { decrement: 1 } },
    })
  })
  if (image.storageKey) await removeStoredImages([image.storageKey])
}

/** Borra archivos de fotos. Un fallo aquí no deshace la operación: solo queda registrado. */
export async function removeStoredImages(storageKeys: string[]) {
  for (const key of storageKeys) {
    await imageStorage.removeFolder(key).catch((error: unknown) => {
      logger.error({ err: error, key }, 'No se pudo borrar una foto del almacenamiento')
    })
  }
}
