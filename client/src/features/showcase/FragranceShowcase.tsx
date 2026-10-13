import { ArrowRight } from 'lucide-react'
import {
  m,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from 'react'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Container } from '../../components/ui/Container'
import { showcaseContent } from '../../content/home'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { cx } from '../../lib/cx'
import { getShowcaseProducts } from '../../services/productService'
import type { Product } from '../../types/product'
import { ShowcaseItem } from './ShowcaseItem'

/** Recorrido de scroll vertical que corresponde a avanzar un perfume (en alto de pantalla). */
const SCROLL_PER_ITEM_SVH = 45

const itemWidth = { '--showcase-item': 'clamp(13rem, min(20vw, 30svh), 19rem)' } as CSSProperties

/**
 * "The Fragrance Collection": vitrina de perfumes.
 *
 * En pantallas grandes, la sección es alta y su contenido queda fijado (position: sticky)
 * mientras se recorre: el scroll vertical mueve la fila de frascos en horizontal. Al subir,
 * la fila retrocede. Al terminar la sección, la página sigue con normalidad. No se bloquea
 * el scroll en ningún momento.
 *
 * En celulares y con "reducir movimiento", es un carrusel horizontal que se desliza con el dedo.
 */
export function FragranceShowcase() {
  const { data: products } = useAsyncData('showcase', () => getShowcaseProducts())
  const isWide = useMediaQuery('(min-width: 768px)')
  const prefersReducedMotion = useReducedMotion()

  if (!products || products.length === 0) return null

  const hasDemo = products.some((product) => product.isDemo)
  return isWide && !prefersReducedMotion && products.length > 1 ? (
    <PinnedShowcase products={products} hasDemo={hasDemo} />
  ) : (
    <CarouselShowcase products={products} hasDemo={hasDemo} />
  )
}

function Heading({
  hasDemo,
  counter,
  compact = false,
}: {
  hasDemo: boolean
  counter?: ReactNode
  compact?: boolean
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-xl">
        <p className="eyebrow text-gold-500">{showcaseContent.eyebrow}</p>
        <h2
          id="vitrina-title"
          className={cx(
            'mt-3 leading-[1.05] text-ivory-50',
            compact ? 'text-4xl xl:text-5xl' : 'text-4xl sm:text-5xl',
          )}
        >
          {showcaseContent.title}
        </h2>
        {hasDemo && (
          <p className="mt-3 text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">
            Productos de demostración: no están a la venta
          </p>
        )}
      </div>
      <div className="flex items-center gap-6">
        {counter}
        <ButtonLink to="/catalogo" variant="outline-dark" className="shrink-0">
          Ver catálogo
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={1.5}
          />
        </ButtonLink>
      </div>
    </div>
  )
}

function PinnedShowcase({ products, hasDemo }: { products: Product[]; hasDemo: boolean }) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const count = products.length

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  // Un resorte suave entre la rueda del ratón y la fila: el movimiento nunca da saltos
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 32, restDelta: 0.0005 })
  // Posición en "perfumes": 0 = el primero en el centro, count - 1 = el último
  const position = useTransform(progress, (p) => p * (count - 1))
  const x = useTransform(position, (value) => -value * step)
  // Los arcos del fondo se mueven más despacio que la fila: profundidad
  const backdropX = useTransform(progress, [0, 1], ['6%', '-6%'])

  // Distancia entre dos perfumes consecutivos (ancho + separación), medida en pantalla
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => {
      const [first, second] = track.children as HTMLCollectionOf<HTMLElement>
      setStep(second ? second.offsetLeft - first.offsetLeft : 0)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [count])

  // Con el teclado (Tab), se desplaza la página hasta dejar centrado el perfume enfocado
  const focusItem = (index: number) => (event: FocusEvent<HTMLAnchorElement>) => {
    const section = sectionRef.current
    if (!section || !event.target.matches(':focus-visible')) return
    const top = section.getBoundingClientRect().top + window.scrollY
    const scrollable = section.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + (index / (count - 1)) * scrollable, behavior: 'instant' })
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="vitrina-title"
      data-showcase="fijada"
      className="relative bg-ink-950"
      style={{ height: `calc(100svh + ${(count - 1) * SCROLL_PER_ITEM_SVH}svh)` }}
    >
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden pt-18 xl:pt-22">
        <m.div
          aria-hidden="true"
          style={{ x: backdropX }}
          className="pointer-events-none absolute inset-x-[-10%] bottom-0 h-[70%] bg-[radial-gradient(ellipse_45%_60%_at_50%_70%,rgb(201_165_78/0.12),transparent_70%)]"
        />
        <Container className="relative pt-6 xl:pt-8">
          <Heading
            compact
            hasDemo={hasDemo}
            counter={<Counter position={position} count={count} />}
          />
        </Container>

        <div className="relative flex flex-1 items-center [perspective:1400px]">
          <m.div
            ref={trackRef}
            data-showcase-track
            style={{ ...itemWidth, x }}
            className="flex w-full gap-[clamp(2rem,5vw,5rem)] px-[calc(50%-var(--showcase-item)/2)]"
          >
            {products.map((product, index) => (
              <ShowcaseItem
                key={product.id}
                product={product}
                index={index}
                position={position}
                onFocus={focusItem(index)}
              />
            ))}
          </m.div>
        </div>

        <Container className="relative pb-6">
          <ProgressBar progress={progress} />
        </Container>
      </div>
    </section>
  )
}

/** "03 / 08": qué perfume está en el centro. */
function Counter({ position, count }: { position: MotionValue<number>; count: number }) {
  const [current, setCurrent] = useState(1)
  useMotionValueEvent(position, 'change', (value) => setCurrent(Math.round(value) + 1))
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    <p className="font-display text-2xl text-ivory-50 tabular-nums" aria-hidden="true">
      {pad(current)}
      <span className="mx-2 text-gold-500">/</span>
      <span className="text-smoke-300">{pad(count)}</span>
    </p>
  )
}

function ProgressBar({ progress }: { progress: MotionValue<number> }) {
  return (
    <div aria-hidden="true" className="h-px w-full bg-gold-500/20">
      <m.div style={{ scaleX: progress }} className="h-full origin-left bg-gold-500" />
    </div>
  )
}

function CarouselShowcase({ products, hasDemo }: { products: Product[]; hasDemo: boolean }) {
  return (
    <section
      aria-labelledby="vitrina-title"
      data-showcase="carrusel"
      className="bg-ink-950 py-20 sm:py-28"
    >
      <Container>
        <Heading hasDemo={hasDemo} />
        <p className="mt-4 text-sm text-smoke-300 md:hidden">Desliza para ver la colección</p>
      </Container>
      <ul
        style={itemWidth}
        className="mt-10 flex snap-x snap-mandatory [scrollbar-width:none] gap-6 overflow-x-auto px-[calc(50%-var(--showcase-item)/2)] pb-6 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product, index) => (
          <li key={product.id} className="snap-center">
            <ShowcaseItem product={product} index={index} />
          </li>
        ))}
      </ul>
    </section>
  )
}
