import { Sparkles } from 'lucide-react'
import { NavLink, useParams, useSearchParams } from 'react-router'
import { WhatsAppIcon } from '../components/brand/BrandIcons'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Container } from '../components/ui/Container'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PageMeta } from '../components/ui/PageMeta'
import { categories, findCategory } from '../data/categories'
import { buildWhatsAppUrl, whatsappMessages } from '../lib/whatsapp'
import { NotFoundPage } from './NotFoundPage'

/**
 * Catálogo. En esta fase todavía no hay productos reales cargados, así que se
 * muestra un estado honesto "en preparación" con acceso directo a WhatsApp.
 * La búsqueda (?q=) y la categoría de la URL ya se leen y se usan en el mensaje.
 * En la Fase 3 aquí aparecerán la cuadrícula de productos, filtros y orden.
 */
export function CatalogPage() {
  const { categorySlug } = useParams()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const category = findCategory(categorySlug)

  if (categorySlug && !category) return <NotFoundPage />

  const title = category?.name ?? 'Catálogo'
  const whatsappMessage = query
    ? whatsappMessages.search(query)
    : category
      ? whatsappMessages.category(category.name)
      : whatsappMessages.general

  return (
    <>
      <PageMeta
        title={title}
        description={
          category?.description ??
          'Catálogo de perfumes árabes, de diseñador, de nicho y equivalencias de Emirate Scents.'
        }
      />
      <PageHeader eyebrow="Colecciones" title={title} lead={category?.description} />

      <nav aria-label="Categorías" className="border-b border-sand-300 bg-ivory-50">
        <Container>
          <ul className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 py-4 sm:justify-center">
            {[{ slug: '', shortName: 'Todo' }, ...categories].map((item) => (
              <li key={item.slug} className="shrink-0">
                <NavLink
                  to={item.slug ? `/catalogo/${item.slug}` : '/catalogo'}
                  end
                  className={({ isActive }) =>
                    `inline-flex min-h-10 items-center border px-4 text-xs font-semibold tracking-[0.14em] uppercase transition-colors ${
                      isActive
                        ? 'border-ink-900 bg-ink-900 text-ivory-50'
                        : 'border-sand-300 text-ink-900 hover:border-ink-900'
                    }`
                  }
                >
                  {item.shortName}
                </NavLink>
              </li>
            ))}
          </ul>
        </Container>
      </nav>

      <Container>
        <EmptyState
          icon={<Sparkles className="size-8" strokeWidth={1.25} />}
          title="Estamos preparando el catálogo"
          description={
            query
              ? `Buscaste "${query}". Mientras publicamos el catálogo en línea, pregúntanos por WhatsApp si lo tenemos disponible.`
              : 'Muy pronto podrás explorar aquí cada fragancia. Mientras tanto, consulta disponibilidad y precios por WhatsApp.'
          }
          actions={
            <ButtonLink to={buildWhatsAppUrl(whatsappMessage)}>
              <WhatsAppIcon className="size-5" />
              Consultar por WhatsApp
            </ButtonLink>
          }
        />
      </Container>
    </>
  )
}
