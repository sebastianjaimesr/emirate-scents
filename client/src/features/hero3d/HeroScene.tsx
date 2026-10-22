import { ContactShadows, Environment, Float, Lightformer, Sparkles } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ACESFilmicToneMapping, MathUtils, type Group } from 'three'
import { FpsGuard } from '../scenes/FpsGuard'
import { PerfumeBottle } from './PerfumeBottle'

export interface HeroSceneProps {
  /** Progreso del scroll del hero: 0 arriba, 1 cuando el hero salió de la pantalla. */
  progress: MotionValue<number>
  /** Celulares y pantallas pequeñas: menos partículas, sombra fija y vidrio sencillo. */
  compact: boolean
  /** Se llama cuando el primer cuadro ya está dibujado (para el fundido de entrada). */
  onReady: () => void
  /** Se llama si el navegador pierde el contexto 3D (por falta de memoria, por ejemplo). */
  onContextLost: () => void
  /** Se llama si la escena va lenta en este dispositivo (ver FpsGuard). */
  onSlow: () => void
}

const CAMERA_Z = 8.2

/**
 * Escena 3D del hero, con un único <Canvas> en toda la tienda.
 * Este archivo se descarga aparte (import dinámico en HeroVisual): quien no ve el hero
 * o no tiene WebGL nunca descarga Three.js.
 */
export default function HeroScene({
  progress,
  compact,
  onReady,
  onContextLost,
  onSlow,
}: HeroSceneProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = useState(true)

  // Fuera de la pantalla la escena se pausa: no gasta batería ni procesador
  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapperRef} aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Canvas
        // El cursor se sigue en toda la página, no solo encima del frasco
        eventSource={document.body}
        eventPrefix="client"
        frameloop={onScreen ? 'always' : 'never'}
        // Resolución limitada: en pantallas de alta densidad, dibujar 3× no se nota y cuesta mucho
        dpr={compact ? 1 : [1, 1.6]}
        camera={{ position: [0, 0.35, CAMERA_Z], fov: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
          gl.domElement.addEventListener('webglcontextlost', onContextLost, { once: true })
          // Dos cuadros después, la escena ya está dibujada: se puede mostrar sin parpadeo
          requestAnimationFrame(() => requestAnimationFrame(onReady))
        }}
      >
        <FpsGuard onSlow={onSlow} />
        <Stage progress={progress} compact={compact} />
      </Canvas>
    </div>
  )
}

function Stage({ progress, compact }: Pick<HeroSceneProps, 'progress' | 'compact'>) {
  const bottleRef = useRef<Group>(null)

  useFrame((state, delta) => {
    const bottle = bottleRef.current
    if (!bottle) return
    const scroll = progress.get()

    // Al bajar, el frasco gira hasta casi media vuelta; al subir, deshace el giro.
    // El cursor añade una inclinación leve (en pantallas táctiles queda en el centro).
    const pointerX = compact ? 0 : MathUtils.clamp(state.pointer.x, -1.5, 1.5)
    const pointerY = compact ? 0 : MathUtils.clamp(state.pointer.y, -1, 1)
    const targetRotationY = -0.4 + scroll * Math.PI * 0.85 + pointerX * 0.25
    const targetRotationX = -pointerY * 0.08
    // damp = acercarse suavemente al objetivo: el movimiento nunca salta
    bottle.rotation.y = MathUtils.damp(bottle.rotation.y, targetRotationY, 4, delta)
    bottle.rotation.x = MathUtils.damp(bottle.rotation.x, targetRotationX, 4, delta)

    // La cámara se aleja y baja un poco con el scroll: el escenario "se despide"
    const camera = state.camera
    camera.position.z = MathUtils.damp(camera.position.z, CAMERA_Z + scroll * 2, 4, delta)
    camera.position.y = MathUtils.damp(camera.position.y, 0.35 + scroll * 0.9, 4, delta)
    camera.lookAt(0, -0.1, 0)
  })

  return (
    <>
      {/* Luz principal cálida desde arriba a la derecha y contraluz ámbar */}
      <ambientLight intensity={0.12} />
      {/* Relleno suave desde el frente izquierdo: la tapa dorada no queda en sombra total */}
      <directionalLight position={[-3, 2, 5]} intensity={0.8} color="#fff1d6" />
      <spotLight position={[3, 5, 4]} angle={0.35} penumbra={1} intensity={70} color="#f6dca0" />
      <pointLight position={[-2.5, 0.5, -2]} intensity={10} color="#b8762e" />

      {/*
        Reflejos: en lugar de descargar una foto HDR de un estudio (pesada y bloqueada por la
        política de seguridad), se arma un "estudio virtual" con paneles de luz. Se calcula
        una sola vez (frames=1).
      */}
      <Environment resolution={compact ? 64 : 128} frames={1}>
        <Lightformer
          form="rect"
          intensity={3}
          color="#f6e3b4"
          position={[0, 3.5, -3]}
          scale={[7, 1.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#c9a54e"
          position={[-4, 0.5, 1]}
          rotation-y={Math.PI / 2}
          scale={[3, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          color="#fff8ec"
          position={[4, 1, 1]}
          rotation-y={-Math.PI / 2}
          scale={[1.5, 5, 1]}
        />
      </Environment>

      <Float
        speed={1.1}
        rotationIntensity={0.12}
        floatIntensity={0.3}
        floatingRange={[-0.04, 0.07]}
      >
        <group ref={bottleRef} rotation-y={-0.4}>
          <PerfumeBottle simple={compact} />
        </group>
      </Float>

      {/* Pedestal de piedra oscura con filo dorado */}
      <group position-y={-1.22}>
        <mesh>
          <cylinderGeometry args={[0.95, 1, 0.12, 64]} />
          <meshStandardMaterial color="#15110d" roughness={0.38} metalness={0.25} />
        </mesh>
        <mesh position-y={0.061} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.95, 0.007, 8, 96]} />
          <meshStandardMaterial color="#c9a54e" metalness={1} roughness={0.25} />
        </mesh>
      </group>

      <ContactShadows
        position={[0, -1.158, 0]}
        scale={2.2}
        blur={2.6}
        far={1.6}
        opacity={0.75}
        resolution={compact ? 256 : 512}
        // En celulares la sombra se calcula una vez; en escritorio sigue la flotación del frasco
        frames={compact ? 1 : Infinity}
      />

      {/* Polvo dorado muy discreto */}
      <Sparkles
        count={compact ? 16 : 40}
        scale={[5, 4, 2.5]}
        position={[0, 0.2, -0.3]}
        size={compact ? 1.6 : 2}
        speed={0.22}
        opacity={0.55}
        noise={0.5}
        color="#e3c77d"
      />
    </>
  )
}
