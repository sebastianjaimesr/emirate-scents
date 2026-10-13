import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env.js'

/*
  Dónde se guardan las fotos subidas desde el panel. Hoy: una carpeta del servidor
  (UPLOADS_DIR), servida en /uploads. La base de datos solo guarda la dirección.
  Si más adelante se usa un almacenamiento externo (por ejemplo Cloudflare R2), basta con
  otra implementación de esta misma interfaz.
*/
export interface ImageStorage {
  /** Guarda un archivo y devuelve su dirección pública. */
  put(key: string, data: Buffer): Promise<string>
  /** Borra todos los archivos de una carpeta (todas las medidas de una foto). */
  removeFolder(folder: string): Promise<void>
}

export const UPLOADS_URL_PREFIX = '/uploads'
export const uploadsRoot = path.resolve(env.UPLOADS_DIR)

/** Evita que una clave mal formada escriba fuera de la carpeta de fotos. */
function safePath(key: string) {
  if (!/^[a-z0-9/_-]+(\.webp)?$/i.test(key) || key.includes('..')) {
    throw new Error(`Clave de almacenamiento inválida: ${key}`)
  }
  const target = path.resolve(uploadsRoot, key)
  if (!target.startsWith(uploadsRoot + path.sep)) {
    throw new Error(`Clave de almacenamiento fuera de la carpeta: ${key}`)
  }
  return target
}

export const localStorage: ImageStorage = {
  async put(key, data) {
    const target = safePath(key)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, data)
    return `${UPLOADS_URL_PREFIX}/${key}`
  },
  async removeFolder(folder) {
    await rm(safePath(folder), { recursive: true, force: true })
  },
}

export const imageStorage: ImageStorage = localStorage
