import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource-variable/manrope'
import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { router } from './app/router'

// Si publicamos una versión nueva mientras alguien tenía la tienda abierta, sus archivos viejos
// ya no existen: recargamos una vez para traer la versión actual en lugar de mostrar un error.
window.addEventListener('vite:preloadError', (event) => {
  // Como mucho una recarga cada 30 segundos, para no entrar en un ciclo si el error es otro
  const key = 'emirate-scents:reloaded-after-deploy'
  try {
    if (Date.now() - Number(sessionStorage.getItem(key) ?? 0) < 30_000) return
    sessionStorage.setItem(key, String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  // Recarga directamente en la página a la que el cliente iba
  const target = router.state.navigation.location
  if (target) window.location.assign(target.pathname + target.search + target.hash)
  else window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
