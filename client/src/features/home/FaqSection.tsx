import { Plus } from 'lucide-react'
import { Container } from '../../components/ui/Container'
import { Reveal } from '../../components/ui/Reveal'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { faqs } from '../../content/home'

/**
 * Preguntas frecuentes con <details>/<summary>: funcionan con teclado y
 * lectores de pantalla sin JavaScript adicional.
 */
export function FaqSection() {
  return (
    <section
      id="preguntas-frecuentes"
      aria-labelledby="faq-title"
      className="scroll-mt-24 border-t border-sand-300 bg-ivory-50 py-24 sm:py-32"
    >
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <SectionHeading id="faq-title" eyebrow="Preguntas frecuentes" title="Antes de pedir" />

        <Reveal>
          <div className="border-t border-sand-300">
            {faqs.map((faq) => (
              <details key={faq.question} className="group border-b border-sand-300">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-2xl text-ink-950 transition-colors hover:text-gold-700 sm:text-[1.7rem] [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <Plus
                    aria-hidden="true"
                    className="size-5 shrink-0 text-gold-700 transition-transform duration-300 group-open:rotate-45"
                    strokeWidth={1.5}
                  />
                </summary>
                <p className="max-w-2xl pb-6 text-sm leading-relaxed text-smoke-500 sm:text-base">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
