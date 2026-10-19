import type { Request, Response } from 'express'
import { currentAdmin } from '../admin/guards.js'
import { HttpError } from '../lib/httpError.js'
import { getDashboard } from '../services/admin/dashboardAdmin.js'
import * as images from '../services/admin/imageAdmin.js'
import * as inventory from '../services/admin/inventoryAdmin.js'
import * as orders from '../services/admin/orderAdmin.js'
import * as products from '../services/admin/productAdmin.js'
import * as taxonomy from '../services/admin/taxonomyAdmin.js'
import {
  adminProductsQuerySchema,
  brandSchema,
  categorySchema,
  createProductSchema,
  idParam,
  imageAltSchema,
  imageOrderSchema,
  imageParams,
  inventoryMovementSchema,
  movementsQuerySchema,
  orderShippingSchema,
  ordersQuerySchema,
  orderStatusChangeSchema,
  productStatusSchema,
  updateBrandSchema,
  updateCategorySchema,
  updateProductSchema,
} from '../validators/admin.js'

/*
  Controladores del panel. Todas estas rutas pasan antes por requireAdmin (routes/admin.ts):
  aquí ya hay un administrador con sesión vigente. Cada entrada se valida con Zod.
*/

// ── Resumen ──
export async function dashboard(_req: Request, res: Response) {
  res.json(await getDashboard())
}

// ── Productos ──
export async function listProducts(req: Request, res: Response) {
  res.json(await products.listAdminProducts(adminProductsQuerySchema.parse(req.query)))
}

/** GET de un producto del panel por id. */
export async function getProduct(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  res.json(await products.getAdminProduct(id))
}

/** Crea un producto (responde 201). */
export async function createProduct(req: Request, res: Response) {
  const input = createProductSchema.parse(req.body)
  res.status(201).json(await products.createAdminProduct(input, currentAdmin(res).id))
}

/** Actualiza un producto. */
export async function updateProduct(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  res.json(await products.updateAdminProduct(id, updateProductSchema.parse(req.body)))
}

/** Cambia el estado de publicación de un producto. */
export async function setProductStatus(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const { status } = productStatusSchema.parse(req.body)
  res.json(await products.setProductStatus(id, status))
}

/** Borra un producto y luego sus fotos guardadas (responde 204). */
export async function deleteProduct(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const storageKeys = await products.deleteAdminProduct(id)
  await images.removeStoredImages(storageKeys)
  res.status(204).end()
}

// ── Fotos ──
export async function uploadImage(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  if (!req.file) {
    throw new HttpError(400, 'MISSING_IMAGE', 'Adjunta una foto en el campo "imagen"')
  }
  const alt =
    typeof req.body?.alt === 'string' ? imageAltSchema.parse({ alt: req.body.alt }).alt : undefined
  res.status(201).json(await images.addProductImage(id, req.file.buffer, alt))
}

/** Cambia el texto alternativo de una foto. */
export async function updateImage(req: Request, res: Response) {
  const { id, imageId } = imageParams.parse(req.params)
  const { alt } = imageAltSchema.parse(req.body)
  res.json(await images.updateImageAlt(id, imageId, alt))
}

/** Cambia el orden de las fotos de un producto. */
export async function reorderImages(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const { imageIds } = imageOrderSchema.parse(req.body)
  res.json({ items: await images.reorderImages(id, imageIds) })
}

/** Borra una foto de un producto. */
export async function deleteImage(req: Request, res: Response) {
  const { id, imageId } = imageParams.parse(req.params)
  await images.deleteProductImage(id, imageId)
  res.status(204).end()
}

// ── Inventario ──
export async function listMovements(req: Request, res: Response) {
  res.json(await inventory.listMovements(movementsQuerySchema.parse(req.query)))
}

/** Registra un movimiento de inventario (entrada o ajuste). */
export async function createMovement(req: Request, res: Response) {
  const input = inventoryMovementSchema.parse(req.body)
  res.status(201).json(await inventory.recordMovement(input, currentAdmin(res).id))
}

// ── Pedidos ──
export async function listOrders(req: Request, res: Response) {
  res.json(await orders.listAdminOrders(ordersQuerySchema.parse(req.query)))
}

/** GET de un pedido del panel por id. */
export async function getOrder(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  res.json(await orders.getAdminOrder(id))
}

/** Cambia el estado de un pedido (solo a los estados permitidos). */
export async function changeOrderStatus(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const input = orderStatusChangeSchema.parse(req.body)
  res.json(await orders.changeOrderStatus(id, input, currentAdmin(res).id))
}

/** Define el costo de envío de un pedido. */
export async function setOrderShipping(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const { shippingCost } = orderShippingSchema.parse(req.body)
  res.json(await orders.setOrderShipping(id, shippingCost))
}

// ── Categorías ──
export async function listCategories(_req: Request, res: Response) {
  res.json({ items: await taxonomy.listCategories() })
}

/** Crea una categoría. */
export async function createCategory(req: Request, res: Response) {
  res.status(201).json(await taxonomy.createCategory(categorySchema.parse(req.body)))
}

/** Actualiza una categoría. */
export async function updateCategory(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  res.json(await taxonomy.updateCategory(id, updateCategorySchema.parse(req.body)))
}

/** Borra una categoría. */
export async function deleteCategory(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  await taxonomy.deleteCategory(id)
  res.status(204).end()
}

// ── Marcas ──
export async function listBrands(_req: Request, res: Response) {
  res.json({ items: await taxonomy.listBrands() })
}

/** Crea una marca. */
export async function createBrand(req: Request, res: Response) {
  res.status(201).json(await taxonomy.createBrand(brandSchema.parse(req.body)))
}

/** Actualiza una marca. */
export async function updateBrand(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  res.json(await taxonomy.updateBrand(id, updateBrandSchema.parse(req.body)))
}

/** Borra una marca. */
export async function deleteBrand(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  await taxonomy.deleteBrand(id)
  res.status(204).end()
}
