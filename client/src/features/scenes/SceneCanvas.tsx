import { Canvas, type CanvasProps } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ACESFilmicToneMapping } from 'three'

export interface SceneCallbacks {
  /** Se llama cuando el primer cuadro ya está dibujado (para el fundido de entrada). */
  onReady: () => void
  /** Se llama si el navegador pierde el contexto 3D (por falta de memoria, por ejemplo). */
  onContextLost: () => void
}

interface SceneCanvasProps extends SceneCallbacks {
  compact: boolean
  camera: CanvasProps['camera']
  children: React.ReactNode
}

/**
 * Lienzo 3D común a las secciones del inicio. Solo lo importan las escenas, que se
 * descargan aparte: quien no tiene WebGL o pide reducir movimiento nunca descarga Three.js.
 * - Fuera de la pantalla se pausa: no gasta batería ni procesador.
 * - La resolución está limitada: en pantallas de alta densidad, dibujar 3× no se nota.
 */
export function SceneCanvas({
  compact,
  camera,
  onReady,
  onContextLost,
  children,
}: SceneCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = useState(true)
  // Al desmontarse, el lienzo libera su contexto 3D a propósito (dispara "contexto perdido").
  // Eso no es un fallo: solo cuenta si el contexto se pierde mientras la escena está en uso
  // (useLayoutEffect: su limpieza corre antes que la del lienzo, que es quien libera el contexto)
  const unmounted = useRef(false)
  useLayoutEffect(() => {
    unmounted.current = false
    return () => {
      unmounted.current = true
    }
  }, [])

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapperRef} aria-hidden="true" className="absolute inset-0">
      <Canvas
        // El cursor se sigue en toda la página, no solo encima del lienzo
        eventSource={document.body}
        eventPrefix="client"
        frameloop={onScreen ? 'always' : 'never'}
        dpr={[1, compact ? 1.25 : 1.6]}
        camera={camera}
        gl={{ antialias: !compact, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.domElement.addEventListener(
            'webglcontextlost',
            () => {
              if (!unmounted.current) onContextLost()
            },
            { once: true },
          )
          // Dos cuadros después, la escena ya está dibujada: se puede mostrar sin parpadeo
          requestAnimationFrame(() => requestAnimationFrame(onReady))
        }}
      >
        {children}
      </Canvas>
    </div>
  )
}
