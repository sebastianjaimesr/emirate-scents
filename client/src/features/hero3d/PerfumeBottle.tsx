import { useMemo } from 'react'
import { LatheGeometry, Vector2 } from 'three'

/*
  Frasco genérico creado por código. NO representa ningún perfume real ni lleva marca:
  es una pieza escultórica para el escenario del hero.

  Cada pieza se obtiene "torneando" un perfil (como en un torno de alfarero): una lista de
  puntos [radio, altura] que gira alrededor del eje vertical. Con solo 8 lados, el vidrio
  queda facetado como un frasco tallado, y cada cara refleja la luz por separado.
*/
const FACETS = 8

type Profile = [radius: number, height: number][]

/** Cuerpo de vidrio: base ancha, hombros suaves y cuello corto. */
const glassProfile: Profile = [
  [0, -1],
  [0.6, -1],
  [0.68, -0.95],
  [0.73, -0.78],
  [0.75, -0.2],
  [0.7, 0.15],
  [0.55, 0.35],
  [0.3, 0.45],
  [0.18, 0.5],
  [0.18, 0.64],
  [0, 0.64],
]

/** Perfume dentro del frasco: la misma forma, más pequeña, llena hasta un poco más de la mitad. */
const liquidProfile: Profile = [
  [0, -0.93],
  [0.6, -0.93],
  [0.66, -0.78],
  [0.67, -0.25],
  [0, -0.25],
]

/** Tapa dorada alta, con remate de cúpula (eco de los minaretes). */
const capProfile: Profile = [
  [0, 0.68],
  [0.27, 0.68],
  [0.29, 0.74],
  [0.21, 1.02],
  [0.26, 1.12],
  [0.24, 1.18],
  [0.11, 1.34],
  [0.02, 1.42],
  [0, 1.42],
]

/** Crea una geometría de revolución (como un torno): gira un perfil 2D alrededor del eje vertical. */
function lathe(profile: Profile, segments = FACETS) {
  return new LatheGeometry(
    profile.map(([radius, height]) => new Vector2(radius, height)),
    segments,
  )
}

/**
 * Frasco de perfume 3D hecho con geometrías de revolución: vidrio, líquido y tapa. simple=true usa materiales más livianos.
 */
export function PerfumeBottle({ simple = false }: { simple?: boolean }) {
  const glass = useMemo(() => lathe(glassProfile), [])
  const liquid = useMemo(() => lathe(liquidProfile), [])
  const cap = useMemo(() => lathe(capProfile), [])

  return (
    // El frasco mide 2.42 de alto; se baja un poco para que quede centrado sobre el pedestal
    <group position-y={-0.14}>
      <mesh geometry={liquid}>
        <meshStandardMaterial
          color="#c98d38"
          emissive="#6b3a0c"
          emissiveIntensity={0.25}
          roughness={0.25}
          flatShading
        />
      </mesh>

      <mesh geometry={glass}>
        {simple ? (
          // En celulares: vidrio satinado sencillo, sin el cálculo de refracción
          <meshPhysicalMaterial
            color="#dcc59b"
            transparent
            opacity={0.6}
            roughness={0.35}
            metalness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={1.2}
            flatShading
          />
        ) : (
          <meshPhysicalMaterial
            color="#fff6e6"
            transmission={1}
            thickness={0.9}
            ior={1.5}
            roughness={0.04}
            attenuationColor="#d39a45"
            attenuationDistance={3}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={1.1}
            flatShading
          />
        )}
      </mesh>

      {/* Anillo dorado del cuello */}
      <mesh position-y={0.66}>
        <cylinderGeometry args={[0.24, 0.24, 0.05, FACETS * 4]} />
        <meshStandardMaterial color="#c9a54e" metalness={1} roughness={0.2} />
      </mesh>

      <mesh geometry={cap}>
        <meshStandardMaterial color="#c9a54e" metalness={1} roughness={0.24} flatShading />
      </mesh>
    </group>
  )
}
