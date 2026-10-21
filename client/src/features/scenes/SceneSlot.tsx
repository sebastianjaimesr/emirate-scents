import { m } from 'motion/react'
import { Suspense, useRef, useState, type ReactNode } from 'react'
import { SceneErrorBoundary } from '../hero3d/SceneErrorBoundary'
import { useNearViewport } from './useNearViewport'

/**
 * Hueco donde se monta una escena 3D descargada aparte (React.lazy).
 * - La escena solo se crea cuando la sección está cerca de la pantalla y se destruye
 *   cuando se aleja.
 * - Aparece con un fundido cuando su primer cuadro está listo.
 * - Si falla al descargarse o al dibujarse, llama a `onError`: la sección pasa a su
 *   versión estática y el resto de la tienda sigue funcionando.
 */
export function SceneSlot({
  onError,
  children,
}: {
  onError: () => void
  children: (callbacks: { onReady: () => void; onContextLost: () => void }) => ReactNode
}) {
  const slotRef = useRef<HTMLDivElement>(null)
  const near = useNearViewport(slotRef)
  const [ready, setReady] = useState(false)
  // Al alejarse, la escena se destruye: la próxima vez vuelve a aparecer con fundido
  if (!near && ready) setReady(false)

  return (
    <div ref={slotRef} className="absolute inset-0">
      {near && (
        <m.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          data-scene-ready={ready ? 'si' : 'no'}
        >
          <SceneErrorBoundary onError={onError}>
            <Suspense fallback={null}>
              {children({ onReady: () => setReady(true), onContextLost: onError })}
            </Suspense>
          </SceneErrorBoundary>
        </m.div>
      )}
    </div>
  )
}
