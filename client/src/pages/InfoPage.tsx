/**
 * Páginas de confianza (/envios, /cambios-y-devoluciones, /autenticidad, /contacto).
 * El texto vive en content/infoPages.ts: así se edita sin tocar el diseño.
 */
import { InstagramIcon, WhatsAppIcon } from '../components/brand/BrandIcons'
import { Container } from '../components/ui/Container'
import { PageHeader } from '../components/ui/PageHeader'
import { PageMeta } from '../components/ui/PageMeta'
import { brand } from '../config/brand'
import { findInfoPage, infoPages } from '../content/infoPages'
import { buildWhatsAppUrl, whatsappMessages } from '../lib/whatsapp'
import { Link } from 'react-router'
import { NotFoundPage } from './NotFoundPage'

const contactLinkClass =
  'flex min-h-14 items-center gap-4 border border-sand-300 bg-ivory-50 px-5 text-base text-ink-950 transition-colors hover:border-ink-900'

/** Una página de confianza con sus secciones, el contacto y enlaces a las demás. */
export function InfoPage({ slug }: { slug: string }) {
  const page = findInfoPage(slug)
  if (!page) return <NotFoundPage />

  return (
    <>
      <PageMeta title={page.title} description={page.metaDescription} />
      <PageHeader eyebrow={page.eyebrow} title={page.title} lead={page.lead} />

      <Container className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
          <div className="space-y-10">
            {page.sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-3xl text-ink-950">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-relaxed text-ink-900">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

            <section aria-labelledby="info-contacto" className="space-y-4">
              <h2 id="info-contacto" className="text-3xl text-ink-950">
                Escríbenos
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={buildWhatsAppUrl(whatsappMessages.general)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={contactLinkClass}
                >
                  <WhatsAppIcon className="size-6 text-gold-700" />
                  <span>
                    <span className="block text-xs text-smoke-500">WhatsApp</span>
                    {brand.whatsappDisplay}
                  </span>
                </a>
                <a
                  href={brand.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={contactLinkClass}
                >
                  <InstagramIcon className="size-6 text-gold-700" />
                  <span>
                    <span className="block text-xs text-smoke-500">Instagram</span>
                    {brand.instagramHandle}
                  </span>
                </a>
              </div>
            </section>
          </div>

          <nav aria-label="Más información" className="lg:pt-2">
            <h2 className="eyebrow font-sans text-gold-700">Más información</h2>
            <ul className="mt-4 border-t border-sand-300 text-sm">
              {infoPages.map((item) => (
                <li key={item.slug} className="border-b border-sand-300">
                  <Link
                    to={`/${item.slug}`}
                    aria-current={item.slug === page.slug ? 'page' : undefined}
                    className="flex min-h-12 items-center text-ink-900 transition-colors hover:text-gold-700 aria-[current=page]:font-semibold aria-[current=page]:text-gold-700"
                  >
                    {item.navLabel}
                  </Link>
                </li>
              ))}
              <li className="border-b border-sand-300">
                <Link
                  to="/politica-de-datos"
                  className="flex min-h-12 items-center text-ink-900 transition-colors hover:text-gold-700"
                >
                  Tratamiento de datos
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </>
  )
}
