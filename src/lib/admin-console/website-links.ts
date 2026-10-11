/**
 * Does an owner's own homepage link to GroomLocal? Catches badges that were
 * uploaded as a plain image (Wix, GoDaddy), which never load our badge URL.
 * Homepage only, so a link on an inner page reads as "no link". Server only.
 */

export type SiteLinkState = "links" | "no_link" | "unreachable";

const memo = new Map<string, { at: number; state: SiteLinkState }>();
const TTL_MS = 6 * 60 * 60 * 1000;

export async function siteLinksToGroomLocal(website: string): Promise<SiteLinkState> {
  const hit = memo.get(website);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.state;
  let state: SiteLinkState;
  try {
    const url = new URL(website);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("not http");
    // Facebook and Instagram pages need a login to read and never carry our badge.
    if (/(^|\.)(facebook|instagram)\.com$/.test(url.hostname)) throw new Error("social page");
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GroomLocalLinkCheck/1.0; +https://groomlocal.com)" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = (await res.text()).slice(0, 2_000_000);
    state = /groomlocal\.com/i.test(html) ? "links" : "no_link";
  } catch {
    state = "unreachable";
  }
  memo.set(website, { at: Date.now(), state });
  return state;
}
