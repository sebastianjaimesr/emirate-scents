import { WhatsAppIcon } from '../../components/brand/BrandIcons'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Container } from '../../components/ui/Container'
import { Reveal } from '../../components/ui/Reveal'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { orderSteps } from '../../content/home'
import { buildWhatsAppUrl, whatsappMessages } from '../../lib/whatsapp'

/** Explica, sin promesas no confirmadas, cómo funciona un pedido por WhatsApp. */
export function OrderStepsSection() {
  return (
    <section
      id="como-pedir"
      aria-labelledby="como-pedir-title"
      className="scroll-mt-24 bg-ivory-50 py-24 sm:py-32"
    >
      <Container>
        <SectionHeading
          id="como-pedir-title"
          eyebrow="Cómo pedir"
          title="Tu pedido, con atención personal"
          lead="Pedimos por WhatsApp para confirmar contigo cada detalle antes de despachar."
          align="center"
        />

        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {orderSteps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 0.12} className="relative text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full border border-gold-700/40 font-display text-2xl text-gold-700">
                {index + 1}
              </span>
              <h3 className="mt-6 text-2xl text-ink-950 sm:text-3xl">{step.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-smoke-500 sm:text-base">
                {step.description}
              </p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-16 flex flex-col items-center gap-4 text-center">
          <ButtonLink to={buildWhatsAppUrl(whatsappMessages.general)}>
            <WhatsAppIcon className="size-5" />
            Escribir por WhatsApp
          </ButtonLink>
          <p className="max-w-md text-xs leading-relaxed text-smoke-500">
            Pago contra entrega sujeto a la cobertura y las condiciones de tu ciudad. Todo pedido
            queda pendiente hasta que lo confirmemos contigo.
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
