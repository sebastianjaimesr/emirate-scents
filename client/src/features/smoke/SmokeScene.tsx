import { useFrame, useThree } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  ShaderMaterial,
  type Points,
} from 'three'
import { loadDisplayFont } from '../scenes/displayFont'
import { SceneCanvas, type SceneCallbacks } from '../scenes/SceneCanvas'
import { sampleNamePoints } from './textPoints'

export interface SmokeSceneProps extends SceneCallbacks {
  /** Nombres de los perfumes, en el orden de la sección. */
  names: string[]
  /** Color del humo para cada perfume (según su familia olfativa). */
  colors: string[]
  /** Progreso de la sección: 0 al empezar, 1 al terminar. */
  progress: MotionValue<number>
  compact: boolean
}

/**
 * Antes del primer nombre y después del último, la sección deja un tramo de humo suelto:
 * el nombre se forma al entrar y se deshace al salir. Medido en "perfumes".
 */
const EDGE = 0.45

/**
 * "Humo que forma el nombre": miles de partículas doradas que, al bajar la página, se
 * juntan para escribir el nombre de cada perfume y luego se deshacen en humo para formar el
 * siguiente. El cursor las aparta al pasar. Este archivo se descarga aparte.
 */
export default function SmokeScene({
  compact,
  onReady,
  onContextLost,
  onSlow,
  ...props
}: SmokeSceneProps) {
  return (
    <SceneCanvas
      compact={compact}
      camera={{ position: [0, 0, 10], fov: 35 }}
      onReady={onReady}
      onContextLost={onContextLost}
      onSlow={onSlow}
    >
      <Smoke compact={compact} {...props} />
    </SceneCanvas>
  )
}

function Smoke({ names, colors, progress, compact }: Omit<SmokeSceneProps, keyof SceneCallbacks>) {
  const count = compact ? 3200 : 8000
  const [targets, setTargets] = useState<Float32Array[]>()

  // Los puntos de cada nombre se calculan una vez, con la fuente de la marca ya descargada
  useEffect(() => {
    let cancelled = false
    void loadDisplayFont().then(() => {
      if (!cancelled)
        setTargets(names.map((name) => sampleNamePoints(name, count, compact ? 9 : 14)))
    })
    return () => {
      cancelled = true
    }
  }, [names, count, compact])

  if (!targets) return null
  return (
    <>
      <NameParticles targets={targets} colors={colors} progress={progress} compact={compact} />
      <Wisps colors={colors} progress={progress} count={compact ? 14 : 28} />
    </>
  )
}

/** true cuando el visitante ya movió el ratón (en táctil nunca). */
let pointerMoved = false
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', () => (pointerMoved = true), { once: true, passive: true })
}

/** Datos fijos de cada partícula: hacia dónde se dispersa, su ritmo y su tamaño. */
function useParticleSeeds(count: number) {
  return useMemo(() => createSeeds(count), [count])
}

function createSeeds(count: number) {
  {
    const scatter = new Float32Array(count * 3)
    const phase = new Float32Array(count)
    const speed = new Float32Array(count)
    const size = new Float32Array(count)
    const alpha = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // Nube aplanada, más ancha que alta, como humo que se extiende
      const angle = Math.random() * Math.PI * 2
      const radius = Math.sqrt(Math.random())
      scatter[i * 3] = Math.cos(angle) * radius * 1.3
      scatter[i * 3 + 1] = Math.sin(angle) * radius * 0.6
      scatter[i * 3 + 2] = (Math.random() - 0.5) * 2.5
      phase[i] = Math.random() * Math.PI * 2
      speed[i] = 2.2 + Math.random() * 3.2
      size[i] = 0.6 + Math.random() ** 3 * 2.2
      alpha[i] = 0.35 + Math.random() * 0.65
    }
    return { scatter, phase, speed, size, alpha }
  }
}

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uPixelRatio;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uScale * uPixelRatio / -mvPosition.z;
    vAlpha = aAlpha;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    // Punto redondo y difuso: más brillante y claro en el centro
    float distanceToCenter = length(gl_PointCoord - 0.5);
    float glow = pow(smoothstep(0.5, 0.0, distanceToCenter), 1.6);
    vec3 color = mix(uColor, vec3(1.0, 0.95, 0.85), glow * 0.45);
    gl_FragColor = vec4(color, glow * vAlpha * uOpacity);
  }
`

function useGlowMaterial(scale: number, opacity: number) {
  return useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: new Color('#c9a54e') },
          uOpacity: { value: opacity },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uScale: { value: scale },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [scale, opacity],
  )
}

/** Posición en "perfumes" a partir del progreso, con el tramo de humo en cada extremo. */
function itemPosition(progress: number, items: number) {
  return progress * (items - 1 + EDGE * 2) - EDGE
}

/** Color del humo entre dos perfumes. */
function blendColor(target: Color, colors: Color[], position: number) {
  const last = colors.length - 1
  const clamped = MathUtils.clamp(position, 0, last)
  const from = Math.floor(clamped)
  const to = Math.min(from + 1, last)
  return target.copy(colors[from]).lerp(colors[to], clamped - from)
}

function NameParticles({
  targets,
  colors,
  progress,
  compact,
}: {
  targets: Float32Array[]
  colors: string[]
  progress: MotionValue<number>
  compact: boolean
}) {
  const count = targets[0].length / 2
  const seeds = useParticleSeeds(count)
  const pointsRef = useRef<Points>(null)
  const material = useGlowMaterial(compact ? 34 : 30, 0.9)
  const palette = useMemo(() => colors.map((color) => new Color(color)), [colors])
  const viewport = useThree((state) => state.viewport)

  const geometry = useMemo(() => {
    const result = new BufferGeometry()
    // Empiezan dispersas en el humo
    const start = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) start[i] = seeds.scatter[i] * 4
    result.setAttribute('position', new BufferAttribute(start, 3))
    result.setAttribute('aSize', new BufferAttribute(seeds.size, 1))
    result.setAttribute('aAlpha', new BufferAttribute(seeds.alpha, 1))
    return result
  }, [count, seeds])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state, delta) => {
    const items = targets.length
    const position = itemPosition(progress.get(), items)
    // Qué tan "formado" está el nombre: 1 justo en un perfume, 0 a mitad de camino
    const nearest = Math.round(MathUtils.clamp(position, 0, items - 1))
    const offset = Math.abs(position - nearest)
    const formed = 1 - MathUtils.smoothstep(offset, 0.1, 0.42)
    const clamped = MathUtils.clamp(position, 0, items - 1)
    const from = Math.floor(clamped)
    const to = Math.min(from + 1, items - 1)
    const blend = MathUtils.smootherstep(clamped - from, 0, 1)
    const fromPoints = targets[from]
    const toPoints = targets[to]

    // Ancho del nombre: casi todo el ancho visible, sin pasar de cierta altura
    const textWidth = Math.min(viewport.width * 0.88, viewport.height * 1.9)
    const lift = viewport.height * 0.07
    const spread = (1 - formed) * Math.min(viewport.width, viewport.height * 1.6) * 0.5
    const time = state.clock.elapsedTime
    // Cursor en coordenadas de la escena (en táctil no se usa)
    const pointerX = (state.pointer.x * viewport.width) / 2
    const pointerY = (state.pointer.y * viewport.height) / 2
    // Hasta que el cursor se mueve, su posición es el centro: no se aparta nada
    const repel = compact || !pointerMoved ? 0 : 0.9

    const points = pointsRef.current
    if (!points) return
    const attribute = points.geometry.attributes.position
    const array = attribute.array as Float32Array
    const follow = 1 - Math.exp(-delta * 1)
    for (let i = 0; i < count; i++) {
      const i2 = i * 2
      const i3 = i * 3
      const phase = seeds.phase[i]
      const x = MathUtils.lerp(fromPoints[i2], toPoints[i2], blend) * textWidth
      const y = MathUtils.lerp(fromPoints[i2 + 1], toPoints[i2 + 1], blend) * textWidth + lift
      // Humo: cada partícula se aleja hacia su lugar en la nube y ondula despacio
      const swirl = time * 0.15 + phase
      let targetX = x + seeds.scatter[i3] * spread + Math.sin(swirl + y) * 0.18 * (1 - formed)
      let targetY = y + seeds.scatter[i3 + 1] * spread + Math.cos(swirl * 1.3 + x) * 0.12
      const targetZ = seeds.scatter[i3 + 2] * (0.15 + (1 - formed) * 1.2)
      // Brillo vivo cuando el nombre está formado
      targetX += Math.sin(time * 1.7 + phase) * 0.012
      targetY += Math.cos(time * 1.3 + phase) * 0.012

      if (repel > 0) {
        const dx = targetX - pointerX
        const dy = targetY - pointerY
        const distance = Math.hypot(dx, dy)
        if (distance < repel && distance > 0.0001) {
          const push = ((repel - distance) / repel) ** 2 * 0.6
          targetX += (dx / distance) * push
          targetY += (dy / distance) * push
        }
      }

      // Cada partícula alcanza su objetivo a su propio ritmo: el humo se arrastra
      const step = Math.min(1, follow * seeds.speed[i])
      array[i3] += (targetX - array[i3]) * step
      array[i3 + 1] += (targetY - array[i3 + 1]) * step
      array[i3 + 2] += (targetZ - array[i3 + 2]) * step
    }
    attribute.needsUpdate = true
    blendColor(
      (points.material as ShaderMaterial).uniforms.uColor.value as Color,
      palette,
      position,
    )
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}

/** Volutas grandes y tenues que se mueven despacio detrás del nombre. */
function Wisps({
  colors,
  progress,
  count,
}: {
  colors: string[]
  progress: MotionValue<number>
  count: number
}) {
  const material = useGlowMaterial(900, 0.05)
  const palette = useMemo(() => colors.map((color) => new Color(color)), [colors])
  const viewport = useThree((state) => state.viewport)
  const seeds = useParticleSeeds(count)
  const pointsRef = useRef<Points>(null)

  const geometry = useMemo(() => {
    const result = new BufferGeometry()
    result.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
    result.setAttribute('aSize', new BufferAttribute(seeds.size, 1))
    result.setAttribute('aAlpha', new BufferAttribute(seeds.alpha, 1))
    return result
  }, [count, seeds])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    const points = pointsRef.current
    if (!points) return
    const time = state.clock.elapsedTime
    const attribute = points.geometry.attributes.position
    const array = attribute.array as Float32Array
    for (let i = 0; i < count; i++) {
      const phase = seeds.phase[i]
      array[i * 3] =
        seeds.scatter[i * 3] * viewport.width * 0.5 + Math.sin(time * 0.05 + phase) * 1.2
      array[i * 3 + 1] =
        seeds.scatter[i * 3 + 1] * viewport.height * 0.9 + Math.cos(time * 0.04 + phase) * 0.6
      array[i * 3 + 2] = -2 + seeds.scatter[i * 3 + 2]
    }
    attribute.needsUpdate = true
    blendColor(
      (points.material as ShaderMaterial).uniforms.uColor.value as Color,
      palette,
      itemPosition(progress.get(), colors.length),
    )
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
