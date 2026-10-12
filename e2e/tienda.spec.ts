import { expect, test } from '@playwright/test'

/*
  Recorridos básicos de la tienda con los productos de prueba de server/tests/fixtures.ts
  (p1 "Ámbar Real", p2 "Oud Rosa", p3 "Cuero", p4 "Ámbar Nocturno", p5 en borrador).
*/

test.beforeEach(async ({ page }) => {
  // Cualquier error de JavaScript en la página hace fallar la prueba
  page.on('pageerror', (error) => {
    throw error
  })
})

test('el inicio carga con la marca y el contacto', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Emirate Scents/)
  await expect(page.getByRole('link', { name: 'Emirate Scents, ir al inicio' })).toBeVisible()
  const whatsapp = page.locator('a[href^="https://wa.me/573174096898"]').first()
  await expect(whatsapp).toHaveAttribute('rel', /noopener/)
})

test('el catálogo muestra solo productos publicados', async ({ page }) => {
  await page.goto('/catalogo')
  const cards = page.locator('main article')
  await expect(cards).toHaveCount(5) // 4 publicados + 1 DEMO
  await expect(page.getByText('Borrador Secreto')).toHaveCount(0)
})

test('la búsqueda ignora tildes y mayúsculas', async ({ page }) => {
  await page.goto('/catalogo?q=AMBAR')
  const cards = page.locator('main article')
  await expect(cards).toHaveCount(2)
  await expect(cards.filter({ hasText: 'Ámbar Real' })).toHaveCount(1)
  await expect(cards.filter({ hasText: 'Ámbar Nocturno' })).toHaveCount(1)
})

test('una dirección de producto inexistente muestra un aviso claro', async ({ page }) => {
  await page.goto('/producto/no-existe')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/no existe|no encontramos/i)
})

test('los favoritos se guardan al recargar', async ({ page }) => {
  await page.goto('/producto/p2')
  await page
    .getByRole('button', { name: /favoritos/i })
    .first()
    .click()
  await page.reload()
  await page.goto('/favoritos')
  await expect(page.locator('main article').filter({ hasText: 'Oud Rosa' })).toHaveCount(1)
})
