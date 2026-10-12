import { Container } from '../../components/ui/Container'
import { Ornament } from '../../components/ui/Ornament'
import { Reveal } from '../../components/ui/Reveal'
import { manifestoContent } from '../../content/home'

/** Bloque de marca sobre fondo de madera de oud. */
export function ManifestoSection() {
  return (
    <section
      aria-labelledby="manifiesto-title"
      className="relative overflow-hidden bg-oud-800 py-24 text-ivory-50 sm:py-32"
    >
      <Container className="relative text-center">
        <Reveal>
          <p className="eyebrow text-gold-300">{manifestoContent.eyebrow}</p>
          <h2
            id="manifiesto-title"
            className="mx-auto mt-6 max-w-4xl text-4xl leading-[1.1] italic sm:text-6xl lg:text-7xl"
          >
            {manifestoContent.quote}
          </h2>
          <Ornament className="mt-10 justify-center" />
          <p className="mx-auto mt-10 max-w-2xl text-base leading-relaxed text-ivory-50/80 sm:text-lg">
            {manifestoContent.body}
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
