/** Shared by the browser tracker (which skips logging for these) and anything that reads a user agent. */
const BOT_USER_AGENT =
  /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|facebookexternalhit|embedly|preview|curl\/|wget\/|python-requests|python-urllib|aiohttp|httpx|go-http-client|okhttp|java\/|libwww|scrapy|phantomjs|puppeteer|playwright|selenium|cypress/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_USER_AGENT.test(userAgent);
}
