import { useId } from 'react'

/*
  Ilustración de un frasco genérico en línea dorada, para la vitrina mientras un producto no
  tiene fotografía. Es un dibujo, no una foto: no imita el frasco real de ninguna marca.
  Hay tres siluetas y cuatro tonos; cada producto recibe siempre la misma combinación.
*/

const liquids = ['#c98d38', '#a33a3f', '#d8b25c', '#8a5a32']

/** Cuerpo de cada silueta (lienzo de 120 × 200, base en y = 190) y su tapa. */
const shapes = [
  {
    // Frasco cuadrado de hombros rectos
    body: 'M24,82 Q24,72 34,72 L86,72 Q96,72 96,82 L96,182 Q96,190 88,190 L32,190 Q24,190 24,182 Z',
    neck: 'M52,60 L68,60 L68,72 L52,72 Z',
    cap: 'M46,22 L74,22 L74,60 L46,60 Z',
    liquidTop: 112,
  },
  {
    // Frasco redondo
    body: 'M60,78 C96,78 104,108 104,138 C104,170 86,190 60,190 C34,190 16,170 16,138 C16,108 24,78 60,78 Z',
    neck: 'M53,64 L67,64 L67,79 L53,79 Z',
    cap: 'M60,26 C72,26 76,40 76,52 L76,64 L44,64 L44,52 C44,40 48,26 60,26 Z',
    liquidTop: 122,
  },
  {
    // Frasco en forma de arco, como el mihrab de la marca
    body: 'M28,190 L28,112 C28,90 46,78 60,70 C74,78 92,90 92,112 L92,190 Z',
    neck: 'M54,56 L66,56 L66,72 L54,72 Z',
    cap: 'M60,12 L70,30 L66,56 L54,56 L50,30 Z',
    liquidTop: 124,
  },
]

/** Número estable a partir de un texto (el id del producto). */
function hash(text: string) {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0
  return value
}

/**
 * Ilustración SVG de un frasco generada a partir de un texto: el mismo texto siempre da la misma forma y color.
 */
export function BottleIllustration({ seed, className }: { seed: string; className?: string }) {
  const id = useId()
  const value = hash(seed)
  const shape = shapes[value % shapes.length]
  const liquid = liquids[(value >>> 3) % liquids.length]
  const ids = { glass: `${id}g`, gold: `${id}o`, clip: `${id}c`, fade: `${id}f` }

  const bottle = (
    <>
      <path d={shape.body} fill={`url(#${ids.glass})`} />
      <g clipPath={`url(#${ids.clip})`}>
        <rect x="0" y={shape.liquidTop} width="120" height="80" fill={liquid} opacity="0.85" />
        <rect x="0" y={shape.liquidTop} width="120" height="1.2" fill="#f6dca0" opacity="0.6" />
      </g>
      <path d={shape.body} fill="none" stroke={`url(#${ids.gold})`} strokeWidth="1.3" />
      {/* Brillo vertical del vidrio */}
      <path
        d="M36,96 L36,170"
        stroke="#fff8ec"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d={shape.neck} fill="#2a241e" stroke={`url(#${ids.gold})`} strokeWidth="1" />
      <path d={shape.cap} fill={`url(#${ids.gold})`} />
    </>
  )

  return (
    <svg aria-hidden="true" viewBox="0 0 120 260" className={className}>
      <defs>
        <linearGradient id={ids.glass} x1="0" x2="1">
          <stop offset="0" stopColor="#f7f1e6" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#f7f1e6" stopOpacity="0.05" />
          <stop offset="1" stopColor="#f7f1e6" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={ids.gold} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#e3c77d" />
          <stop offset="0.55" stopColor="#c9a54e" />
          <stop offset="1" stopColor="#6f5420" />
        </linearGradient>
        <clipPath id={ids.clip}>
          <path d={shape.body} />
        </clipPath>
        <linearGradient id={ids.fade} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${ids.fade}m`}>
          <rect x="0" y="190" width="120" height="70" fill={`url(#${ids.fade})`} />
        </mask>
      </defs>
      {bottle}
      {/* Reflejo en el piso: el mismo frasco invertido y desvanecido */}
      <g mask={`url(#${ids.fade}m)`}>
        <g transform="translate(0 380) scale(1 -1)">{bottle}</g>
      </g>
    </svg>
  )
}
