/**
 * Controlador de pedidos de la tienda.
 */
import type { Request, Response } from 'express'
import { logger } from '../lib/logger.js'
import { createOrder } from '../services/orderService.js'
import { createOrderSchema } from '../validators/order.js'

/** POST /api/orders: valida el pedido, lo crea y responde con el número y el enlace de WhatsApp. */
export async function postOrder(req: Request, res: Response) {
  const input = createOrderSchema.parse(req.body)
  const order = await createOrder(input)
  // Solo el número y el total: nunca nombre, teléfono ni dirección en los registros
  logger.info({ orderNumber: order.orderNumber, total: order.total }, 'Pedido registrado')
  res.status(201).json(order)
}
