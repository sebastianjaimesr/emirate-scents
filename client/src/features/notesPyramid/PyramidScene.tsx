import { Environment, Html, Lightformer, Sparkles } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import {
  Color,
  MathUtils,
  MeshStandardMaterial,
  Vector3,
  type Group,
  type Material,
  type Mesh,
} from 'three'
import type { OlfactoryNotes } from '../../types/product'
import { createGoldMaterial, GOLD } from '../scenes/goldMaterial'
import { SceneCanvas, type SceneCallbacks } from '../scenes/SceneCanvas'
import { noteAngles, tiers } from './tiers'

export interface PyramidItem {
  id: string
  notes: OlfactoryNotes
  /** Color de la familia olfativa: tiñe la luz de la cúspide. */
  color: string
}

export interface PyramidSceneProps extends SceneCallbacks {
  items: PyramidItem[]
  /** Progreso de la sección: 0 al empezar, 1 al terminar. */
  progress: MotionValue<number>
  compact: boolean
}

/** Altura y radio de cada piso (salida, corazón, fondo) y de la cúspide. */
const TIER_Y = [1.15, 0.05, -1.05]
const TIER_RADIUS = [0.85, 1.45, 2.05]
const APEX_Y = 2.15
const EDGES = 6

/**
 * "Pirámide olfativa": las notas de cada perfume flotan en tres pisos de una pirámide de
 * hilos dorados. Arriba las de salida, en el centro las de corazón y abajo las de fondo.
 * Al bajar la página, la pirámide gira y las notas del perfume siguiente toman su lugar.
 * No dibuja frascos: solo las notas registradas en el catálogo. Se descarga aparte.
 */
export default function PyramidScene({
  compact,
  onReady,
  onContextLost,
  onSlow,
  ...props
}: PyramidSceneProps) {
  return (
    <SceneCanvas
      compact={compact}
      camera={{ position: [0, 0.6, 8.5], fov: 38 }}
      onReady={onReady}
      onContextLost={onContextLost}
      onSlow={onSlow}
    >
      <Pyramid compact={compact} {...props} />
    </SceneCanvas>
  )
}

function Pyramid({ items, progress, compact }: Omit<PyramidSceneProps, keyof SceneCallbacks>) {
  const rootRef = useRef<Group>(null)
  const apexRef = useRef<Mesh>(null)
  const viewport = useThree((state) => state.viewport)
  const wide = viewport.aspect > 1.1
  const gold = useMemo(() => createGoldMaterial(compact), [compact])
  const apexColor = useMemo(() => new Color(), [])
  const palette = useMemo(() => items.map((item) => new Color(item.color)), [items])
  useEffect(() => () => gold.dispose(), [gold])

  // En pantallas anchas la pirámide va a la derecha (el texto ocupa la izquierda); en
  // celulares, en el centro y más pequeña (el título va arriba y las notas abajo)
  const scale = wide ? Math.min(1, viewport.height / 6.2) : Math.min(0.7, viewport.width / 5.6)
  const offsetX = wide ? viewport.width * 0.2 : 0
  const offsetY = wide ? -0.1 : -viewport.height * 0.03

  useFrame((state, delta) => {
    const position = progress.get() * (items.length - 1)
    const root = rootRef.current
    if (root) {
      // Gira con el scroll y un poco con el cursor
      const pointerX = compact ? 0 : MathUtils.clamp(state.pointer.x, -1, 1)
      root.rotation.y = MathUtils.damp(
        root.rotation.y,
        position * Math.PI * 0.8 + pointerX * 0.3,
        3,
        delta,
      )
    }
    const apex = apexRef.current
    if (apex) {
      const clamped = MathUtils.clamp(position, 0, items.length - 1)
      const from = Math.floor(clamped)
      const to = Math.min(from + 1, items.length - 1)
      apexColor.copy(palette[from]).lerp(palette[to], clamped - from)
      ;(apex.material as MeshStandardMaterial).emissive.copy(apexColor)
      apex.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.08)
    }
  })

  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 3, 3]} intensity={18} color="#f6dca0" />
      {/* Reflejos del oro (solo en escritorio; ver createGoldMaterial) */}
      {!compact && (
        <Environment resolution={128} frames={1}>
          <Lightformer
            form="rect"
            intensity={2.5}
            color="#f6e3b4"
            position={[0, 4, 2]}
            scale={[8, 1.2, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            color={GOLD}
            position={[-4, 0, 2]}
            rotation-y={Math.PI / 2}
            scale={[3, 5, 1]}
          />
        </Environment>
      )}

      <group position={[offsetX, offsetY, 0]} scale={scale}>
        <group ref={rootRef}>
          <Frame gold={gold} />
          <mesh ref={apexRef} position-y={APEX_Y}>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshStandardMaterial
              color="#fff2cc"
              emissive={GOLD}
              emissiveIntensity={2.5}
              toneMapped={false}
            />
          </mesh>
          {items.map((item, index) => (
            <NoteSet
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              progress={progress}
              compact={compact}
            />
          ))}
        </group>
        {tiers.map((tier, index) => (
          <Sparkles
            key={tier.key}
            count={compact ? 14 : 30}
            scale={[TIER_RADIUS[index] * 2.2, 0.35, TIER_RADIUS[index] * 2.2]}
            position-y={TIER_Y[index]}
            size={compact ? 1.8 : 2.4}
            speed={0.3}
            opacity={0.6}
            color={tier.color}
          />
        ))}
      </group>
    </>
  )
}

/** Hilos dorados: un anillo por piso y aristas desde la cúspide hasta la base. */
function Frame({ gold }: { gold: Material }) {
  const edges = useMemo(() => {
    const apex = new Vector3(0, APEX_Y, 0)
    const baseY = TIER_Y[2] - 0.25
    const baseRadius =
      TIER_RADIUS[2] + 0.25 * ((TIER_RADIUS[2] - TIER_RADIUS[1]) / (TIER_Y[1] - TIER_Y[2]))
    return Array.from({ length: EDGES }, (_, index) => {
      const angle = (index / EDGES) * Math.PI * 2
      const end = new Vector3(Math.cos(angle) * baseRadius, baseY, Math.sin(angle) * baseRadius)
      const middle = apex.clone().add(end).multiplyScalar(0.5)
      const length = apex.distanceTo(end)
      const direction = end.clone().sub(apex).normalize()
      return { middle, length, direction }
    })
  }, [])

  return (
    <group>
      {tiers.map((tier, index) => (
        <mesh key={tier.key} position-y={TIER_Y[index]} rotation-x={Math.PI / 2} material={gold}>
          <torusGeometry args={[TIER_RADIUS[index], 0.008, 6, 128]} />
        </mesh>
      ))}
      {edges.map((edge, index) => (
        <Edge key={index} {...edge} gold={gold} />
      ))}
    </group>
  )
}

function Edge({
  middle,
  length,
  direction,
  gold,
}: {
  middle: Vector3
  length: number
  direction: Vector3
  gold: Material
}) {
  const ref = useRef<Mesh>(null)
  useEffect(() => {
    // El cilindro nace vertical: se orienta a lo largo de la arista
    ref.current?.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction)
  }, [direction])
  return (
    <mesh ref={ref} position={middle} material={gold}>
      <cylinderGeometry args={[0.005, 0.005, length, 4]} />
    </mesh>
  )
}

/**
 * Las notas de un perfume. Solo se ven cuando ese perfume está al frente: al alejarse, se
 * encogen hasta desaparecer y las del siguiente crecen en su lugar.
 */
function NoteSet({
  item,
  index,
  total,
  progress,
  compact,
}: {
  item: PyramidItem
  index: number
  total: number
  progress: MotionValue<number>
  compact: boolean
}) {
  const groupRef = useRef<Group>(null)
  const tierRefs = useRef<(Group | null)[]>([])
  // Los nombres de las notas se colocan junto al lienzo. Sin esto irían al <body> (el lienzo
  // escucha el cursor en toda la página) y quedarían fuera de la sección
  const gl = useThree((state) => state.gl)
  const portal = useMemo(() => ({ current: gl.domElement.parentElement! }), [gl])
  // Los nombres son HTML: no se encogen con la escena, así que se desvanecen aparte
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const distance = Math.abs(progress.get() * (total - 1) - index)
    const visible = 1 - MathUtils.smoothstep(distance, 0.12, 0.5)
    group.scale.setScalar(MathUtils.damp(group.scale.x, Math.max(visible, 0.0001), 8, delta))
    group.visible = group.scale.x > 0.01
    const labelOpacity = String(MathUtils.clamp((visible - 0.4) / 0.5, 0, 1))
    for (const label of labelRefs.current) {
      if (label && label.style.opacity !== labelOpacity) label.style.opacity = labelOpacity
    }
    // Los pisos giran en sentidos opuestos, despacio
    tierRefs.current.forEach((tier, tierIndex) => {
      if (tier) tier.rotation.y += delta * (tierIndex % 2 === 0 ? 0.08 : -0.06)
    })
  })

  return (
    <group ref={groupRef} scale={0.0001}>
      {tiers.map((tier, tierIndex) => {
        const notes = item.notes[tier.key]
        const angles = noteAngles(notes.length, tierIndex)
        const firstLabel = tiers
          .slice(0, tierIndex)
          .reduce((sum, previous) => sum + item.notes[previous.key].length, 0)
        return (
          <group
            key={tier.key}
            ref={(element) => {
              tierRefs.current[tierIndex] = element
            }}
            position-y={TIER_Y[tierIndex]}
          >
            {notes.map((note, noteIndex) => {
              const angle = angles[noteIndex]
              const radius = TIER_RADIUS[tierIndex]
              return (
                <group
                  key={note}
                  position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
                >
                  <mesh>
                    <sphereGeometry args={[compact ? 0.09 : 0.075, 20, 20]} />
                    <meshStandardMaterial
                      color={tier.color}
                      emissive={tier.color}
                      emissiveIntensity={1.6}
                      toneMapped={false}
                    />
                  </mesh>
                  <Html
                    portal={portal}
                    center
                    distanceFactor={7}
                    zIndexRange={[10, 0]}
                    style={{ pointerEvents: 'none' }}
                  >
                    <span
                      ref={(element) => {
                        labelRefs.current[firstLabel + noteIndex] = element
                      }}
                      style={{ opacity: 0 }}
                      className="block translate-y-5 text-[0.8rem] font-semibold tracking-[0.12em] whitespace-nowrap text-ivory-50 uppercase [text-shadow:0_1px_8px_rgb(0_0_0/0.9)]"
                    >
                      {note}
                    </span>
                  </Html>
                </group>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}
