import { ArrowRight } from 'lucide-react'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { WhatsAppIcon } from '../../components/brand/BrandIcons'
import { Logo } from '../../components/brand/Logo'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Container } from '../../components/ui/Container'
import { heroContent } from '../../content/home'
import { buildWhatsAppUrl, whatsappMessages } from '../../lib/whatsapp'

const ease = [0.22, 1, 0.36, 1] as const

/** Arco apuntado en un lienzo de 300 × 400 (proporción 3:4). */
function archPath(inset: number) {
  const left = inset
  const right = 300 - inset
  const width = right - left
  const top = inset * 1.1
  return `M${left},400 L${left},${top + width * 0.5} C${left},${top + width * 0.22} ${left + width * 0.3},${top + width * 0.07} 150,${top} C${right - width * 0.3},${top + width * 0.07} ${right},${top + width * 0.22} ${right},${top + width * 0.5} L${right},400`
}

/**
 * Hero de la página de inicio.
 * Mientras no tengamos fotografía propia, la composición se construye con el logo,
 * arcos de línea dorada y una luz cálida, en capas que se mueven a distinta
 * velocidad al hacer scroll (parallax). No simula ningún producto ni modelo 3D.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // Cada capa se desplaza a una velocidad distinta para crear profundidad
  const logoY = useTransform(scrollYProgress, [0, 1], ['0%', prefersReducedMotion ? '0%' : '18%'])
  const archesY = useTransform(scrollYProgress, [0, 1], ['0%', prefersReducedMotion ? '0%' : '8%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', prefersReducedMotion ? '0%' : '-10%'])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-ink-950 text-ivory-50"
    >
      {/* Luz cálida, como una vela tras el frasco */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_50%_at_50%_30%,rgb(201_165_78/0.16),transparent_70%)] lg:bg-[radial-gradient(ellipse_40%_60%_at_72%_45%,rgb(201_165_78/0.16),transparent_70%)]"
      />

      <Container className="grid items-center gap-10 pt-10 pb-20 sm:pt-14 lg:min-h-[calc(100svh-5.5rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16">
        {/* Composición visual: primero en móvil, a la derecha en escritorio */}
        <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-sm lg:order-2 lg:max-w-md">
          <m.svg
            aria-hidden="true"
            viewBox="0 0 300 400"
            className="block w-full [mask-image:linear-gradient(to_bottom,black_70%,transparent)] text-gold-500"
            style={{ y: archesY }}
          >
            {[0, 18, 30].map((inset, index) => (
              <m.path
                key={inset}
                d={archPath(inset)}
                fill={index === 2 ? 'rgb(26 22 18 / 0.85)' : 'none'}
                stroke="currentColor"
                strokeWidth={index === 0 ? 1 : 0.6}
                strokeOpacity={index === 0 ? 0.9 : 0.45}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.2 + index * 0.25, ease }}
              />
            ))}
          </m.svg>

          <m.div style={{ y: logoY }} className="absolute inset-x-[14%] top-[20%]">
            <m.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, delay: 0.5, ease }}
            >
              <Logo priority className="w-full drop-shadow-[0_0_40px_rgb(201_165_78/0.18)]" />
            </m.div>
          </m.div>
        </div>

        {/* Texto */}
        <m.div style={{ y: textY }} className="text-center lg:order-1 lg:text-left">
          <m.p
            className="eyebrow text-gold-500"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
          >
            {heroContent.eyebrow}
          </m.p>
          <m.h1
            id="hero-title"
            className="mt-5 text-5xl leading-[0.98] sm:text-6xl lg:text-7xl xl:text-8xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease }}
          >
            {heroContent.title}
          </m.h1>
          <m.p
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-smoke-300 sm:text-lg lg:mx-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.65, ease }}
          >
            {heroContent.lead}
          </m.p>
          <m.div
            className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.85, ease }}
          >
            <ButtonLink to="/catalogo">
              Explorar catálogo
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </ButtonLink>
            <ButtonLink to={buildWhatsAppUrl(whatsappMessages.general)} variant="outline-dark">
              <WhatsAppIcon className="size-5" />
              Asesoría por WhatsApp
            </ButtonLink>
          </m.div>
        </m.div>
      </Container>
    </section>
  )
}
