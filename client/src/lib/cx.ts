/** Une clases CSS ignorando valores vacíos: cx('a', condicion && 'b') → 'a b' */
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
