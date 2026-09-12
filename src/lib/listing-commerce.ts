/** Validate owner-entered appointment links and whole-dollar starting/range prices. */
export function parseListingCommerce(form: FormData): { patch: { booking_url?: string | null; price_min?: number; price_max?: number; price_range?: string; transparent_pricing?: boolean }; error?: string } {
  const patch: { booking_url?: string | null; price_min?: number; price_max?: number; price_range?: string; transparent_pricing?: boolean } = {};
  if (form.has("booking_url")) {
    const raw = String(form.get("booking_url") || "").trim();
    if (!raw) patch.booking_url = null;
    else {
      try {
        const url = new URL(raw);
        if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
        if (/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)(?:\/|$)/i.test(url.pathname) || /(^|\.)(wixstatic\.com|googleapis\.com)$/.test(url.hostname) || /(^|\.)maps\.google\./.test(url.hostname)) {
          return { patch: {}, error: "Use your appointment page, not an image or map link." };
        }
        patch.booking_url = url.href;
      } catch {
        return { patch: {}, error: "Booking link must be a valid http or https URL." };
      }
    }
  }
  if (form.has("price_min") || form.has("price_max")) {
    if (!form.has("price_min") || !form.has("price_max")) return { patch: {}, error: "Please provide both price fields, leaving either blank when unknown." };
    const min = Number(String(form.get("price_min") || "").trim());
    const max = Number(String(form.get("price_max") || "").trim());
    if (![min, max].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 2147483647)) return { patch: {}, error: "Prices must be positive whole-dollar amounts, or blank." };
    if (max > 0 && (min === 0 || max < min)) return { patch: {}, error: "Maximum price must be at least the starting price. Leave it blank if there is no fixed maximum." };
    Object.assign(patch, { price_min: min, price_max: max, price_range: "", transparent_pricing: min > 0 });
  }
  return { patch };
}
