import type { Request, Response } from 'express'
import { logger } from '../lib/logger.js'
import { createOrder } from '../services/orderService.js'
import { createOrderSchema } from '../validators/order.js'

export async function postOrder(req: Request, res: Response) {
  const input = createOrderSchema.parse(req.body)
  const order = await createOrder(input)
  // Solo el número y el total: nunca nombre, teléfono ni dirección en los registros
  logger.info({ orderNumber: order.orderNumber, total: order.total }, 'Pedido registrado')
  res.status(201).json(order)
}
