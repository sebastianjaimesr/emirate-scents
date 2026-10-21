import { Environment, Float, Lightformer, Sparkles } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AdditiveBlending,
  CubicBezierCurve3,
  CurvePath,
  DoubleSide,
  LineCurve3,
  MathUtils,
  MeshStandardMaterial,
  Shape,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Group,
  type SpotLight,
  type Texture,
} from 'three'
import { loadDisplayFont } from '../scenes/displayFont'
import { SceneCanvas, type SceneCallbacks } from '../scenes/SceneCanvas'
import { createPlaqueTexture, type PlaqueText } from './plaqueTexture'

export interface GalleryItem extends PlaqueText {
  id: string
  /** Foto real del producto (dirección completa). Sin foto, el pedestal muestra una placa. */
  imageUrl?: string
}

export interface GallerySceneProps extends SceneCallbacks {
  items: GalleryItem[]
  /** Progreso de la sección: 0 al empezar, 1 al terminar. */
  progress: MotionValue<number>
  compact: boolean
}

/** Distancia entre dos pedestales. */
const SPACING = 3.4
/** El suelo está en y = -1; la cara superior del pedestal, en y = 0. */
const FLOOR_Y = -1
const WALL_Z = -2.3
const INK = '#0e0c0a'
const GOLD = '#c9a54e'

/**
 * "Galería con pedestales": una sala oscura con nichos en arco (el motivo de la marca) y un
 * pedestal iluminado por perfume. Al bajar la página, la cámara camina de un pedestal al
 * siguiente. Cada pedestal muestra la foto real del perfume o, si todavía no hay foto, una
 * placa grabada con su nombre. Este archivo se descarga aparte.
 */
export default function GalleryScene({
  compact,
  onReady,
  onContextLost,
  ...props
}: GallerySceneProps) {
  return (
    <SceneCanvas
      compact={compact}
      camera={{ position: [0, 0.6, 6], fov: 38 }}
      onReady={onReady}
      onContextLost={onContextLost}
    >
      <fog attach="fog" args={[INK, 7, 17]} />
      <Gallery compact={compact} {...props} />
    </SceneCanvas>
  )
}

function Gallery({ items, progress, compact }: Omit<GallerySceneProps, keyof SceneCallbacks>) {
  const spotRef = useRef<SpotLight>(null)
  const size = useThree((state) => state.size)
  const portrait = size.width / size.height < 0.9
  const length = (items.length - 1) * SPACING

  useFrame((state, delta) => {
    const position = progress.get() * (items.length - 1)
    const x = position * SPACING
    // Entre dos pedestales la cámara se aparta un poco, como quien camina por la sala
    const walk = Math.sin((position % 1) * Math.PI)
    const pointerX = compact ? 0 : MathUtils.clamp(state.pointer.x, -1, 1)
    const pointerY = compact ? 0 : MathUtils.clamp(state.pointer.y, -1, 1)
    const baseZ = portrait ? 7.4 : 5.4
    const camera = state.camera
    camera.position.x = MathUtils.damp(camera.position.x, x + pointerX * 0.35, 3, delta)
    camera.position.y = MathUtils.damp(camera.position.y, 0.55 + pointerY * 0.15, 3, delta)
    camera.position.z = MathUtils.damp(camera.position.z, baseZ + walk * 0.6, 3, delta)
    camera.lookAt(camera.position.x - pointerX * 0.25, 0.2, 0)

    // El foco principal sigue al pedestal que está al frente
    const spot = spotRef.current
    if (spot) {
      spot.position.x = MathUtils.damp(spot.position.x, x, 4, delta)
      spot.target.position.x = spot.position.x
      spot.target.updateMatrixWorld()
    }
  })

  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[-2, 3, 5]} intensity={0.35} color="#fff1d6" />
      <spotLight
        ref={spotRef}
        position={[0, 4.2, 1.6]}
        angle={0.42}
        penumbra={0.9}
        intensity={compact ? 45 : 60}
        distance={12}
        color="#f6dca0"
      />

      {/* Reflejos del oro: un "estudio virtual" de paneles de luz, calculado una sola vez */}
      <Environment resolution={compact ? 64 : 128} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.5}
          color="#f6e3b4"
          position={[0, 4, 2]}
          scale={[8, 1.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          color={GOLD}
          position={[-4, 1, 2]}
          rotation-y={Math.PI / 2}
          scale={[3, 5, 1]}
        />
      </Environment>

      <Room length={length} />
      {items.map((item, index) => (
        <Pedestal
          key={item.id}
          item={item}
          index={index}
          progress={progress}
          count={items.length}
        />
      ))}

      <Sparkles
        count={compact ? 30 : 70}
        scale={[length + SPACING * 2, 3, 3]}
        position={[length / 2, 1, 0]}
        size={compact ? 1.6 : 2}
        speed={0.2}
        opacity={0.5}
        noise={0.4}
        color="#e3c77d"
      />
    </>
  )
}

/** Suelo, pared y un nicho en arco detrás de cada pedestal. */
function Room({ length }: { length: number }) {
  const width = length + 40
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[length / 2, FLOOR_Y, 0]}>
        <planeGeometry args={[width, 30]} />
        <meshStandardMaterial color="#0d0b09" roughness={0.55} metalness={0.3} />
      </mesh>
      <mesh position={[length / 2, 2, WALL_Z]}>
        <planeGeometry args={[width, 8]} />
        <meshStandardMaterial color="#110e0b" roughness={0.95} />
      </mesh>
    </group>
  )
}

/** Arco apuntado de ancho `width` y alto `height`, con la base en y = 0. */
function archShape(width: number, height: number) {
  const half = width / 2
  const shoulder = height - width * 0.55
  const shape = new Shape()
  shape.moveTo(-half, 0)
  shape.lineTo(-half, shoulder)
  shape.bezierCurveTo(-half, height - width * 0.22, -width * 0.2, height - width * 0.06, 0, height)
  shape.bezierCurveTo(
    width * 0.2,
    height - width * 0.06,
    half,
    height - width * 0.22,
    half,
    shoulder,
  )
  shape.lineTo(half, 0)
  return shape
}

function archCurve(width: number, height: number) {
  const half = width / 2
  const shoulder = height - width * 0.55
  const v = (x: number, y: number) => new Vector3(x, y, 0)
  const path = new CurvePath<Vector3>()
  path.add(new LineCurve3(v(-half, 0), v(-half, shoulder)))
  path.add(
    new CubicBezierCurve3(
      v(-half, shoulder),
      v(-half, height - width * 0.22),
      v(-width * 0.2, height - width * 0.06),
      v(0, height),
    ),
  )
  path.add(
    new CubicBezierCurve3(
      v(0, height),
      v(width * 0.2, height - width * 0.06),
      v(half, height - width * 0.22),
      v(half, shoulder),
    ),
  )
  path.add(new LineCurve3(v(half, shoulder), v(half, 0)))
  return path
}

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    // Haz de luz: intenso cerca del foco, se desvanece hacia el suelo
    float alpha = pow(vUv.y, 1.4) * 0.16 * uIntensity;
    gl_FragColor = vec4(uColor, alpha);
  }
`
const poolFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    // Charco de luz en el suelo: círculo difuso
    float d = length(vUv - 0.5) * 2.0;
    float alpha = pow(smoothstep(1.0, 0.0, d), 2.0) * 0.35 * uIntensity;
    gl_FragColor = vec4(uColor, alpha);
  }
`

function useLightMaterial(fragmentShader: string) {
  return useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader,
        uniforms: { uColor: { value: new Vector3(0.96, 0.86, 0.63) }, uIntensity: { value: 0.4 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        fog: false,
      }),
    [fragmentShader],
  )
}

function Pedestal({
  item,
  index,
  progress,
  count,
}: {
  item: GalleryItem
  index: number
  progress: MotionValue<number>
  count: number
}) {
  const x = index * SPACING
  const beam = useLightMaterial(beamFragment)
  const pool = useLightMaterial(poolFragment)
  const gemRef = useRef<Group>(null)
  const niche = useMemo(() => archShape(2, 3.3), [])
  const outline = useMemo(() => archCurve(2, 3.3), [])
  const gold = useMemo(
    () => new MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.28 }),
    [],
  )

  useEffect(
    () => () => {
      beam.dispose()
      pool.dispose()
      gold.dispose()
    },
    [beam, pool, gold],
  )

  useFrame((_, delta) => {
    // El pedestal al frente se ilumina; los demás quedan en penumbra
    const distance = Math.abs(progress.get() * (count - 1) - index)
    const light = 0.25 + 0.75 * (1 - MathUtils.smoothstep(distance, 0, 1))
    for (const material of [beam, pool]) {
      const uniform = material.uniforms.uIntensity
      uniform.value = MathUtils.damp(uniform.value as number, light, 5, delta)
    }
    if (gemRef.current) gemRef.current.rotation.y += delta * 0.5
  })

  return (
    <group position-x={x}>
      {/* Nicho en arco en la pared, con filo dorado */}
      <mesh position={[0, FLOOR_Y, WALL_Z + 0.01]}>
        <shapeGeometry args={[niche, 24]} />
        <meshStandardMaterial color="#1a1511" roughness={0.9} />
      </mesh>
      <mesh position={[0, FLOOR_Y, WALL_Z + 0.03]} material={gold}>
        <tubeGeometry args={[outline, 96, 0.014, 6, false]} />
      </mesh>

      {/* Pedestal de piedra oscura con zócalo y filo dorado */}
      <mesh position-y={-0.5}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#17130f" roughness={0.42} metalness={0.2} />
      </mesh>
      <mesh position-y={-0.012} material={gold}>
        <boxGeometry args={[1.03, 0.024, 1.03]} />
      </mesh>
      <mesh position-y={FLOOR_Y + 0.04}>
        <boxGeometry args={[1.14, 0.08, 1.14]} />
        <meshStandardMaterial color="#120f0c" roughness={0.5} />
      </mesh>

      {/* Haz de luz desde el techo y charco de luz en el suelo */}
      <mesh position-y={1.6} material={beam}>
        <coneGeometry args={[1, 5.2, 40, 1, true]} />
      </mesh>
      <mesh position-y={FLOOR_Y + 0.005} rotation-x={-Math.PI / 2} material={pool}>
        <planeGeometry args={[3, 3]} />
      </mesh>

      <Exhibit item={item} gemRef={gemRef} gold={gold} />
    </group>
  )
}

/** Lo que va sobre el pedestal: la foto real o, sin foto, la placa grabada. */
function Exhibit({
  item,
  gemRef,
  gold,
}: {
  item: GalleryItem
  gemRef: React.RefObject<Group | null>
  gold: MeshStandardMaterial
}) {
  const photo = usePhoto(item.imageUrl)
  const [plaque, setPlaque] = useState<Texture>()

  useEffect(() => {
    if (photo) return
    let texture: Texture | undefined
    let cancelled = false
    void Promise.all([
      loadDisplayFont(),
      document.fonts.load('600 28px "Manrope Variable"').catch(() => undefined),
    ]).then(() => {
      if (cancelled) return
      texture = createPlaqueTexture(item)
      setPlaque(texture)
    })
    return () => {
      cancelled = true
      texture?.dispose()
    }
  }, [item, photo])

  if (photo) {
    const image = photo.image as { width: number; height: number }
    const height = 1.6
    const width = (height * image.width) / image.height
    return (
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25} floatingRange={[0, 0.08]}>
        <group position-y={0.95}>
          <mesh position-z={-0.012} material={gold}>
            <planeGeometry args={[width + 0.06, height + 0.06]} />
          </mesh>
          <mesh>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={photo} toneMapped={false} />
          </mesh>
        </group>
      </Float>
    )
  }

  return (
    <group>
      {/* Placa inclinada hacia quien mira, como en un museo. Aparece cuando su texto está listo */}
      {plaque && (
        <group position={[0, 0.36, 0.05]} rotation-x={-0.18}>
          <mesh>
            <boxGeometry args={[1.12, 0.7, 0.05]} />
            <meshStandardMaterial attach="material-0" color="#17130f" />
            <meshStandardMaterial attach="material-1" color="#17130f" />
            <meshStandardMaterial attach="material-2" color="#17130f" />
            <meshStandardMaterial attach="material-3" color="#17130f" />
            <meshStandardMaterial
              attach="material-4"
              map={plaque}
              roughness={0.6}
              emissiveMap={plaque}
              emissive="#ffffff"
              emissiveIntensity={0.35}
            />
            <meshStandardMaterial attach="material-5" color="#17130f" />
          </mesh>
        </group>
      )}
      {/* Gema dorada que gira despacio sobre la placa: un adorno, no un producto */}
      <Float speed={1.4} floatIntensity={0.4} floatingRange={[0, 0.1]}>
        <group ref={gemRef} position-y={1.05}>
          <mesh scale={[0.16, 0.24, 0.16]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={GOLD}
              metalness={0.9}
              roughness={0.22}
              emissive="#6f5420"
              emissiveIntensity={0.7}
            />
          </mesh>
        </group>
      </Float>
    </group>
  )
}

/** Descarga la foto del perfume. Si no hay foto o falla, devuelve undefined (se usa la placa). */
function usePhoto(url?: string) {
  const [texture, setTexture] = useState<Texture>()
  useEffect(() => {
    if (!url) return
    let loaded: Texture | undefined
    let cancelled = false
    const loader = new TextureLoader()
    // La foto puede venir de otro dominio (la API): sin esto, WebGL no puede usarla
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (result) => {
        result.colorSpace = SRGBColorSpace
        loaded = result
        if (cancelled) result.dispose()
        else setTexture(result)
      },
      undefined,
      () => {
        // Sin la foto, la placa ocupa su lugar
      },
    )
    return () => {
      cancelled = true
      loaded?.dispose()
    }
  }, [url])
  return texture
}
