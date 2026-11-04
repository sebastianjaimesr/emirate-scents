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

test('el filtro de género y los accesos especiales solo aparecen con datos reales', async ({
  page,
}) => {
  // En los datos de prueba solo p1 es masculino, p2 unisex y p4 tiene un precio anterior mayor
  await page.goto('/catalogo')
  // En el celular los filtros están en un panel que se abre con el botón "Filtros"
  const isNarrow = (page.viewportSize()?.width ?? 1280) < 1024
  if (isNarrow) await page.getByRole('button', { name: 'Filtros' }).click()
  const filters = isNarrow
    ? page.getByRole('dialog')
    : page.getByRole('complementary', { name: 'Filtros' })
  await expect(filters.getByRole('group', { name: 'Género' })).toBeVisible()
  await expect(filters.getByText('Mujeres')).toHaveCount(0)
  await filters.getByText('Hombres').click()
  await expect(page).toHaveURL(/genero=masculino/)
  if (isNarrow) await page.keyboard.press('Escape')
  await expect(page.locator('main article')).toHaveCount(1)
  await expect(page.locator('main article').first()).toContainText('Ámbar Real')

  // El pie de página lleva a "Ofertas", pero no a "Más vendidos" (no hay datos de ventas)
  const footer = page.getByRole('contentinfo')
  await expect(footer.getByRole('link', { name: 'Ofertas' })).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Más vendidos' })).toHaveCount(0)
  await footer.getByRole('link', { name: 'Ofertas' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ofertas')
  await expect(page.locator('main article')).toHaveCount(1)
})

test('al buscar, el orden por defecto es por relevancia', async ({ page }) => {
  await page.goto('/catalogo?q=ambar%20real')
  await expect(page.locator('#catalog-sort')).toHaveValue('relevancia')
  await expect(page.locator('main article').first()).toContainText('Ámbar Real')
})

for (const [path, title] of [
  ['/envios', 'Envíos'],
  ['/cambios-y-devoluciones', 'Cambios y devoluciones'],
  ['/autenticidad', 'Autenticidad y equivalencias'],
  ['/contacto', 'Contacto'],
]) {
  test(`la página "${title}" carga con su contacto`, async ({ page }) => {
    await page.goto(path!)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title!)
    await expect(page.locator('main a[href^="https://wa.me/573174096898"]')).toHaveCount(1)
  })
}
