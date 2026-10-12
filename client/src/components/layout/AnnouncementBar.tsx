import { announcements } from '../../config/brand'

/** Barra superior de anuncios. Solo aparece si hay anuncios reales en config/brand.ts. */
export function AnnouncementBar() {
  if (announcements.length === 0) return null

  return (
    <div className="bg-ink-950 px-5 py-2 text-center text-[0.7rem] font-semibold tracking-[0.16em] text-gold-300 uppercase">
      {announcements.join(' · ')}
    </div>
  )
}
