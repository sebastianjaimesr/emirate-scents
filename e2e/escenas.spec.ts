import { expect, test, type Page } from '@playwright/test'

/*
  Secciones 3D del inicio: el humo que forma el nombre, la galería con pedestales y la
  pirámide olfativa. Cada una queda fijada mientras se recorre y el texto acompaña al
  perfume que está al frente. Sin 3D, muestran la misma información sin animación.
*/

const scenes = ['humo', 'galeria', 'piramide'] as const
type Scene = (typeof scenes)[number]

/** Lleva la página a una fracción (0 a 1) del recorrido de una sección. */
async function scrollSceneTo(page: Page, scene: Scene, fraction: number) {
  // Las secciones aparecen cuando llegan los perfumes
  await page.locator(`[data-scene="${scene}"]`).waitFor({ state: 'attached' })
  await page.evaluate(
    ([name, value]) => {
      const section = document.querySelector<HTMLElement>(`[data-scene="${name}"]`)!
      const top = section.getBoundingClientRect().top + window.scrollY
      const scrollable = section.offsetHeight - window.innerHeight
      window.scrollTo({ top: top + Number(value) * scrollable, behavior: 'instant' })
    },
    [scene, fraction] as const,
  )
}

/** Nombre del perfume que el texto de la sección muestra como "al frente". */
function frontName(page: Page, scene: Scene) {
  return page.locator(`[data-scene="${scene}"] h3`).first()
}

test('cada sección fija la escena 3D y el texto cambia de perfume al bajar y al subir', async ({
  page,
}) => {
  // Recorre tres escenas 3D; sin tarjeta gráfica (en CI) cada una tarda varios segundos
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')

  for (const scene of scenes) {
    const section = page.locator(`[data-scene="${scene}"]`)
    await expect(section).toHaveCount(1)
    await scrollSceneTo(page, scene, 0)
    await expect(section.locator('[data-scene-ready="si"] canvas')).toHaveCount(1, {
      timeout: 15_000,
    })
    // La escena es decorativa: los lectores de pantalla la ignoran
    await expect(section.locator('[aria-hidden="true"]:has(canvas)')).toHaveCount(1)
    const first = (await frontName(page, scene).textContent())!

    // Al bajar hasta el final, el texto pasa al último perfume; el título sigue a la vista
    await scrollSceneTo(page, scene, 1)
    await expect(frontName(page, scene)).not.toHaveText(first)
    await expect(section.locator('h2')).toBeInViewport()

    // Al volver arriba, regresa al primero
    await scrollSceneTo(page, scene, 0)
    await expect(frontName(page, scene)).toHaveText(first)
  }

  // Pasadas las secciones, la página continúa con normalidad: justo después de la pirámide
  // está la sección de familias olfativas
  await page.evaluate(() => {
    const section = document.querySelector<HTMLElement>('[data-scene="piramide"]')!
    const end = section.getBoundingClientRect().bottom + window.scrollY
    window.scrollTo({ top: end, behavior: 'instant' })
  })
  await expect(page.locator('#familias-title')).toBeInViewport()
  expect(errors).toEqual([])
})

test('nunca hay más de tres lienzos 3D a la vez', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  for (const scene of scenes) {
    for (const fraction of [0, 0.5, 1]) {
      await scrollSceneTo(page, scene, fraction)
      await page.waitForTimeout(300)
      expect(await page.locator('canvas').count()).toBeLessThanOrEqual(3)
    }
  }
})

test('"Ver perfume" en la galería abre la ficha del perfume al frente', async ({ page }) => {
  await page.goto('/')
  await scrollSceneTo(page, 'galeria', 0)
  const name = (await frontName(page, 'galeria').textContent())!
  await page
    .locator('[data-scene="galeria"]')
    .getByRole('link', { name: /Ver perfume/ })
    .click()
  await expect(page).toHaveURL(/\/producto\//)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name)
})

test('la pirámide muestra en texto las notas del perfume al frente', async ({ page }) => {
  await page.goto('/')
  await scrollSceneTo(page, 'piramide', 0)
  // En los datos de prueba, el primer perfume con notas es "Oud Rosa": corazón de rosa
  const notes = page.locator('[data-scene="piramide"] dl')
  await expect(notes.getByText('Corazón')).toBeVisible()
  await expect(notes.getByText('Rosa', { exact: true })).toBeVisible()
  // Los pisos sin notas no aparecen
  await expect(notes.getByText('Salida')).toHaveCount(0)
})

test.describe('pantallas grandes', () => {
  test.skip(({ isMobile }) => isMobile, 'El índice del humo solo se ve en pantallas grandes')

  test('el índice del humo lleva al perfume elegido', async ({ page }) => {
    await page.goto('/')
    await scrollSceneTo(page, 'humo', 0)
    const index = page.getByRole('navigation', { name: 'Perfumes de la colección' })
    const third = index.getByRole('button').nth(2)
    const name = (await third.textContent())!.replace(/^\d+/, '').trim()
    await third.click()
    await expect(third).toHaveAttribute('aria-current', 'true')
    await expect(frontName(page, 'humo')).toHaveText(name)
  })
})

test('con "reducir movimiento" las tres secciones son estáticas y no descargan 3D', async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  const sceneRequests: string[] = []
  page.on('request', (request) => {
    if (/(Smoke|Gallery|Pyramid)Scene/.test(request.url())) sceneRequests.push(request.url())
  })
  await page.goto('/')
  for (const scene of scenes) {
    const section = page.locator(`[data-scene="${scene}-estatica"]`)
    await section.scrollIntoViewIfNeeded()
    await expect(section.locator('h3').first()).toBeVisible()
  }
  await page.waitForTimeout(1000)
  expect(sceneRequests).toEqual([])
  await expect(page.locator('canvas')).toHaveCount(0)

  // Cada perfume abre su ficha
  const link = page.locator('[data-scene="galeria-estatica"] h3 a').first()
  const name = (await link.textContent())!
  await link.click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name)
  await context.close()
})

test('sin WebGL las secciones muestran su versión estática', async ({ page }) => {
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
  for (const scene of scenes) {
    await expect(page.locator(`[data-scene="${scene}-estatica"]`)).toHaveCount(1)
  }
})
