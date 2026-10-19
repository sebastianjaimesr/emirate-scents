/**
 * Prueba de extremo a extremo (Playwright) del flujo de compra: carrito, formulario y confirmación.
 */
import { expect, test, type Page } from '@playwright/test'

/** Abre la ficha de un producto y lo agrega al carrito. */
async function addToCart(page: Page, slug: string) {
  await page.goto(`/producto/${slug}`)
  await page.getByRole('button', { name: 'Agregar al carrito' }).click()
  // Se abre el panel del carrito
  await expect(page.getByRole('dialog')).toBeVisible()
}

test('un cliente registra un pedido y lo envía por WhatsApp', async ({ page }) => {
  await addToCart(page, 'p1')
  await page.getByRole('dialog').getByRole('link', { name: 'Continuar con el pedido' }).click()
  await expect(page).toHaveURL(/\/pedido$/)

  // Sin datos: el formulario explica qué falta y no envía nada
  await page.getByRole('button', { name: 'Registrar pedido' }).click()
  await expect(page.locator('#name')).toBeFocused()
  await expect(page.locator('#name-error')).toHaveText('Escribe tu nombre completo')

  await page.fill('#name', 'Cliente de Prueba')
  await page.fill('#phone', '+57 300 123 4567')
  await page.selectOption('#department', 'Antioquia')
  await page.fill('#city', 'Medellín')
  await page.fill('#address', 'Calle 10 # 20-30')
  await page.getByText('Pago contra entrega', { exact: true }).click()
  await page.locator('label:has(input[type=checkbox])').click()
  await page.getByRole('button', { name: 'Registrar pedido' }).click()

  await expect(page).toHaveURL(/\/pedido\/confirmacion$/)
  const orderNumber = page.getByText(/ES-\d{4}-\d{6}/).first()
  await expect(orderNumber).toBeVisible()
  const number = (await orderNumber.textContent())?.match(/ES-\d{4}-\d{6}/)?.[0]

  const whatsapp = page.getByRole('link', { name: 'Enviar pedido por WhatsApp' })
  const href = (await whatsapp.getAttribute('href')) ?? ''
  expect(href).toMatch(/^https:\/\/wa\.me\/573174096898\?text=/)
  const message = new URL(href).searchParams.get('text') ?? ''
  expect(message).toContain(number)
  expect(message).toContain('Ámbar Real')
  expect(message).toContain('Calle 10 # 20-30')

  // El carrito queda vacío y la confirmación sigue ahí al recargar
  await expect(page.getByRole('button', { name: /^Abrir carrito/ })).toHaveAttribute(
    'aria-label',
    /vacío|\(0\)|^Abrir carrito$/,
  )
  await page.reload()
  await expect(page.getByText(number ?? 'sin número')).toBeVisible()
})

test('un producto DEMO no se puede pedir', async ({ page }) => {
  await addToCart(page, 'demo-e2e')
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Continuar con el pedido' }),
  ).toBeDisabled()
  await page.goto('/pedido')
  await expect(page.getByRole('button', { name: 'Registrar pedido' })).toBeDisabled()
})
