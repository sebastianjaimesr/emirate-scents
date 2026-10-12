import { expect, test } from '@playwright/test'

/* Lo que el servidor añade al servir la tienda como en producción. */

test('las páginas llegan comprimidas y con cabeceras de seguridad', async ({ request }) => {
  const res = await request.get('/catalogo', { headers: { 'Accept-Encoding': 'gzip' } })
  expect(res.status()).toBe(200)
  const headers = res.headers()
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['cache-control']).toBe('no-cache')
  expect(headers['content-encoding']).toBe('gzip')
})

test('robots.txt y el mapa del sitio están disponibles', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(await robots.text()).toContain('Sitemap: ')
  const sitemap = await request.get('/sitemap.xml')
  expect(await sitemap.text()).toContain('/producto/p1</loc>')
})

test('la tienda funciona con la política de seguridad de contenido', async ({ page }) => {
  const violations: string[] = []
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) violations.push(message.text())
  })
  await page.goto('/producto/p1')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ámbar Real')
  expect(violations).toEqual([])
})
