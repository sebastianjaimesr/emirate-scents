import {
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router'
import heroBottles from '../../content/hero-bottles.json'
import { mediaUrl } from '../../lib/mediaUrl'

const ease = [0.22, 1, 0.36, 1] as const

/** Anchos que genera `npm run fotos:portada` (server/scripts/heroImages.ts). */
const WIDTHS = [480, 800]

/**
 * Posición de cada frasco en el escenario, en el mismo orden que hero-bottles.json:
 * el del centro es el protagonista; los laterales quedan un poco atrás y en penumbra.
 * depth = cuánto se mueve con el cursor y con el scroll (más = más cerca de la cámara).
 */
const stage = [
  { style: { left: '-3%', width: '40%', bottom: '19%' }, depth: 0.5, dim: true, z: 1 },
  { style: { left: '25%', width: '50%', bottom: '12%' }, depth: 1, dim: false, z: 3 },
  { style: { right: '-3%', width: '40%', bottom: '19%' }, depth: 0.5, dim: true, z: 1 },
] satisfies { style: CSSProperties; depth: number; dim: boolean; z: number }[]

/** Bordes difuminados: la foto se funde con el fondo negro en lugar de verse "pegada". */
const featherMask = 'radial-gradient(ellipse 47% 50% at 50% 48%, black 58%, transparent 100%)'
// La máscara se aplica antes de voltear la imagen: por eso va "hacia arriba"
const reflectionMask = 'linear-gradient(to top, rgb(0 0 0 / 0.6), transparent 40%)'

function srcSet(key: string, format: 'avif' | 'webp') {
  return WIDTHS.map(
    (width) => `${mediaUrl(`/images/hero/${key}-${width}.${format}`)} ${width}w`,
  ).join(', ')
}

function BottlePhoto({
  bottle,
  priority,
  sizes,
  className,
  style,
}: {
  bottle: (typeof heroBottles)[number]
  priority: boolean
  sizes: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(bottle.key, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(bottle.key, 'webp')} sizes={sizes} />
      <img
        src={mediaUrl(`/images/hero/${bottle.key}-800.webp`)}
        alt=""
        width={800}
        height={1000}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        draggable={false}
        className={className}
        style={style}
      />
    </picture>
  )
}

/**
 * Composición de la portada: tres perfumes originales del catálogo sobre un escenario negro,
 * con luz dorada detrás, piso brillante con reflejos y un destello que cruza al cargar.
 * - Al cargar, los frascos suben y se enfocan uno por uno.
 * - Flotan muy despacio y siguen al cursor con profundidad (solo con mouse).
 * - Con "reducir movimiento" todo queda quieto.
 * Cada frasco lleva al catálogo filtrado por ese perfume.
 */
export function HeroShowcase({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = useReducedMotion() ?? false
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const x = useSpring(pointerX, { stiffness: 60, damping: 18, mass: 0.6 })
  const y = useSpring(pointerY, { stiffness: 60, damping: 18, mass: 0.6 })

  useEffect(() => {
    if (reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const onMove = (event: PointerEvent) => {
      pointerX.set(event.clientX / window.innerWidth - 0.5)
      pointerY.set(event.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduceMotion, pointerX, pointerY])

  // Luz y escenario: se alejan un poco más lento que los frascos al hacer scroll
  const glowScale = useTransform(progress, [0, 1], [1, reduceMotion ? 1 : 1.25])
  const stageY = useTransform(progress, [0, 1], ['0%', reduceMotion ? '0%' : '10%'])

  return (
    <div
      data-hero-visual="fotos"
      className="relative mx-auto w-full max-w-md select-none sm:max-w-lg lg:order-2 lg:max-w-none"
    >
      <m.div style={{ y: stageY }} className="relative aspect-[6/5] w-full">
        {/* Luz dorada detrás del protagonista; "respira" muy despacio */}
        <m.div
          aria-hidden="true"
          style={{ scale: glowScale }}
          className="absolute inset-x-[8%] top-[4%] bottom-[18%]"
        >
          <m.div
            className="size-full rounded-full bg-[radial-gradient(closest-side,rgb(201_164_92/0.42),rgb(201_164_92/0.12)_55%,transparent)] blur-2xl"
            initial={{ opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.75, 1, 0.75] }}
            transition={
              reduceMotion
                ? { duration: 1.2 }
                : { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }
            }
          />
        </m.div>

        {/* Piso: una línea de luz en el horizonte y un brillo que se pierde hacia adelante */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[24%]">
          <div className="absolute inset-x-[6%] top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
          <div className="absolute inset-x-[14%] top-0 h-full bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgb(201_164_92/0.16),transparent_70%)]" />
        </div>

        {heroBottles.map((bottle, index) => {
          const place = stage[index] ?? stage[1]!
          const priority = index === 1
          return (
            <ParallaxBottle
              key={bottle.key}
              x={x}
              y={y}
              depth={place.depth}
              reduceMotion={reduceMotion}
              style={{ ...place.style, zIndex: place.z }}
              delay={priority ? 0.35 : 0.65 + index * 0.08}
              floatDelay={index * 1.3}
            >
              <Link
                to={`/catalogo?q=${encodeURIComponent(bottle.name)}`}
                aria-label={`Ver ${bottle.name} de ${bottle.brand} en el catálogo`}
                className="group/bottle block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500"
              >
                <div className="relative">
                  <BottlePhoto
                    bottle={bottle}
                    priority={priority}
                    sizes={
                      priority ? '(min-width: 1024px) 26vw, 46vw' : '(min-width: 1024px) 22vw, 40vw'
                    }
                    className={
                      'block h-auto w-full transition-[filter,transform] duration-700 ease-luxe group-hover/bottle:-translate-y-1 ' +
                      (place.dim
                        ? 'brightness-[0.72] group-hover/bottle:brightness-100'
                        : 'group-hover/bottle:brightness-110')
                    }
                    style={{ maskImage: featherMask, WebkitMaskImage: featherMask }}
                  />
                  {/* Reflejo en el piso brillante */}
                  <BottlePhoto
                    bottle={bottle}
                    priority={false}
                    sizes="10vw"
                    className={
                      'pointer-events-none absolute top-[88%] left-0 block h-auto w-full -scale-y-100 ' +
                      (place.dim ? 'opacity-30' : 'opacity-45')
                    }
                    style={{ maskImage: reflectionMask, WebkitMaskImage: reflectionMask }}
                  />
                </div>
              </Link>
            </ParallaxBottle>
          )
        })}

        {/* Destello dorado que cruza la escena una vez, como un reflector */}
        {!reduceMotion && (
          <m.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden mix-blend-screen"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 2.6 }}
          >
            <m.div
              className="absolute inset-y-[-20%] w-1/3 rotate-12 bg-gradient-to-r from-transparent via-gold-300/25 to-transparent"
              initial={{ x: '-150%' }}
              animate={{ x: '420%' }}
              transition={{ duration: 1.8, delay: 1, ease: [0.45, 0, 0.2, 1] }}
            />
          </m.div>
        )}
      </m.div>

      {/* Nombres de los perfumes en escena */}
      <m.ul
        className="relative mt-4 flex justify-center gap-x-6 text-[0.65rem] tracking-[0.24em] text-smoke-300 uppercase sm:gap-x-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
      >
        {heroBottles.map((bottle) => (
          <li key={bottle.key} className="text-center">
            <span className="block font-display text-sm tracking-[0.08em] text-ivory-50 normal-case sm:text-base">
              {bottle.name}
            </span>
            {bottle.brand}
          </li>
        ))}
      </m.ul>
    </div>
  )
}

/** Un frasco: entra subiendo y enfocándose, flota despacio y sigue al cursor según su profundidad. */
function ParallaxBottle({
  children,
  x,
  y,
  depth,
  reduceMotion,
  style,
  delay,
  floatDelay,
}: {
  children: ReactNode
  x: MotionValue<number>
  y: MotionValue<number>
  depth: number
  reduceMotion: boolean
  style: CSSProperties
  delay: number
  floatDelay: number
}) {
  const offsetX = useTransform(x, (value) => value * 26 * depth)
  const offsetY = useTransform(y, (value) => value * 14 * depth)

  return (
    // "lighten": el fondo negro de cada foto deja ver la luz dorada de atrás, así la foto no se
    // ve como un rectángulo pegado sobre el escenario
    <m.div className="absolute mix-blend-lighten" style={{ ...style, x: offsetX, y: offsetY }}>
      <m.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 60, filter: 'blur(14px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.4, delay, ease }}
      >
        <m.div
          animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
          transition={{
            duration: 6.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: delay + 1.4 + floatDelay,
          }}
        >
          {children}
        </m.div>
      </m.div>
    </m.div>
  )
}
