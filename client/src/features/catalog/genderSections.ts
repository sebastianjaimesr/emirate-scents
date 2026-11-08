import { useEffect, useState } from 'react'
import { categories } from '../../data/categories'
import { getCatalogFilters } from '../../services/productService'
import type { AudienceSlug } from './catalogQuery'

/**
 * Secciones "Hombre" y "Mujer" de la tienda. Cada una es el catálogo filtrado por público
 * (?genero=…). Los perfumes unisex aparecen en las dos, como en cualquier perfumería.
 */
export const genderSections = [
  {
    slug: 'hombre',
    label: 'Hombre',
    title: 'Perfumes para hombre',
    audiences: ['masculino', 'unisex'],
  },
  {
    slug: 'mujer',
    label: 'Mujer',
    title: 'Perfumes para mujer',
    audiences: ['femenino', 'unisex'],
  },
] as const satisfies readonly {
  slug: string
  label: string
  title: string
  audiences: readonly AudienceSlug[]
}[]

export type GenderSection = (typeof genderSections)[number]

/** Enlace al catálogo de una sección, opcionalmente dentro de una categoría. */
export function genderLink(section: GenderSection, categorySlug?: string) {
  const base = categorySlug ? `/catalogo/${categorySlug}` : '/catalogo'
  return `${base}?genero=${section.audiences.join(',')}`
}

/** La sección que corresponde exactamente a estos filtros de público, si hay una. */
export function findGenderSection(audiences: readonly AudienceSlug[]) {
  return genderSections.find(
    (section) =>
      section.audiences.length === audiences.length &&
      section.audiences.every((audience) => audiences.includes(audience)),
  )
}

export interface GenderMenu {
  section: GenderSection
  /** Categorías que tienen productos para esta sección (nunca enlaces a páginas vacías). */
  categories: { slug: string; name: string; to: string }[]
}

/** Se calcula una sola vez por visita: lo comparten el header, el menú móvil y el inicio. */
let menusPromise: Promise<GenderMenu[]> | undefined

function loadMenus() {
  menusPromise ??= Promise.all(
    categories.map((category) =>
      getCatalogFilters(category.slug).then((facets) => ({
        category,
        audiences: facets.audiences.map(({ value }) => value),
      })),
    ),
  ).then(
    (perCategory) =>
      genderSections.map((section) => ({
        section,
        categories: perCategory
          .filter(({ audiences }) =>
            audiences.some((value) =>
              (section.audiences as readonly AudienceSlug[]).includes(value),
            ),
          )
          .map(({ category }) => ({
            slug: category.slug,
            name: category.name,
            to: genderLink(section, category.slug),
          })),
      })),
    // Si la API no responde, las secciones quedan sin subcategorías (el enlace principal sirve)
    () => genderSections.map((section) => ({ section, categories: [] })),
  )
  return menusPromise
}

/** Secciones Hombre / Mujer con las categorías que tienen productos para cada una. */
export function useGenderMenus() {
  const [menus, setMenus] = useState<GenderMenu[]>(() =>
    genderSections.map((section) => ({ section, categories: [] })),
  )
  useEffect(() => {
    let active = true
    void loadMenus().then((items) => active && setMenus(items))
    return () => {
      active = false
    }
  }, [])
  return menus
}
