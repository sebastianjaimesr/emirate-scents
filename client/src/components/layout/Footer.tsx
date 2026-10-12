import { Link } from 'react-router'
import { brand } from '../../config/brand'
import { buildWhatsAppUrl, whatsappMessages } from '../../lib/whatsapp'
import { InstagramIcon, WhatsAppIcon } from '../brand/BrandIcons'
import { Logo } from '../brand/Logo'
import { Container } from '../ui/Container'
import { Ornament } from '../ui/Ornament'
import { mainNavigation } from './navigation'

const currentYear = new Date().getFullYear()

const linkClass =
  'inline-flex min-h-10 items-center text-smoke-300 transition-colors hover:text-gold-300'

export function Footer() {
  return (
    <footer className="bg-ink-950 text-ivory-50">
      <Container className="pt-20 pb-10">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Logo className="w-44" />
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-smoke-300">
              Perfumes árabes, de diseñador, de nicho y equivalencias.
            </p>
          </div>

          <nav aria-label="Tienda">
            <h2 className="eyebrow font-sans text-gold-500">Tienda</h2>
            <ul className="mt-5 space-y-1 text-sm">
              {mainNavigation.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Ayuda">
            <h2 className="eyebrow font-sans text-gold-500">Ayuda</h2>
            <ul className="mt-5 space-y-1 text-sm">
              <li>
                <a href={`${import.meta.env.BASE_URL}#como-pedir`} className={linkClass}>
                  Cómo pedir
                </a>
              </li>
              <li>
                <a href={`${import.meta.env.BASE_URL}#preguntas-frecuentes`} className={linkClass}>
                  Preguntas frecuentes
                </a>
              </li>
              <li>
                <Link to="/favoritos" className={linkClass}>
                  Favoritos
                </Link>
              </li>
              <li>
                <Link to="/politica-de-datos" className={linkClass}>
                  Tratamiento de datos
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow font-sans text-gold-500">Contacto</h2>
            <ul className="mt-5 space-y-1 text-sm">
              <li>
                <a
                  href={buildWhatsAppUrl(whatsappMessages.general)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} gap-3`}
                >
                  <WhatsAppIcon className="size-5 text-gold-500" />
                  WhatsApp {brand.whatsappDisplay}
                </a>
              </li>
              <li>
                <a
                  href={brand.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} gap-3`}
                >
                  <InstagramIcon className="size-5 text-gold-500" />
                  {brand.instagramHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Ornament className="mt-16 justify-center" />
        <div className="mt-8 flex flex-col items-center justify-between gap-3 text-xs text-smoke-300/80 sm:flex-row">
          <p>
            © {currentYear} {brand.name}. Todos los derechos reservados.
          </p>
          <p className="tracking-[0.2em] uppercase">{brand.tagline}</p>
        </div>
      </Container>
    </footer>
  )
}
