import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import { adminHeaders, requireAdmin, requireAdminOrigin } from '../admin/guards.js'
import * as admin from '../controllers/adminController.js'
import * as auth from '../controllers/adminAuthController.js'
import { MAX_IMAGE_BYTES } from '../services/admin/imageAdmin.js'

const tooManyAttempts = {
  error: {
    code: 'RATE_LIMITED',
    message: 'Demasiados intentos fallidos. Espera 15 minutos antes de volver a intentarlo.',
  },
}

/**
 * Rutas del panel (/api/admin). Se crean por cada app para que cada una (y cada archivo de
 * pruebas) tenga sus propios contadores de intentos.
 *
 * Orden de las protecciones:
 * 1. cabeceras: sin caché y fuera de los buscadores;
 * 2. origen: los cambios solo se aceptan desde la dirección del panel (anti-CSRF);
 * 3. límite de intentos de acceso: 5 fallidos cada 15 minutos por IP. No hay límite por correo
 *    a propósito: cualquiera que conozca el correo podría bloquear al administrador real
 *    desde otra conexión. Contra intentos desde muchas IP protegen la contraseña de 12+
 *    caracteres y el costo de Argon2id;
 * 4. sesión: todo lo demás exige un administrador con sesión vigente.
 */
export function createAdminRouter() {
  const router = Router()
  router.use(adminHeaders, requireAdminOrigin)

  const windowMs = 15 * 60 * 1000
  const loginByIp = rateLimit({
    windowMs,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: tooManyAttempts,
  })
  router.post('/auth/login', loginByIp, auth.login)
  router.post('/auth/logout', auth.logout)

  // A partir de aquí, todo exige sesión
  router.use(requireAdmin)
  router.get('/auth/me', auth.me)
  router.get('/dashboard', admin.dashboard)

  router.get('/products', admin.listProducts)
  router.post('/products', admin.createProduct)
  router.get('/products/:id', admin.getProduct)
  router.patch('/products/:id', admin.updateProduct)
  router.patch('/products/:id/status', admin.setProductStatus)
  router.delete('/products/:id', admin.deleteProduct)

  // Fotos: un archivo por petición, en memoria (máx. 8 MB) hasta procesarlo
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 2, fieldSize: 1024 },
  })
  router.post('/products/:id/images', upload.single('imagen'), admin.uploadImage)
  router.put('/products/:id/images/order', admin.reorderImages)
  router.patch('/products/:id/images/:imageId', admin.updateImage)
  router.delete('/products/:id/images/:imageId', admin.deleteImage)

  router.get('/inventory/movements', admin.listMovements)
  router.post('/inventory/movements', admin.createMovement)

  router.get('/orders', admin.listOrders)
  router.get('/orders/:id', admin.getOrder)
  router.patch('/orders/:id/status', admin.changeOrderStatus)
  router.patch('/orders/:id/shipping', admin.setOrderShipping)

  router.get('/categories', admin.listCategories)
  router.post('/categories', admin.createCategory)
  router.patch('/categories/:id', admin.updateCategory)
  router.delete('/categories/:id', admin.deleteCategory)

  router.get('/brands', admin.listBrands)
  router.post('/brands', admin.createBrand)
  router.patch('/brands/:id', admin.updateBrand)
  router.delete('/brands/:id', admin.deleteBrand)

  return router
}
