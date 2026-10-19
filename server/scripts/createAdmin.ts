/**
 * Crea un administrador del panel, o cambia su contraseña. Pide los datos en la terminal:
 * la contraseña no se muestra mientras la escribes y nunca queda guardada en ningún archivo.
 *
 *   npm run admin:crear                          → crea un administrador
 *   npm run admin:crear -- --cambiar-contrasena  → cambia la contraseña (cierra sus sesiones)
 *
 * Usa la base de datos de DATABASE_URL (server/.env). En producción, ejecútalo con la
 * DATABASE_URL de producción (ver la guía de publicación).
 */
import { createInterface } from 'node:readline'
import { createAdmin, resetAdminPassword } from '../src/admin/adminAccounts.js'
import { prisma } from '../src/lib/prisma.js'

/** true si se ejecutó con --cambiar-contrasena (cambia la contraseña de un administrador existente). */
const resetMode = process.argv.includes('--cambiar-contrasena')

if (!process.stdin.isTTY) {
  console.error('Ejecuta este comando en una terminal interactiva: pide la contraseña en pantalla.')
  process.exit(1)
}

/** Hace una pregunta en la terminal; con hidden=true no muestra lo que se escribe (para contraseñas). */
function ask(question: string, hidden = false) {
  return new Promise<string>((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    if (hidden) {
      // No repite en pantalla lo que se escribe
      const internal = rl as unknown as { _writeToOutput: (text: string) => void }
      internal._writeToOutput = (text: string) => {
        if (text.startsWith(question)) process.stdout.write(question)
      }
    }
    rl.question(question, (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      resolve(answer)
    })
  })
}

/** Pide la contraseña dos veces y verifica que coincidan y que sea segura. */
async function askPassword() {
  const password = await ask('Contraseña (mínimo 12 caracteres): ', true)
  const repeated = await ask('Repite la contraseña: ', true)
  if (password !== repeated) throw new Error('Las contraseñas no coinciden')
  return password
}

try {
  if (resetMode) {
    const email = await ask('Correo del administrador: ')
    await resetAdminPassword(email, await askPassword())
    console.log('Contraseña cambiada. Se cerraron las sesiones abiertas de esa cuenta.')
  } else {
    const name = await ask('Nombre: ')
    const email = await ask('Correo: ')
    const admin = await createAdmin({ name, email, password: await askPassword() })
    console.log(`Administrador creado: ${admin.name} <${admin.email}>. Ya puedes entrar en /admin.`)
  }
} catch (error) {
  const message =
    error instanceof Error && 'issues' in error
      ? (error as { issues: { message: string }[] }).issues.map((issue) => issue.message).join('; ')
      : error instanceof Error
        ? error.message
        : String(error)
  console.error(`No se pudo completar: ${message}`)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
