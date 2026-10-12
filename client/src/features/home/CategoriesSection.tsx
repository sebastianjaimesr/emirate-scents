import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { ArchFrame, ArchPattern } from '../../components/brand/Arch'
import { Container } from '../../components/ui/Container'
import { Reveal } from '../../components/ui/Reveal'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { categories } from '../../data/categories'
import { cx } from '../../lib/cx'

/** Accesos visuales a las cuatro categorías, enmarcados en arcos. */
export function CategoriesSection() {
  return (
    <section
      id="colecciones"
      aria-labelledby="categorias-title"
      // scroll-mt: al llegar desde el botón del hero, el título no queda debajo del header
      className="scroll-mt-20 bg-ivory-50 py-24 sm:py-32"
    >
      <Container>
        <SectionHeading
          id="categorias-title"
          eyebrow="Colecciones"
          title="Cuatro maneras de descubrir tu aroma"
          lead="Desde la intensidad de Oriente hasta las propuestas de autor: elige el universo que mejor te representa."
        />

        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-8 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Reveal as="li" key={category.slug} delay={index * 0.1}>
              <Link to={`/catalogo/${category.slug}`} className="group block">
                <ArchFrame
                  className="aspect-[3/4]"
                  innerClassName={cx(category.tone, 'transition-transform duration-700 ease-luxe')}
                  outlineClassName="text-gold-700/60 transition-colors duration-500 group-hover:text-gold-700"
                >
                  <div className="size-full transition-transform duration-700 ease-luxe group-hover:scale-[1.05]">
                    <ArchPattern className="text-gold-300/25" />
                  </div>
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-6 text-center font-display text-5xl text-gold-300/80 sm:text-6xl"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </ArchFrame>
                <h3 className="mt-5 text-2xl leading-tight text-ink-950 sm:text-3xl">
                  {category.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-smoke-500">
                  {category.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-gold-700 uppercase">
                  Ver colección
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  )
}
