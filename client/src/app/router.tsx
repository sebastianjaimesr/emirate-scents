import { createBrowserRouter } from 'react-router'
import { CartPage } from '../pages/CartPage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RootLayout } from './RootLayout'

/**
 * Mapa de URLs de la tienda. Todas las rutas comparten RootLayout (header y footer).
 * El catálogo, el detalle de producto y el pedido se cargan bajo demanda (`lazy`): su código
 * solo se descarga cuando el visitante entra en ellos, y la página de inicio carga más rápido.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      {
        path: 'catalogo/:categorySlug?',
        lazy: async () => ({ Component: (await import('../pages/CatalogPage')).CatalogPage }),
      },
      {
        path: 'producto/:slug',
        lazy: async () => ({ Component: (await import('../pages/ProductPage')).ProductPage }),
      },
      { path: 'favoritos', Component: FavoritesPage },
      { path: 'carrito', Component: CartPage },
      {
        path: 'pedido',
        lazy: async () => ({ Component: (await import('../pages/CheckoutPage')).CheckoutPage }),
      },
      {
        path: 'pedido/confirmacion',
        lazy: async () => ({
          Component: (await import('../pages/OrderConfirmationPage')).OrderConfirmationPage,
        }),
      },
      {
        path: 'politica-de-datos',
        lazy: async () => ({
          Component: (await import('../pages/PrivacyPolicyPage')).PrivacyPolicyPage,
        }),
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
