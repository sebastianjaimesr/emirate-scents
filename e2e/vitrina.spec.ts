import { expect, test, type Page } from '@playwright/test'

/* Vitrina "The Fragrance Collection": la fila de perfumes que avanza con el scroll. */

const showcase = '[data-showcase]'

/** Desplazamiento horizontal actual de la fila, en píxeles (0 = posición inicial). */
function trackX(page: Page) {
  return page.evaluate(() => {
    const track = document.querySelector('[data-showcase-track]')!
    return new DOMMatrix(getComputedStyle(track).transform).m41
  })
}

/** Lleva la página a una fracción (0 a 1) del recorrido de la vitrina. */
async function scrollShowcaseTo(page: Page, fraction: number) {
  await page.evaluate((value) => {
    const section = document.querySelector<HTMLElement>('[data-showcase]')!
    const top = section.getBoundingClientRect().top + window.scrollY
    const scrollable = section.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + value * scrollable, behavior: 'instant' })
  }, fraction)
}

test.describe('pantallas grandes', () => {
  test.skip(({ isMobile }) => isMobile, 'En celular la vitrina es un carrusel')

  test('el scroll vertical mueve la fila en ambos sentidos y luego la página sigue', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator(showcase)).toHaveAttribute('data-showcase', 'fijada')
    const items = await page.locator(`${showcase} article`).count()
    expect(items).toBeGreaterThan(1)

    // Al bajar hasta el final, la fila se desplaza a la izquierda
    await scrollShowcaseTo(page, 1)
    await expect.poll(() => trackX(page)).toBeLessThan(-100)
    const atEnd = await trackX(page)
    await expect(page.locator('#vitrina-title')).toBeInViewport()

    // A mitad de camino, la fila queda entre el inicio y el final
    await scrollShowcaseTo(page, 0.5)
    await expect.poll(() => trackX(page)).toBeGreaterThan(atEnd + 50)

    // Al subir hasta el principio, vuelve a su posición inicial
    await scrollShowcaseTo(page, 0)
    await expect.poll(() => trackX(page)).toBeGreaterThan(-2)

    // Pasada la vitrina, la página continúa con normalidad
    await scrollShowcaseTo(page, 1.3)
    await expect(
      page.getByRole('heading', { name: 'Cuatro maneras de descubrir tu aroma' }),
    ).toBeInViewport()
  })

  test('cada perfume de la vitrina abre su ficha', async ({ page }) => {
    await page.goto('/')
    const link = page.locator(`${showcase} h3 a`).first()
    const name = (await link.textContent())!
    await scrollShowcaseTo(page, 0)
    await link.click()
    await expect(page).toHaveURL(/\/producto\//)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name)
  })

  test('con "reducir movimiento" la vitrina es un carrusel sin fijar la página', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.locator(showcase)).toHaveAttribute('data-showcase', 'carrusel')
    await context.close()
  })
})

test.describe('celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'Solo en celular')

  test('la vitrina es un carrusel que se desliza en horizontal', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(showcase)).toHaveAttribute('data-showcase', 'carrusel')
    const list = page.locator(`${showcase} ul`)
    await list.scrollIntoViewIfNeeded()
    const { scrollWidth, clientWidth } = await list.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }))
    expect(scrollWidth).toBeGreaterThan(clientWidth)

    await list.evaluate((element) => element.scrollBy({ left: 400, behavior: 'instant' }))
    await expect.poll(() => list.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)

    const link = page.locator(`${showcase} h3 a`).first()
    await list.evaluate((element) => element.scrollTo({ left: 0, behavior: 'instant' }))
    await link.click()
    await expect(page).toHaveURL(/\/producto\//)
  })
})
