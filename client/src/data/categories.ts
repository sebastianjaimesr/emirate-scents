/**
 * Las cuatro categorías principales de la tienda.
 * Por ahora viven aquí; en la Fase 5 vendrán de la API (GET /api/categories)
 * y este archivo dejará de ser necesario.
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
