import { brand } from '../../config/brand'

/**
 * Título y descripción de cada página para buscadores y pestañas del navegador.
 * React 19 mueve automáticamente <title> y <meta> al <head> del documento.
 */
export function PageMeta({ title, description }: { title?: string; description: string }) {
  const fullTitle = title
    ? `${title} · ${brand.name}`
    : `${brand.name} · Perfumería árabe, de diseñador y de nicho`
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
    </>
  )
}
