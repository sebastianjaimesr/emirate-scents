/**
 * Las cuatro categorías principales de la tienda y sus textos de presentación.
 * Los productos de cada categoría vienen de la API; los textos y colores de esta lista
 * son contenido editorial de la tienda. El slug debe coincidir con la tabla Category
 * de la base de datos (server/prisma/data/categories.ts).
 */
export interface Category {
  slug: string
  name: string
  shortName: string
  description: string
  /** Tono de fondo del arco en la página de inicio (clase de Tailwind). */
  tone: string
}

export const categories: readonly Category[] = [
  {
    slug: 'perfumes-arabes',
    name: 'Perfumes árabes',
    shortName: 'Árabes',
    description: 'Fragancias de casas árabes y orientales: oud, ámbar, especias y resinas.',
    tone: 'bg-oud-800',
  },
  {
    slug: 'disenador',
    name: 'Perfumes de diseñador',
    shortName: 'Diseñador',
    description: 'Fragancias de casas de perfumería y diseñadores reconocidos.',
    tone: 'bg-ink-900',
  },
  {
    slug: 'nicho',
    name: 'Perfumería de nicho',
    shortName: 'Nicho',
    description: 'Propuestas olfativas de autor, de marcas especializadas y exclusivas.',
    tone: 'bg-amber-600',
  },
  {
    slug: 'equivalencias',
    name: 'Equivalencias',
    shortName: 'Equivalencias',
    description:
      'Fragancias inspiradas en perfiles olfativos conocidos. No son los perfumes originales ni están asociadas a sus marcas.',
    tone: 'bg-smoke-500',
  },
]

export function findCategory(slug: string | undefined) {
  return categories.find((category) => category.slug === slug)
}
