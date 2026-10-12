import { Container } from '../../components/ui/Container'
import { Reveal } from '../../components/ui/Reveal'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { olfactoryFamilies } from '../../content/home'

/** Bloque editorial sobre el mundo de la perfumería (contenido general, no de productos). */
export function OlfactoryFamiliesSection() {
  return (
    <section aria-labelledby="familias-title" className="bg-cream-100 py-24 sm:py-32">
      <Container className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
        <div className="lg:sticky lg:top-36 lg:self-start">
          <SectionHeading
            id="familias-title"
            eyebrow="El arte del perfume"
            title="Un viaje por las familias olfativas"
            lead="Conocer las familias olfativas te ayuda a reconocer lo que te gusta y a descubrir nuevas fragancias con más confianza."
          />
        </div>

        <ol className="border-t border-sand-300">
          {olfactoryFamilies.map((family, index) => (
            <Reveal as="li" key={family.name} delay={index * 0.05}>
              <div className="group grid grid-cols-[3rem_1fr] gap-x-4 border-b border-sand-300 py-8 sm:grid-cols-[4rem_10rem_1fr] sm:items-baseline">
                <span className="font-display text-lg text-gold-700">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-3xl text-ink-950 transition-transform duration-500 ease-luxe group-hover:translate-x-1 sm:text-4xl">
                  {family.name}
                </h3>
                <p className="col-start-2 mt-3 text-sm leading-relaxed text-smoke-500 sm:col-start-3 sm:mt-0 sm:text-base">
                  {family.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}
