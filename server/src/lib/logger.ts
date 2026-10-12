import { pino } from 'pino'
import { env } from '../config/env.js'

/**
 * Registro de eventos del servidor. Oculta cabeceras sensibles y, desde la Fase 6,
 * los datos personales de los pedidos (teléfono, dirección).
 */
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    remove: true,
  },
})
