import { MeshLambertMaterial, MeshStandardMaterial, type Material } from 'three'

export const GOLD = '#c9a54e'

/**
 * Material dorado de los hilos, filos y arcos.
 * - En escritorio es metal de verdad: refleja el "estudio virtual" de luces (Environment).
 * - En celulares no se calcula ese estudio (era lo que más frenaba la escena): el oro es un
 *   color cálido con brillo propio, que se ve parecido y cuesta mucho menos.
 */
export function createGoldMaterial(compact: boolean): Material {
  return compact
    ? new MeshLambertMaterial({ color: GOLD, emissive: '#6f5420', emissiveIntensity: 0.9 })
    : new MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.28 })
}
