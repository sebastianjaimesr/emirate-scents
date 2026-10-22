import { AnimatePresence, m, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Logo } from '../../components/brand/Logo'
import { isLowPower, markLowPower } from '../scenes/lowPower'
import { SceneErrorBoundary } from './SceneErrorBoundary'
import { supportsWebGL, whenIdle } from './webgl'

const HeroScene = lazy(() => import('./HeroScene'))

const ease = [0.22, 1, 0.36, 1] as const

/** Arco apuntado en un lienzo de 300 × 400 (proporción 3:4). */
function archPath(inset: number) {
  const left = inset
  const right = 300 - inset
  const width = right - left
  const top = inset * 1.1
  return `M${left},400 L${left},${top + width * 0.5} C${left},${top + width * 0.22} ${left + width * 0.3},${top + width * 0.07} 150,${top} C${right - width * 0.3},${top + width * 0.07} ${right},${top + width * 0.22} ${right},${top + width * 0.5} L${right},400`
}

/** Pantallas pequeñas o táctiles: la escena 3D usa su versión ligera. */
function isCompactScreen() {
  return window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
}

/**
 * Parte visual del hero.
 * - Siempre dibuja los arcos dorados (el "mihrab" de la marca), con parallax.
 * - Si el navegador tiene WebGL y no pide reducir movimiento, descarga la escena 3D cuando
 *   la página ya está visible y la funde dentro del arco: el frasco queda enmarcado por él.
 * - Si la escena va lenta en este dispositivo, se apaga y se activa el modo ligero.
 * - Mientras tanto, o si el 3D no está disponible o falla, se ve el logo: la composición
 *   de reserva, que ya era la del hero original.
 */
export function HeroVisual({ progress }: { progress: MotionValue<number> }) {
  const prefersReducedMotion = useReducedMotion()
  const [show3d, setShow3d] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [compact] = useState(isCompactScreen)

  useEffect(() => {
    // Modo ligero: en esta visita las escenas 3D ya fueron lentas en este dispositivo
    if (prefersReducedMotion || isLowPower() || !supportsWebGL()) return
    return whenIdle(() => setShow3d(true))
  }, [prefersReducedMotion])

  const fallBack = () => {
    setShow3d(false)
    setSceneReady(false)
  }

  // Cada capa se desplaza a una velocidad distinta al hacer scroll (profundidad)
  const archesY = useTransform(progress, [0, 1], ['0%', prefersReducedMotion ? '0%' : '8%'])
  const logoY = useTransform(progress, [0, 1], ['0%', prefersReducedMotion ? '0%' : '18%'])
  const sceneOpacity = useTransform(progress, [0, 0.85], [1, prefersReducedMotion ? 1 : 0.2])

  return (
    <div
      data-hero-visual={sceneReady ? '3d' : 'reserva'}
      className="relative mx-auto w-full max-w-[17rem] sm:max-w-sm lg:order-2 lg:max-w-md"
    >
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

      <AnimatePresence>
        {!sceneReady && (
          <m.div
            key="logo"
            style={{ y: logoY }}
            className="absolute inset-x-[14%] top-[20%]"
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.8, ease } }}
          >
            <m.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, delay: 0.5, ease }}
            >
              <Logo priority className="w-full drop-shadow-[0_0_40px_rgb(201_165_78/0.18)]" />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {show3d && (
        // El lienzo es más grande que el arco para que la luz y el polvo dorado no se corten
        <m.div
          className="absolute -inset-x-[30%] -top-[12%] -bottom-[6%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: sceneReady ? 1 : 0 }}
          transition={{ duration: 1.6, ease }}
        >
          <m.div className="absolute inset-0" style={{ opacity: sceneOpacity }}>
            <SceneErrorBoundary onError={fallBack}>
              <Suspense fallback={null}>
                <HeroScene
                  progress={progress}
                  compact={compact}
                  onReady={() => setSceneReady(true)}
                  onContextLost={fallBack}
                  onSlow={() => {
                    markLowPower()
                    fallBack()
                  }}
                />
              </Suspense>
            </SceneErrorBoundary>
          </m.div>
        </m.div>
      )}
    </div>
  )
}
