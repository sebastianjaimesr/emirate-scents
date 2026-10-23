import { expect, test, type Page } from '@playwright/test'

/*
  Secciones 3D del inicio: la galería con pedestales y la pirámide olfativa. Cada una queda fijada mientras se recorre y el texto acompaña al
  perfume que está al frente. Sin 3D, muestran la misma información sin animación.
*/

const scenes = ['galeria', 'piramide'] as const
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
  // Recorre dos escenas 3D; sin tarjeta gráfica (en CI) cada una tarda varios segundos
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
  const link = page.locator('[data-scene="galeria"]').getByRole('link', { name: /Ver perfume/ })
  await expect(link).toBeInViewport({ ratio: 1 })
  // Clic con el ratón donde se ve el enlace: locator.click() primero "desplaza hasta el
  // elemento" y, en una sección fijada (sticky), Chrome baja la página y cambia de perfume
  const box = (await link.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
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

test('con "reducir movimiento" las dos secciones son estáticas y no descargan 3D', async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  const sceneRequests: string[] = []
  page.on('request', (request) => {
    if (/(Gallery|Pyramid)Scene/.test(request.url())) sceneRequests.push(request.url())
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

test('si el dispositivo no da abasto, apaga las escenas y deja el texto en su sitio', async ({
  page,
  context,
}) => {
  test.setTimeout(90_000)
  // En pruebas la vigilancia está apagada (navigator.webdriver): aquí se activa, y se
  // simula un procesador 20 veces más lento para que la escena vaya lenta
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 })
  await page.goto('/')
  await scrollSceneTo(page, 'galeria', 0)
  const section = page.locator('[data-scene="galeria"]')
  await expect(section.locator('canvas')).toHaveCount(1, { timeout: 30_000 })
  // La escena se apaga sola; el texto y la forma de la sección se mantienen
  await expect(section.locator('canvas')).toHaveCount(0, { timeout: 45_000 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await expect(section.locator('h2')).toBeVisible()
  await expect(section.getByRole('link', { name: /Ver perfume/ })).toBeVisible()

  // Se recuerda durante la visita: al volver al inicio, las secciones ya son estáticas
  await page.reload()
  await expect(page.locator('[data-scene="galeria-estatica"]')).toHaveCount(1)
  await expect(page.locator('[data-hero-visual]')).toHaveAttribute('data-hero-visual', 'reserva')
})
