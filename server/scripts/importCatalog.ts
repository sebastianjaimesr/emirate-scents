/**
 * Importa el catálogo real desde la plantilla CSV (docs/plantilla-catalogo.csv).
 *
 *   npm run catalogo:importar -- catalogo.csv                  → solo revisa, no guarda nada
 *   npm run catalogo:importar -- catalogo.csv --aplicar        → guarda los productos
 *   npm run catalogo:importar -- catalogo.csv --aplicar --retirar-demo
 *                                                              → además oculta los DEMO
 *
 * Usa la base de datos de DATABASE_URL (server/.env). Para el catálogo de producción,
 * ejecútalo con la DATABASE_URL de producción (ver docs/fase-8-produccion.md).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyCatalog, validateCatalog } from '../src/catalogImport/importCatalog.js'
import { prisma } from '../src/lib/prisma.js'

/** Argumentos de la línea de comandos. */
const args = process.argv.slice(2)
/** Ruta del archivo a importar (el primer argumento que no empieza con --). */
const file = args.find((arg) => !arg.startsWith('--'))
/** --aplicar guarda los cambios; sin él solo se muestra qué pasaría (simulación). */
const apply = args.includes('--aplicar')
/** --retirar-demo archiva los productos DEMO al importar el catálogo real. */
const retireDemo = args.includes('--retirar-demo')

if (!file) {
  console.error('Indica el archivo: npm run catalogo:importar -- ruta/al/catalogo.csv')
  process.exit(1)
}

// npm ejecuta el script dentro de server/: la ruta se resuelve desde donde lo escribiste
const csvPath = path.resolve(process.env.INIT_CWD ?? process.cwd(), file)
/** Carpeta donde están las fotos de los productos. */
const photosDir = fileURLToPath(new URL('../../client/public/images/products', import.meta.url))

const { rows, problems } = validateCatalog(readFileSync(csvPath, 'utf8'), photosDir)

if (problems.length > 0) {
  console.error(
    `\n${problems.length} problema(s) en ${path.basename(csvPath)}. No se guardó nada.\n`,
  )
  for (const problem of problems) {
    const where = [`fila ${problem.line}`, problem.sku, problem.column].filter(Boolean).join(' · ')
    console.error(`  - ${where}: ${problem.message}`)
  }
  process.exit(1)
}

console.log(`\n${rows.length} producto(s) revisados sin problemas.`)
if (!apply) {
  console.log('Fue solo una revisión. Para guardarlos, repite el comando con --aplicar.\n')
  process.exit(0)
}

const result = await applyCatalog(prisma, rows, { retireDemo })
await prisma.$disconnect()
console.log(
  `Listo: ${result.created} nuevo(s), ${result.updated} actualizado(s)` +
    (retireDemo ? `, ${result.archivedDemo} DEMO retirado(s) de la tienda.` : '.'),
)
if (rows.some((row) => row.fotos.length > 0)) {
  console.log('Recuerda subir las fotos a GitHub (client/public/images/products) y publicar.\n')
}
