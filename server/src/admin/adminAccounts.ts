import { z } from 'zod'
import { hashPassword, MIN_PASSWORD_LENGTH } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'

/*
  Alta de administradores y cambio de contraseña. Solo se usa desde la terminal
  (npm run admin:crear); el panel no tiene un formulario para crear cuentas.
*/

const COMMON_PASSWORDS = new Set([
  '123456789012',
  'contrasena123',
  'contraseña123',
  'password1234',
  'emiratescents',
  'emirate-scents',
  'qwertyuiopas',
])

/** Validación del correo del administrador (sin espacios, en minúsculas). */
export const adminEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Correo inválido'))
/** Validación del nombre del administrador. */
export const adminNameSchema = z.string().trim().min(2, 'Escribe tu nombre').max(60)

/** Devuelve el problema de la contraseña, o null si es aceptable. */
export function passwordProblem(password: string, email: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres (una frase de varias palabras es ideal)`
  }
  if (password.length > 128) return 'Máximo 128 caracteres'
  const lower = password.toLowerCase()
  if (
    COMMON_PASSWORDS.has(lower) ||
    lower.includes(email.split('@')[0]!) ||
    new Set(lower).size < 5
  ) {
    return 'Es demasiado fácil de adivinar: usa una frase propia'
  }
  return null
}

/**
 * Crea una cuenta de administrador con la contraseña cifrada; valida correo, nombre y seguridad de la contraseña.
 */
export async function createAdmin(input: { email: string; name: string; password: string }) {
  const email = adminEmailSchema.parse(input.email)
  const name = adminNameSchema.parse(input.name)
  const problem = passwordProblem(input.password, email)
  if (problem) throw new Error(problem)
  if (await prisma.adminUser.findUnique({ where: { email } })) {
    throw new Error(`Ya existe un administrador con el correo ${email}`)
  }
  return prisma.adminUser.create({
    data: { email, name, passwordHash: await hashPassword(input.password) },
    select: { id: true, email: true, name: true },
  })
}

/** Cambia la contraseña y cierra todas las sesiones abiertas de esa cuenta. */
export async function resetAdminPassword(emailInput: string, password: string) {
  const email = adminEmailSchema.parse(emailInput)
  const problem = passwordProblem(password, email)
  if (problem) throw new Error(problem)
  const admin = await prisma.adminUser.findUnique({ where: { email } })
  if (!admin) throw new Error(`No existe un administrador con el correo ${email}`)
  const passwordHash = await hashPassword(password)
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash, isActive: true } }),
    prisma.adminSession.deleteMany({ where: { adminId: admin.id } }),
  ])
}
