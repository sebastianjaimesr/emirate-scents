import { expect, test } from '@playwright/test'

/*
  Portada: un perfume original del catálogo como protagonista (Khamrah), sin 3D.
  Las fotos cargan con prioridad, en AVIF/WebP, y los botones llevan a la tienda.
*/

const visual = '[data-hero-visual]'

test('la portada muestra el perfume protagonista y sus botones funcionan', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')

  await expect(
    page.getByRole('heading', { level: 1, name: 'El arte de dejar huella' }),
  ).toBeVisible()
  await expect(page.locator(visual)).toHaveAttribute('data-hero-visual', 'fotos')
  // Un frasco y su reflejo; las fotos llegan completas (no rotas)
  const photos = page.locator(`${visual} img`)
  await expect(photos).toHaveCount(2)
  await expect
    .poll(() =>
      photos.evaluateAll((imgs) => imgs.every((img) => (img as HTMLImageElement).naturalWidth > 0)),
    )
    .toBe(true)
  // El protagonista se pide con prioridad alta y no espera al scroll
  await expect(page.locator(`${visual} img[fetchpriority="high"]`)).toHaveCount(1)
  // Sin 3D en la portada
  await expect(page.locator(`${visual} canvas`)).toHaveCount(0)

  await page.getByRole('link', { name: 'Ver Khamrah de Lattafa' }).click()
  await expect(page).toHaveURL(/\/producto\/khamrah-lattafa$/)

  await page.goto('/')
  await page.getByRole('link', { name: 'Descubrir perfumes' }).click()
  await expect(page).toHaveURL(/#coleccion$/)

  await page.goto('/')
  await page.getByRole('link', { name: 'Explorar colección' }).click()
  await expect(page).toHaveURL(/\/catalogo$/)
  expect(errors).toEqual([])
})

test('con "reducir movimiento" la portada se ve completa y quieta', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator(`${visual} img`).first()).toBeVisible()
  await context.close()
})
