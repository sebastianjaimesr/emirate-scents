import { hash, verify } from '@node-rs/argon2'

/*
  Contraseñas de administrador con Argon2id (el algoritmo recomendado por OWASP), con los
  parámetros mínimos que recomienda OWASP: 19 MiB de memoria, 2 iteraciones, 1 hilo.
  La contraseña nunca se guarda: solo su huella, que no se puede revertir.
*/
const options = { algorithm: 2 /* Argon2id */, memoryCost: 19_456, timeCost: 2, parallelism: 1 }

export const MIN_PASSWORD_LENGTH = 12

/** Cifra una contraseña con Argon2. */
export function hashPassword(password: string) {
  return hash(password, options)
}

/** Compara una contraseña con su huella cifrada; false si no coincide o si la huella es inválida. */
export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password)
  } catch {
    // Huella con formato inválido: se trata como contraseña incorrecta
    return false
  }
}

/**
 * Huella de una contraseña que nadie conoce. Cuando el correo no existe, se comprueba la
 * contraseña contra esta huella: así la respuesta tarda lo mismo exista o no el correo, y no
 * se puede averiguar qué correos tienen acceso midiendo el tiempo.
 */
let dummyHash: Promise<string> | undefined
/**
 * Huella falsa que se compara cuando el correo no existe, para que la respuesta tarde lo mismo
 * (así no se puede adivinar qué correos existen midiendo el tiempo).
 */
export function getDummyHash() {
  dummyHash ??= hash(crypto.randomUUID(), options)
  return dummyHash
}
