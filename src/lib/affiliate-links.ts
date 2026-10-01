/**
 * Google requires paid and affiliate links to carry rel="sponsored". CMS links are marked
 * sponsored when the Portable Text link sets `sponsored: true`, or automatically when they
 * point at a known affiliate-network tracking host, so a forgotten flag still gets marked.
 */
const AFFILIATE_HOSTS = [
  "flexlinkspro.com", "flexlinks.com", "flexoffers.com", // FlexOffers
  "sjv.io", "pxf.io", "evyy.net", "7eer.net", "ojrq.net", "impact.com", // Impact
  "shareasale.com", "shareasale-analytics.com", // ShareASale
  "prf.hn", // Partnerize
  "awin1.com", "awin.com", // Awin
  "amzn.to", // Amazon short links
  "go.skimresources.com", "anrdoezrs.net", "dpbolvw.net", "jdoqocy.com", "kqzyfj.com", "tkqlhce.com", // Skimlinks, CJ
];

export const SPONSORED_REL = "sponsored nofollow noopener noreferrer";

export function isAffiliateHref(href: string): boolean {
  try {
    const url = new URL(href);
    if (url.hostname.endsWith("amazon.com") && url.searchParams.has("tag")) return true;
    return AFFILIATE_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
