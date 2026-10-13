import { expect, test } from '@playwright/test'

/* Fase 4: interacciones de la tienda (vuelo al carrito, favoritos en tarjetas, inclinación). */

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error
  })
})

test('al agregar al carrito, un sello vuela al icono y luego se abre el carrito', async ({
  page,
}) => {
  await page.goto('/producto/p1')
  await page.getByRole('button', { name: 'Agregar al carrito' }).click()
  // El sello dorado está en el aire y el carrito todavía no se abre
  const flight = page.locator('span.fixed.z-\\[60\\]')
  await expect(flight).toHaveCount(1)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  // Al aterrizar, desaparece y se abre el carrito con el producto
  await expect(flight).toHaveCount(0)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog')).toContainText('Ámbar Real')
})

test('con "reducir movimiento" el carrito se abre al instante, sin vuelo', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/producto/p1')
  await page.getByRole('button', { name: 'Agregar al carrito' }).click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 300 })
  await expect(page.locator('span.fixed.z-\\[60\\]')).toHaveCount(0)
  await context.close()
})

test('el corazón de una tarjeta marca el favorito sin abrir el producto', async ({ page }) => {
  await page.goto('/catalogo')
  const card = page.locator('main article').filter({ hasText: 'Oud Rosa' })
  await card.getByRole('button', { name: /favoritos/i }).click()
  await expect(page).toHaveURL(/\/catalogo$/)
  await expect(card.getByRole('button', { name: /quitar.*favoritos/i })).toBeVisible()
})

test.describe('con ratón', () => {
  test.skip(({ isMobile }) => isMobile, 'En celular no hay cursor')

  test('la foto de la tarjeta se inclina con el cursor y vuelve al salir', async ({ page }) => {
    await page.goto('/catalogo')
    const frame = page.locator('main article').first().locator('.aspect-\\[4\\/5\\]')
    const box = (await frame.boundingBox())!
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1, { steps: 5 })
    await expect
      .poll(() => frame.evaluate((element) => getComputedStyle(element).transform))
      .toMatch(/matrix3d/)
    await page.mouse.move(0, 0)
    await expect
      .poll(() =>
        frame.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m13),
      )
      .toBeCloseTo(0, 2)
  })
})
