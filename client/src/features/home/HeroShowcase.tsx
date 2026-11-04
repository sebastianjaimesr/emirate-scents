import {
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useEffect, type CSSProperties } from 'react'
import { Link } from 'react-router'
import heroBottles from '../../content/hero-bottles.json'
import heroImages from '../../content/hero-images.json'
import { mediaUrl } from '../../lib/mediaUrl'

const ease = [0.22, 1, 0.36, 1] as const

/** Nombres de archivo que genera `npm run fotos:portada` (server/scripts/heroImages.ts). */
const FILE_WIDTHS = [480, 800] as const

/*
  El protagonista es el primer perfume de hero-bottles.json (hoy, Khamrah de Lattafa).
  Para cambiarlo: se edita ese archivo con otro perfume ORIGINAL del catálogo y se ejecuta
  `npm run fotos:portada`. La prueba heroBottles.test.ts comprueba que existe y tiene fotos.
*/
const bottle = heroBottles[0]!
const image = (heroImages as Record<string, { widths: number[]; width: number; height: number }>)[
  bottle.key
]!

// La máscara se aplica antes de voltear la imagen: por eso va "hacia arriba"
const reflectionMask = 'linear-gradient(to top, rgb(0 0 0 / 0.5), transparent 32%)'

/** srcset con el ancho REAL de cada archivo (la foto nunca se agranda). */
function srcSet(format: 'avif' | 'webp') {
  return FILE_WIDTHS.map(
    (fileWidth, index) =>
      `${mediaUrl(`/images/hero/${bottle.key}-${fileWidth}.${format}`)} ${image.widths[index]}w`,
  ).join(', ')
}

function BottlePhoto({
  priority,
  sizes,
  className,
  style,
}: {
  priority: boolean
  sizes: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      <img
        src={mediaUrl(`/images/hero/${bottle.key}-800.webp`)}
        alt=""
        width={image.width}
        height={image.height}
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
 * Composición de la portada: un solo perfume protagonista, como en una campaña de revista.
 * - Foto oficial con el fondo recortado, sobre negro, con una luz cálida detrás y un piso
 *   brillante que lo refleja.
 * - Al cargar, el frasco sube y se enfoca; luego flota muy despacio y sigue al cursor
 *   (solo con mouse). Con "reducir movimiento" todo queda quieto.
 * - El frasco y su nombre llevan a la ficha del producto.
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

  const offsetX = useTransform(x, (value) => value * 22)
  const offsetY = useTransform(y, (value) => value * 12)
  // Luz y escenario: se alejan un poco al hacer scroll (profundidad)
  const glowScale = useTransform(progress, [0, 1], [1, reduceMotion ? 1 : 1.2])
  const stageY = useTransform(progress, [0, 1], ['0%', reduceMotion ? '0%' : '8%'])
  const productUrl = `/producto/${bottle.slug}`

  return (
    <div
      data-hero-visual="fotos"
      className="relative mx-auto w-full max-w-[12.5rem] select-none sm:max-w-[17rem] lg:order-2 lg:max-w-[22rem] xl:max-w-[25rem]"
    >
      <m.div style={{ y: stageY }} className="relative pt-[6%] pb-[14%]">
        {/* Luz cálida detrás del frasco; "respira" muy despacio */}
        <m.div
          aria-hidden="true"
          style={{ scale: glowScale }}
          className="absolute inset-x-[-18%] top-[-4%] bottom-[6%]"
        >
          <m.div
            className="size-full rounded-full bg-[radial-gradient(closest-side,rgb(198_161_91/0.34),rgb(198_161_91/0.08)_60%,transparent)] blur-2xl"
            initial={{ opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.8, 1, 0.8] }}
            transition={
              reduceMotion
                ? { duration: 1.2 }
                : { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }
            }
          />
        </m.div>

        {/* Piso: una línea de luz en el horizonte y un brillo que se pierde hacia adelante */}
        <div aria-hidden="true" className="absolute inset-x-[-20%] bottom-0 h-[16%]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
          <div className="absolute inset-x-[15%] top-0 h-full bg-[radial-gradient(ellipse_50%_70%_at_50%_0%,rgb(198_161_91/0.14),transparent_70%)]" />
        </div>

        <m.div className="relative" style={{ x: offsetX, y: offsetY }}>
          <m.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 48, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.4, delay: 0.3, ease }}
          >
            <m.div
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            >
              {/* El frasco también lleva a la ficha; para teclado y lectores basta el pie de foto */}
              <Link
                to={productUrl}
                tabIndex={-1}
                aria-hidden="true"
                className="group/bottle relative block"
              >
                <BottlePhoto
                  priority
                  sizes="(min-width: 1280px) 25rem, (min-width: 1024px) 22rem, (min-width: 640px) 17rem, 12.5rem"
                  className="block h-auto w-full drop-shadow-[0_30px_40px_rgb(0_0_0/0.55)] transition-[filter,transform] duration-700 ease-luxe group-hover/bottle:-translate-y-1 group-hover/bottle:brightness-110"
                />
                {/* Reflejo en el piso brillante */}
                <BottlePhoto
                  priority={false}
                  sizes="10vw"
                  className="pointer-events-none absolute top-[calc(100%+2px)] left-0 block h-auto w-full -scale-y-100 opacity-35"
                  style={{ maskImage: reflectionMask, WebkitMaskImage: reflectionMask }}
                />
              </Link>
            </m.div>
          </m.div>
        </m.div>

        {/* Destello que cruza la escena una vez, como un reflector */}
        {!reduceMotion && (
          <m.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 2.6 }}
          >
            <m.div
              className="absolute inset-y-[-20%] w-1/3 rotate-12 bg-gradient-to-r from-transparent via-gold-300/20 to-transparent"
              initial={{ x: '-150%' }}
              animate={{ x: '420%' }}
              transition={{ duration: 1.8, delay: 1, ease: [0.45, 0, 0.2, 1] }}
            />
          </m.div>
        )}
      </m.div>

      {/* Nombre del perfume en escena, como el pie de foto de una campaña */}
      <m.p
        className="relative mt-2 text-center text-[0.65rem] tracking-[0.28em] text-smoke-300 uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
      >
        <Link
          to={productUrl}
          aria-label={`Ver ${bottle.name} de ${bottle.brand}`}
          className="inline-block px-3 py-1 transition-colors hover:text-gold-300"
        >
          <span className="block font-display text-lg tracking-[0.06em] text-ivory-50 normal-case">
            {bottle.name}
          </span>
          {bottle.brand}
        </Link>
      </m.p>
    </div>
  )
}
