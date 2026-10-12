import { ArrowDown, ArrowRight } from 'lucide-react'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Fragment, useRef } from 'react'
import { WhatsAppIcon } from '../../components/brand/BrandIcons'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Container } from '../../components/ui/Container'
import { heroContent } from '../../content/home'
import { buildWhatsAppUrl, whatsappMessages } from '../../lib/whatsapp'
import { HeroVisual } from '../hero3d/HeroVisual'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * Hero de la página de inicio: un escenario oscuro con un frasco 3D dentro del arco
 * dorado de la marca (ver features/hero3d). El texto y los botones se muestran al instante
 * y nunca dependen del 3D: si la escena no carga, la página funciona igual.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // El texto sube un poco más rápido que el frasco y se desvanece al salir: profundidad
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', prefersReducedMotion ? '0%' : '-12%'])
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, prefersReducedMotion ? 1 : 0])
  const titleWords = heroContent.title.split(' ')

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-ink-950 text-ivory-50"
    >
      {/* Luz cálida detrás del frasco y un piso que se pierde en la penumbra */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_45%_at_50%_28%,rgb(201_165_78/0.18),transparent_70%)] lg:bg-[radial-gradient(ellipse_38%_58%_at_72%_46%,rgb(201_165_78/0.2),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black/50 to-transparent"
      />

      <Container className="grid items-center gap-10 pt-10 pb-20 sm:pt-14 lg:min-h-[calc(100svh-5.5rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16">
        <HeroVisual progress={scrollYProgress} />

        <m.div
          style={{ y: textY, opacity: textOpacity }}
          className="relative text-center lg:order-1 lg:text-left"
        >
          <m.p
            className="eyebrow text-gold-500"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
          >
            {heroContent.eyebrow}
          </m.p>

          {/* El título aparece palabra por palabra, como una frase que se revela */}
          <h1
            id="hero-title"
            className="mt-5 text-5xl leading-[0.98] sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            {titleWords.map((word, index) => (
              <Fragment key={index}>
                {index > 0 && ' '}
                <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <m.span
                    className="inline-block"
                    initial={{ y: '105%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    transition={{ duration: 1.1, delay: 0.4 + index * 0.12, ease }}
                  >
                    {word}
                  </m.span>
                </span>
              </Fragment>
            ))}
          </h1>

          <m.p
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-smoke-300 sm:text-lg lg:mx-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.8, ease }}
          >
            {heroContent.lead}
          </m.p>

          <m.div
            className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1, ease }}
          >
            <ButtonLink to="/catalogo">
              {heroContent.primaryCta}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </ButtonLink>
            <ButtonLink to="#coleccion" variant="outline-dark">
              {heroContent.secondaryCta}
              <ArrowDown
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                strokeWidth={1.5}
              />
            </ButtonLink>
          </m.div>

          <m.a
            href={buildWhatsAppUrl(whatsappMessages.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 text-sm text-smoke-300 underline decoration-gold-500/40 underline-offset-4 transition-colors hover:text-gold-300 hover:decoration-gold-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.2, ease }}
          >
            <WhatsAppIcon className="size-4 text-gold-500" />
            {heroContent.advice}
          </m.a>
        </m.div>
      </Container>

      {/* Indicación de scroll (solo escritorio): una línea dorada que desciende */}
      <m.div
        aria-hidden="true"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
      >
        <span className="text-[0.65rem] tracking-[0.3em] text-smoke-300 uppercase">Desliza</span>
        <span className="relative h-10 w-px overflow-hidden bg-gold-500/20">
          <m.span
            className="absolute inset-x-0 top-0 h-1/2 bg-gold-500"
            animate={prefersReducedMotion ? undefined : { y: ['-100%', '200%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </m.div>
    </section>
  )
}
