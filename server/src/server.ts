/**
 * Punto de entrada del servidor: arranca la API y la cierra de forma ordenada.
 */
import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { prisma } from './lib/prisma.js'

/** Arranca el servidor HTTP en el puerto configurado. */
const server = createApp().listen(env.PORT, () => {
  logger.info(`API de Emirate Scents lista en http://localhost:${env.PORT}/api`)
})

// Cierre ordenado (Ctrl+C o el hosting reiniciando): termina las peticiones y cierra la base de datos
function shutdown(signal: string) {
  logger.info(`${signal} recibido, cerrando el servidor…`)
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0))
  })
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
