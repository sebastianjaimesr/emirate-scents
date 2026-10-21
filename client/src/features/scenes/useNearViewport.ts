import { useEffect, useState, type RefObject } from 'react'

/**
 * true cuando el elemento está en pantalla o cerca (a menos de una pantalla de distancia).
 * Las escenas 3D solo existen mientras su sección está cerca: así nunca hay más de dos o
 * tres lienzos WebGL abiertos a la vez (los navegadores limitan cuántos se pueden tener).
 */
export function useNearViewport(ref: RefObject<Element | null>, margin = '100% 0px') {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: margin,
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, margin])
  return near
}
