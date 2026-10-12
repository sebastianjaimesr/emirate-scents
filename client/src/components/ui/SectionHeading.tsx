import { cx } from '../../lib/cx'
import { Reveal } from './Reveal'

interface SectionHeadingProps {
  id?: string
  eyebrow: string
  title: string
  lead?: string
  /** "dark" cuando la sección tiene fondo oscuro. */
  tone?: 'light' | 'dark'
  align?: 'left' | 'center'
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  tone = 'light',
  align = 'left',
}: SectionHeadingProps) {
  const isDark = tone === 'dark'
  return (
    <Reveal className={cx('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <p className={cx('eyebrow', isDark ? 'text-gold-500' : 'text-gold-700')}>{eyebrow}</p>
      <h2
        id={id}
        className={cx(
          'mt-4 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl',
          isDark ? 'text-ivory-50' : 'text-ink-950',
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cx(
            'mt-5 text-base leading-relaxed sm:text-lg',
            isDark ? 'text-smoke-300' : 'text-smoke-500',
          )}
        >
          {lead}
        </p>
      )}
    </Reveal>
  )
}
