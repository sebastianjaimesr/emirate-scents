import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const pages = [
  { name: 'inicio', path: '/' },
  { name: 'catálogo', path: '/catalogo' },
  { name: 'producto', path: '/producto/p2' },
  { name: 'carrito vacío', path: '/carrito' },
  { name: 'favoritos vacío', path: '/favoritos' },
  { name: 'catálogo sin resultados', path: '/catalogo?q=zzzz' },
  { name: 'pedido con carrito vacío', path: '/pedido' },
  { name: 'confirmación sin pedido', path: '/pedido/confirmacion' },
  { name: 'política de datos', path: '/politica-de-datos' },
  { name: 'página no encontrada', path: '/no-existe' },
  { name: 'producto no encontrado', path: '/producto/no-existe' },
]

for (const { name, path } of pages) {
  test(`${name}: sin problemas de accesibilidad ni desbordes`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    // Espera a que terminen las animaciones de entrada
    await page.waitForTimeout(1200)

    // Cada página tiene un único título principal (h1): lo usan los lectores de pantalla y Google
    await expect(page.locator('h1')).toHaveCount(1)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    // Se aceptan solo avisos "menores"; moderados, graves y críticos hacen fallar la prueba
    const problems = results.violations.filter((violation) => violation.impact !== 'minor')
    expect(
      problems.map(
        (violation) => `${violation.id}: ${violation.nodes.map((n) => n.target).join(', ')}`,
      ),
    ).toEqual([])

    // Nada se sale de la pantalla a los lados (importante en celular)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('con "reducir movimiento" el contenido aparece sin animaciones', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await context.close()
})

test('se puede llegar al contenido con el teclado', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Saltar al contenido' })
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#contenido')).toBeFocused()
})
