/**
 * Controlador de pedidos de la tienda.
 */
import type { Request, Response } from 'express'
import { logger } from '../lib/logger.js'
import { createOrder } from '../services/orderService.js'
import { createOrderSchema } from '../validators/order.js'

/**
 * POST /api/orders: valida el pedido, lo crea y responde 201 con el número, las líneas y los totales.
 * El mensaje de WhatsApp lo arma la tienda (OrderConfirmationPage) con esa respuesta.
 */
export async function postOrder(req: Request, res: Response) {
  const input = createOrderSchema.parse(req.body)
  const order = await createOrder(input)
  // Solo el número y el total: nunca nombre, teléfono ni dirección en los registros
  logger.info({ orderNumber: order.orderNumber, total: order.total }, 'Pedido registrado')
  res.status(201).json(order)
}
