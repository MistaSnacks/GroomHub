// Shared branded HTML email layout for GroomLocal.
//
// Email clients are hostile: no reliable <style>, no flexbox, no web fonts,
// no SVG in Gmail. So everything here is table-based, inline-styled, capped at
// 600px, and uses hosted PNG assets served from groomlocal.com.
//
// The look mirrors the live site header (src/components/site-header.tsx): a
// light cream canvas, a teal-ringed Maui circle, a dark "GroomLocal" wordmark
// with a brown "PET GROOMING DIRECTORY" tagline, and teal + coral accents.
// Brand colors come from src/app/globals.css. Keep in sync.

export const BRAND = {
  teal: "#4ECDC4",
  tealDark: "#3DBDB5",
  coral: "#FF7E67",
  brown: "#956A46", // tagline / warm accent, matches site header
  cream: "#FDF8F0",
  card: "#FFFFFF",
  border: "#E8DDD4",
  ink: "#1E293B",
  body: "#475569",
  muted: "#7C8A97",
  site: "https://groomlocal.com",
  // Base Maui — the waving hero mascot (same asset the homepage hero uses via
  // MauiMascot). Transparent PNG, shown as a standing figure, not circle-cropped.
  mauiUrl: "https://groomlocal.com/maui-assets/00-maui-main.png",
  headingFont: "'Trebuchet MS',Helvetica,Arial,sans-serif",
  bodyFont: "'Segoe UI',Helvetica,Arial,sans-serif",
} as const;

export interface EmailButton {
  label: string;
  url: string;
}

export interface BrandedEmailOptions {
  /** Hidden inbox preview text shown after the subject line. */
  preheader?: string;
  /** Optional small coral pill above the heading (e.g. "PNW's #1 Directory"). */
  badge?: string;
  /** Main headline inside the card. */
  heading: string;
  /** Body content: pre-built block HTML (use the helpers below). */
  body: string;
  /** Optional primary call-to-action button. */
  cta?: EmailButton;
  /** Optional short note rendered under the CTA. */
  footerNote?: string;
  /** Show an unsubscribe link in the footer (for marketing/customer mail). */
  unsubscribeUrl?: string;
}

/** A body paragraph. */
export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:${BRAND.body};">${html}</p>`;
}

/** Emphasize inline text in brand ink. */
export function emailStrong(text: string): string {
  return `<strong style="color:${BRAND.ink};">${escapeHtml(text)}</strong>`;
}

/** A cream detail card with a small caption and label/value rows. */
export function emailDetailCard(
  caption: string,
  rows: Array<{ label: string; value: string }>
): string {
  const body = rows
    .map(
      (r) =>
        `<tr><td style="padding:4px 0;color:${BRAND.muted};width:130px;vertical-align:top;">${escapeHtml(
          r.label
        )}</td><td style="padding:4px 0;color:${BRAND.ink};">${escapeHtml(r.value)}</td></tr>`
    )
    .join("");
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:14px;margin:8px 0 24px 0;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 10px 0;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:${BRAND.muted};font-weight:700;">${escapeHtml(
        caption
      )}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:15px;">${body}</table>
    </td></tr>
  </table>`;
}

/** Escape user-supplied strings before placing them in email HTML. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Render a complete branded HTML email document. */
export function renderBrandedEmail(opts: BrandedEmailOptions): string {
  const { preheader, badge, heading, body, cta, footerNote, unsubscribeUrl } = opts;

  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
        preheader
      )}</div>`
    : "";

  const badgeBlock = badge
    ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#FDECE7;border-radius:999px;padding:7px 16px;font-size:13px;font-weight:700;color:${BRAND.coral};font-family:${BRAND.headingFont};">🐾 ${escapeHtml(
        badge
      )}</td></tr></table><div style="height:16px;line-height:16px;">&nbsp;</div>`
    : "";

  const ctaBlock = cta
    ? `
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td align="center" style="border-radius:999px;background:${BRAND.teal};box-shadow:0 4px 14px rgba(78,205,196,0.35);">
            <a href="${cta.url}" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:700;color:${BRAND.ink};text-decoration:none;font-family:${BRAND.headingFont};">${escapeHtml(
        cta.label
      )}</a>
          </td>
        </tr></table>`
    : "";

  const footerNoteBlock = footerNote
    ? `<p style="margin:28px 0 0 0;font-size:15px;line-height:1.6;color:${BRAND.body};">${footerNote}</p>`
    : "";

  const unsubscribeBlock = unsubscribeUrl
    ? `&nbsp;&middot;&nbsp;<a href="${unsubscribeUrl}" style="color:${BRAND.teal};text-decoration:none;">Unsubscribe</a>`
    : "";

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:32px 0;background:${BRAND.cream};font-family:${BRAND.bodyFont};">
  ${preheaderBlock}
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.cream};">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px;background:${BRAND.card};border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(30,41,59,0.08);border:1px solid ${BRAND.border};">

        <!-- HEADER: mirrors the site nav — light, left-aligned logo -->
        <tr>
          <td style="padding:22px 32px;border-bottom:1px solid ${BRAND.border};">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle;padding-right:12px;">
                <img src="${BRAND.mauiUrl}" width="60" height="60" alt="Maui, the GroomLocal mascot, waving hello" style="display:block;width:60px;height:60px;">
              </td>
              <td style="vertical-align:middle;">
                <div style="font-size:22px;font-weight:800;color:${BRAND.ink};letter-spacing:-0.02em;font-family:${BRAND.headingFont};line-height:1.1;">GroomLocal</div>
                <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.brown};font-weight:600;line-height:1.4;">Pet Grooming Directory</div>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:36px 40px 8px 40px;">
            ${badgeBlock}
            <h1 style="margin:0 0 16px 0;font-size:26px;line-height:1.25;color:${BRAND.ink};font-weight:800;font-family:${BRAND.headingFont};">${escapeHtml(
              heading
            )}</h1>
            ${body}
            ${ctaBlock}
            ${footerNoteBlock}
          </td>
        </tr>

        <!-- accent divider -->
        <tr><td style="padding:32px 40px 0 40px;"><div style="height:3px;border-radius:2px;background:linear-gradient(90deg,${BRAND.teal} 0%,${BRAND.coral} 100%);"></div></td></tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 40px 36px 40px;" align="center">
            <p style="margin:0 0 8px 0;font-size:14px;color:${BRAND.ink};font-weight:700;font-family:${BRAND.headingFont};">GroomLocal</p>
            <p style="margin:0 0 12px 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">The friendliest way to find dog grooming in the Pacific Northwest.</p>
            <p style="margin:0;font-size:13px;color:${BRAND.muted};">
              <a href="${BRAND.site}" style="color:${BRAND.teal};text-decoration:none;">groomlocal.com</a>${unsubscribeBlock}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
