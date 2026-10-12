import { createBrowserRouter } from 'react-router'
import { CartPage } from '../pages/CartPage'
import { CatalogPage } from '../pages/CatalogPage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RootLayout } from './RootLayout'

/** Mapa de URLs de la tienda. Todas las rutas comparten RootLayout (header y footer). */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'catalogo', Component: CatalogPage },
      { path: 'catalogo/:categorySlug', Component: CatalogPage },
      { path: 'favoritos', Component: FavoritesPage },
      { path: 'carrito', Component: CartPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
