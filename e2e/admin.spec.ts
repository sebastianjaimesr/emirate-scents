import sharp from 'sharp'
import { expect, test, type Page } from '@playwright/test'

/*
  Panel administrativo (/admin) con un navegador real. El administrador existe solo en la
  base de datos de PRUEBAS (server/tests/e2eSeed.ts).
*/
const EMAIL = 'admin@e2e.test'
const PASSWORD = 'clave de pruebas e2e'

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error
  })
})

async function login(page: Page) {
  await page.goto('/admin')
  await page.getByLabel('Correo').fill(EMAIL)
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible()
}

test('sin sesión pide el acceso; con datos incorrectos lo niega; al salir cierra la sesión', async ({
  page,
}) => {
  await page.goto('/admin/productos')
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  // El panel no se indexa
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)

  await page.getByLabel('Correo').fill(EMAIL)
  await page.getByLabel('Contraseña').fill('no es la contraseña')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos')

  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // Vuelve a la sección que se pidió
  await expect(page.getByRole('heading', { level: 1, name: 'Productos' })).toBeVisible()

  // La cookie de sesión no es legible desde JavaScript
  expect(await page.evaluate(() => document.cookie)).not.toContain('es_admin')

  const menu = page.getByRole('button', { name: 'Abrir menú' })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page.getByText('Cerraste la sesión.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
})

test('si la sesión caduca, el panel lo avisa y pide entrar de nuevo', async ({ page, context }) => {
  await login(page)
  // Simula la caducidad: el navegador pierde la cookie y la API responde 401
  await context.clearCookies()
  const menu = page.getByRole('button', { name: 'Abrir menú' })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('link', { name: 'Inventario' }).click()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  await expect(page.getByText('Tu sesión caducó')).toBeVisible()
  // Al volver a entrar, sigue en la sección donde estaba
  await page.getByLabel('Correo').fill(EMAIL)
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Inventario' })).toBeVisible()
})

test.describe('gestión', () => {
  test.skip(({ isMobile }) => isMobile, 'Los recorridos largos se prueban en escritorio')

  test('crear un producto, subir su foto, publicarlo y despublicarlo', async ({ page }) => {
    const suffix = String(Date.now()).slice(-4)
    const name = `Oud Prueba ${suffix}`
    await login(page)
    await page.getByRole('link', { name: 'Nuevo producto' }).click()

    await page.getByLabel('Nombre').fill(name)
    await expect(page.getByLabel('Dirección en la tienda')).toHaveValue(`oud-prueba-${suffix}`)
    await page.getByLabel('SKU').fill(`AR-${suffix}`)
    await page.getByLabel('Marca').selectOption({ label: 'Marca A' })
    await page.getByLabel('Categoría').selectOption({ label: 'Perfumes árabes' })
    await page.getByLabel('Precio (COP)', { exact: true }).fill('-5')
    await page.getByLabel('Unidades iniciales').fill('3')
    await page.getByRole('button', { name: 'Crear borrador' }).click()
    // El servidor rechaza el precio negativo y lo dice junto al campo
    await expect(page.getByText('No puede ser negativo')).toBeVisible()

    await page.getByLabel('Precio (COP)', { exact: true }).fill('280.000')
    await page.getByRole('button', { name: 'Crear borrador' }).click()
    await expect(page.getByText('Producto creado como borrador')).toBeVisible()
    await expect(page.getByText('Borrador', { exact: true })).toBeVisible()

    // Foto: se sube, se convierte y se muestra
    const photo = await sharp({
      create: { width: 900, height: 1100, channels: 3, background: '#c9a54e' },
    })
      .png()
      .toBuffer()
    await page.locator('#subir-fotos').setInputFiles({
      name: 'frasco.png',
      mimeType: 'image/png',
      buffer: photo,
    })
    await expect(page.getByText('Principal', { exact: true })).toBeVisible()
    await expect(page.locator('ol img').first()).toHaveAttribute('src', /\.webp$/)

    // Publicar exige las descripciones
    await page.getByRole('button', { name: 'Publicar' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Publicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'No se puede publicar' })).toBeVisible()

    await page.getByLabel('Descripción corta').fill('Oud ahumado con rosa')
    await page.getByLabel('Descripción', { exact: true }).fill('Descripción de prueba.')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Cambios guardados.')).toBeVisible()

    await page.getByRole('button', { name: 'Publicar' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Publicar' }).click()
    await expect(page.getByText('Publicado', { exact: true })).toBeVisible()

    // Ya está en la tienda, con su foto
    const store = await page.context().newPage()
    await store.goto(`/producto/oud-prueba-${suffix}`)
    await expect(store.getByRole('heading', { level: 1 })).toHaveText(name)
    await expect(store.locator('main img[src*="/uploads/"]').first()).toBeVisible()

    // Despublicar lo saca de la tienda
    await page.getByRole('button', { name: 'Despublicar' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Despublicar' }).click()
    await expect(page.getByText('Borrador', { exact: true })).toBeVisible()
    await store.reload()
    await expect(store.getByRole('heading', { level: 1 })).not.toHaveText(name)
  })

  test('registrar una entrada de mercancía actualiza las existencias y el historial', async ({
    page,
  }) => {
    await login(page)
    await page.getByRole('link', { name: 'Inventario' }).click()
    const form = page.getByRole('form', { name: 'Registrar movimiento de inventario' })
    await form.getByLabel('Producto').selectOption({ label: 'Cuero · P3 (5 und.)' })
    await form.getByLabel('Unidades').fill('4')
    await form.getByLabel('Motivo').fill('Llegada de proveedor')
    await form.getByRole('button', { name: 'Registrar entrada' }).click()
    await expect(form.getByRole('status')).toHaveText(/ahora hay 9 unidad\(es\) de Cuero/)

    const history = page.getByRole('table')
    await expect(history.getByRole('row').nth(1)).toContainText('Llegada de proveedor')
    await expect(history.getByRole('row').nth(1)).toContainText('+4')

    // Un ajuste no puede dejar existencias negativas
    await form.getByLabel('Producto').selectOption({ label: 'Cuero · P3 (9 und.)' })
    await form.getByLabel('Tipo').selectOption('AJUSTE')
    await form.getByLabel('Unidades').fill('50')
    await form.getByLabel('Motivo').fill('Conteo físico')
    await form.getByRole('button', { name: 'Registrar ajuste' }).click()
    await expect(form.getByRole('alert')).toContainText('No hay suficientes unidades')
  })

  test('un pedido de la tienda: buscarlo, fijar el envío, confirmarlo y cancelarlo', async ({
    page,
  }) => {
    // Un cliente pide 2 unidades de Oud Rosa desde la tienda (misma API que el formulario)
    const created = await page.request.post('/api/orders', {
      data: {
        customer: {
          name: 'Cliente Prueba E2E',
          phone: '3001234567',
          department: 'Antioquia',
          city: 'Medellín',
          address: 'Calle 1 # 2-3',
          notes: '',
        },
        paymentMethod: 'CONTRA_ENTREGA',
        items: [{ productId: 'p2', quantity: 2 }],
        dataConsent: true,
      },
    })
    expect(created.status()).toBe(201)
    const { orderNumber } = (await created.json()) as { orderNumber: string }

    await login(page)
    await page.getByRole('link', { name: 'Pedidos', exact: true }).click()
    await page.getByLabel('Buscar por número, cliente, celular o ciudad').fill(orderNumber)
    await page.getByRole('button', { name: 'Buscar' }).click()
    await expect(page.getByRole('link', { name: orderNumber })).toBeVisible()
    // Las pestañas de estados se desplazan dentro del panel: la página no se sale de la pantalla
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    )
    await page.getByRole('link', { name: orderNumber }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Pedido ${orderNumber}`)
    await expect(page.getByText('Pendiente de confirmar').first()).toBeVisible()
    await expect(page.getByTestId('order-total')).toHaveText(/600\.000/)

    // Envío: el total se recalcula en el servidor
    await page.getByLabel('Valor en pesos').fill('12.000')
    await page.getByRole('button', { name: 'Guardar envío' }).click()
    await expect(page.getByText('Costo de envío guardado.')).toBeVisible()
    await expect(page.getByTestId('order-total')).toHaveText(/612\.000/)

    // Confirmar descuenta las existencias y lo deja en el historial
    await page.getByRole('button', { name: 'Confirmar pedido' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Se descuentan del inventario 2 unidad(es)')
    await dialog.getByLabel('Nota (opcional)').fill('Confirmado por WhatsApp')
    await dialog.getByRole('button', { name: 'Confirmar pedido' }).click()
    await expect(page.getByText('Pedido confirmado.')).toBeVisible()
    const movements = page.getByRole('table').last()
    await expect(movements.getByRole('row').nth(1)).toContainText('Venta')
    await expect(movements.getByRole('row').nth(1)).toContainText('−2')
    await expect(page.getByText('Confirmado por WhatsApp')).toBeVisible()

    // Cancelar exige motivo y devuelve las unidades
    await page.getByRole('button', { name: 'Cancelar pedido' }).click()
    await expect(dialog).toContainText('Las 2 unidad(es) vuelven al inventario')
    await dialog.getByRole('button', { name: 'Cancelar pedido' }).click()
    await expect(dialog.getByText('Escribe el motivo de la cancelación')).toBeVisible()
    await dialog.getByLabel('Motivo de la cancelación').fill('El cliente desistió')
    await dialog.getByRole('button', { name: 'Cancelar pedido' }).click()
    await expect(page.getByText('Pedido cancelado.')).toBeVisible()
    await expect(movements.getByRole('row').nth(2)).toContainText('Devolución')
    await expect(movements.getByRole('row').nth(2)).toContainText('+2')
    // Cancelado es final: ya no hay botones de estado ni se puede cambiar el envío
    await expect(page.getByText('ya no cambia de estado')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Guardar envío' })).toHaveCount(0)
  })
})
