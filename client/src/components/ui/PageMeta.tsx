import { useLocation } from 'react-router'
import { brand } from '../../config/brand'
import { absoluteUrl } from '../../lib/siteUrl'

/**
 * Título, descripción y dirección canónica de cada página para buscadores y pestañas.
 * React 19 mueve automáticamente <title>, <meta> y <link> al <head> del documento.
 * La canónica no lleva los filtros (?marca=...): así Google no ve cada combinación como
 * una página distinta.
 */
export function PageMeta({
  title,
  description,
  noIndex = false,
}: {
  title?: string
  description: string
  /** true en páginas que no deben salir en buscadores (por ejemplo, "no encontrada"). */
  noIndex?: boolean
}) {
  const { pathname } = useLocation()
  const fullTitle = title
    ? `${title} · ${brand.name}`
    : `${brand.name} · Perfumería árabe, de diseñador y de nicho`
  const canonical = noIndex ? '' : absoluteUrl(pathname)
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex" />}
      {canonical && <link rel="canonical" href={canonical} />}
    </>
  )
}

/**
 * Datos estructurados (schema.org) para buscadores. Solo con datos reales y verificables.
 * Es un bloque de DATOS (no se ejecuta), por eso lo permite la política de seguridad (CSP).
 */
export function StructuredData({ data }: { data: object }) {
  // "<" escapado: un texto con "</script>" no puede cerrar la etiqueta antes de tiempo
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
