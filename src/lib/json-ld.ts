/**
 * Serialize an object for an inline `<script type="application/ld+json">` tag.
 *
 * `JSON.stringify` does not escape `</script>`, so any user-controlled string
 * (listing name, phone, address, CMS copy) could close the script tag and inject
 * markup. Escaping `<`, `>` and `&` as JSON unicode escapes keeps the payload
 * valid JSON while making it inert inside HTML.
 */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
