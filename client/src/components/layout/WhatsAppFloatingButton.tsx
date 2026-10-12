import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { buildWhatsAppUrl, whatsappMessages } from '../../lib/whatsapp'
import { WhatsAppIcon } from '../brand/BrandIcons'

/**
 * Acceso discreto a WhatsApp. Aparece al bajar por la página (para no tapar el hero)
 * y respeta el área segura de los iPhone con "notch".
 */
export function WhatsAppFloatingButton() {
  const { scrollY } = useScroll()
  const [isVisible, setIsVisible] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setIsVisible(y > 480))

  return (
    <motion.a
      href={buildWhatsAppUrl(whatsappMessages.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"
      initial={false}
      animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      tabIndex={isVisible ? 0 : -1}
      aria-hidden={!isVisible}
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-full border border-gold-500/60 bg-ink-950 text-gold-300 shadow-lg shadow-black/30 transition-colors hover:bg-ink-900"
    >
      <WhatsAppIcon className="size-6" />
    </motion.a>
  )
}
