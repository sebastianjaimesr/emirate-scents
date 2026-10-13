/**
 * Datos para las pruebas de punta a punta (e2e/ en la raíz del proyecto).
 * Se ejecuta contra la base de datos de PRUEBAS: el comando lo lanza e2e/globalSetup.ts
 * con DATABASE_URL apuntando a TEST_DATABASE_URL.
 */
import { prisma } from '../src/lib/prisma.js'
import { hashPassword } from '../src/lib/password.js'
import { buildSearchText } from '../src/lib/text.js'
import { resetCatalog } from './fixtures.js'

await resetCatalog()

// Un producto DEMO, para comprobar que la tienda no deja pedirlo
await prisma.product.create({
  data: {
    id: 'demo-e2e',
    sku: 'DEMO-E2E',
    slug: 'demo-e2e',
    name: 'Muestra DEMO',
    brandId: 'marca-a',
    categoryId: 'c-arabes',
    shortDescription: '',
    description: '',
    price: 150000,
    sizeMl: 100,
    isDemo: true,
    status: 'PUBLICADO',
    stock: 5,
    searchText: buildSearchText({ name: 'Muestra DEMO', brandName: 'Marca A' }),
    publishedAt: new Date('2026-06-01'),
  },
})

// Administrador SOLO de la base de datos de pruebas (mismos datos que e2e/admin.spec.ts)
await prisma.adminUser.create({
  data: {
    email: 'admin@e2e.test',
    name: 'Admin E2E',
    passwordHash: await hashPassword('clave de pruebas e2e'),
  },
})

await prisma.$disconnect()
