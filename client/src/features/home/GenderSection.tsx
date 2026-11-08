import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Container } from '../../components/ui/Container'
import { Reveal } from '../../components/ui/Reveal'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { genderLink, useGenderMenus, type GenderSection } from '../catalog/genderSections'

const base = import.meta.env.BASE_URL

/** Un frasco real de cada sección (fotos oficiales con el fondo recortado). */
const covers: Record<GenderSection['slug'], { src: string; srcSet: string; alt: string }> = {
  hombre: {
    src: `${base}images/products/AR-0040/rasasi-hawas-fire.webp`,
    srcSet: `${base}images/products/AR-0040/rasasi-hawas-fire-400.webp 400w, ${base}images/products/AR-0040/rasasi-hawas-fire.webp 800w`,
    alt: 'Frasco de Hawas Fire, de Rasasi',
  },
  mujer: {
    src: `${base}images/products/AR-0029/lattafa-yara.webp`,
    srcSet: `${base}images/products/AR-0029/lattafa-yara-400.webp 400w, ${base}images/products/AR-0029/lattafa-yara.webp 800w`,
    alt: 'Frasco de Yara, de Lattafa',
  },
}

/** Accesos a las secciones Hombre y Mujer, cada una con sus categorías. */
export function GenderSection() {
  const menus = useGenderMenus()
  return (
    <section aria-labelledby="genero-title" className="bg-ink-950 py-24 text-ivory-50 sm:py-32">
      <Container>
        <SectionHeading
          id="genero-title"
          tone="dark"
          eyebrow="Para él · Para ella"
          title="Encuentra tu perfume"
          lead="Los unisex aparecen en las dos secciones."
        />
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:gap-10">
          {menus.map(({ section, categories }, index) => {
            const cover = covers[section.slug]
            return (
              <Reveal as="li" key={section.slug} delay={index * 0.1}>
                <div className="group relative grid grid-cols-[2fr_3fr] items-center border border-gold-500/20 transition-colors duration-500 hover:border-gold-500/50">
                  <div className="photo-stage aspect-[4/5]">
                    <img
                      src={cover.src}
                      srcSet={cover.srcSet}
                      sizes="(min-width: 1024px) 20vw, 40vw"
                      alt={cover.alt}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-contain mix-blend-lighten transition-transform duration-700 ease-luxe group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-5 sm:p-8">
                    <h3 className="font-display text-4xl text-gold-300 sm:text-5xl">
                      <Link to={genderLink(section)} className="hover:text-gold-500">
                        {section.label}
                      </Link>
                    </h3>
                    {categories.length > 0 && (
                      <ul
                        aria-label={`Categorías de ${section.label}`}
                        className="mt-4 space-y-0.5"
                      >
                        {categories.map((category) => (
                          <li key={category.slug}>
                            <Link
                              to={category.to}
                              className="inline-flex min-h-10 items-center text-sm text-ivory-50/80 transition-colors hover:text-gold-300"
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      to={genderLink(section)}
                      className="mt-4 inline-flex min-h-10 items-center gap-2 text-xs font-semibold tracking-[0.16em] text-gold-300 uppercase hover:text-gold-500"
                    >
                      Ver todo
                      <ArrowRight
                        aria-hidden="true"
                        className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                        strokeWidth={1.5}
                      />
                    </Link>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
