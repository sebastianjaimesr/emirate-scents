import { expect, test } from '@playwright/test'

/* Hero 3D: la escena aparece cuando se puede y la página funciona igual cuando no. */

const visual = '[data-hero-visual]'

test('con WebGL, el frasco 3D reemplaza al logo dentro del arco', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator(visual)).toHaveAttribute('data-hero-visual', '3d', { timeout: 15_000 })
  await expect(page.locator(`${visual} canvas`)).toHaveCount(1)
  // La escena es decorativa: los lectores de pantalla la ignoran
  await expect(page.locator(`${visual} [aria-hidden="true"]:has(canvas)`)).toHaveCount(1)
  expect(errors).toEqual([])
})

test('sin WebGL, el hero muestra la composición de reserva y sus botones funcionan', async ({
  page,
}) => {
  // Simula un navegador sin WebGL
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (args[0].startsWith('webgl')) return null
      return original.apply(this, args)
    } as typeof original
  })
  await page.goto('/')
  await page.waitForTimeout(2000)
  await expect(page.locator(visual)).toHaveAttribute('data-hero-visual', 'reserva')
  await expect(page.locator(`${visual} canvas`)).toHaveCount(0)
  await expect(page.locator(`${visual} img`)).toBeVisible()

  await page.getByRole('link', { name: 'Descubrir perfumes' }).click()
  await expect(
    page.getByRole('heading', { name: 'Cuatro maneras de descubrir tu aroma' }),
  ).toBeInViewport()

  await page.getByRole('link', { name: 'Explorar la colección' }).click()
  await expect(page).toHaveURL(/\/catalogo$/)
})

test('con "reducir movimiento" no se descarga la escena 3D', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  const sceneRequests: string[] = []
  page.on('request', (request) => {
    if (/HeroScene/.test(request.url())) sceneRequests.push(request.url())
  })
  await page.goto('/')
  await page.waitForTimeout(2000)
  await expect(page.locator(visual)).toHaveAttribute('data-hero-visual', 'reserva')
  expect(sceneRequests).toEqual([])
  await context.close()
})
