import { categories } from '../../data/categories'

/** Enlaces principales compartidos por el header, el menú móvil y el footer. */
export const mainNavigation = [
  { label: 'Catálogo', to: '/catalogo' },
  ...categories.map((category) => ({
    label: category.shortName,
    to: `/catalogo/${category.slug}`,
  })),
]
