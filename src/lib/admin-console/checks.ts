import { googleAccessToken, searchAnalytics, searchConsoleConfigured, searchWindow } from "@/lib/search-console";
import { Resolver } from "node:dns/promises";
import { emailFrom } from "@/lib/email/send";
import { errorFields, logEvent } from "@/lib/log";

/**
 * Live checks against services outside the database: the mail DNS records that
 * decide whether outreach and owner emails reach an inbox, and Search Console.
 * Each returns a result object and never throws, so one dead service cannot
 * take a console page down.
 */

export type CheckLevel = "ok" | "warn" | "fail" | "unknown";

export interface DnsCheck {
  name: string;
  host: string;
  level: CheckLevel;
  detail: string;
}

const dnsResolver = new Resolver({ timeout: 2_000, tries: 1 });
const DNS_UNAVAILABLE = "DNS lookup unavailable. Record status is unknown. Retry this check.";

async function txt(host: string): Promise<string[] | null> {
  try {
    return (await dnsResolver.resolveTxt(host)).map((chunks) => chunks.join(""));
  } catch (error) {
    logEvent("warn", "mail-dns", "native_lookup_failed", { host, ...errorFields(error) });
  }

  try {
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=TXT`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) throw new Error(`DNS provider returned HTTP ${response.status}`);
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("Status" in body) || typeof body.Status !== "number") {
      throw new Error("Invalid DNS response");
    }
    if ("TC" in body && body.TC === true) throw new Error("Truncated DNS response");
    if (body.Status === 3) return [];
    if (body.Status !== 0) throw new Error(`DNS provider returned status ${body.Status}`);
    if (!("Answer" in body)) return [];
    if (!Array.isArray(body.Answer)) throw new Error("Invalid DNS answers");

    const records: string[] = [];
    const answers: unknown[] = body.Answer;
    for (const answer of answers) {
      if (!answer || typeof answer !== "object" || !("type" in answer) || typeof answer.type !== "number") {
        throw new Error("Invalid DNS answer");
      }
      if (answer.type !== 16) continue;
      if (!("data" in answer) || typeof answer.data !== "string") throw new Error("Invalid TXT record");
      records.push(answer.data);
    }
    return records;
  } catch (error) {
    logEvent("warn", "mail-dns", "https_lookup_failed", { host, ...errorFields(error) });
    return null;
  }
}

function senderDomain(): string {
  const from = emailFrom() ?? "";
  const match = from.match(/@([a-z0-9.-]+)/i);
  const domain = match?.[1].toLowerCase();
  return domain && domain !== "resend.dev" ? domain : "groomlocal.com";
}

let dnsMemo: { at: number; result: { domain: string; checks: DnsCheck[] } } | null = null;

/** SPF, DKIM (Google Workspace and Resend selectors) and DMARC for the sending domain. */
export async function checkMailDns(): Promise<{ domain: string; checks: DnsCheck[] }> {
  const domain = senderDomain();
  if (dnsMemo?.result.domain === domain && Date.now() - dnsMemo.at < 10 * 60_000) return dnsMemo.result;
  const [root, dmarc, googleDkim, resendDkim] = await Promise.all([
    txt(domain),
    txt(`_dmarc.${domain}`),
    txt(`google._domainkey.${domain}`),
    txt(`resend._domainkey.${domain}`),
  ]);

  const spf = root?.find((r) => r.toLowerCase().startsWith("v=spf1")) ?? null;
  const dmarcRecord = dmarc?.find((r) => r.toLowerCase().startsWith("v=dmarc1")) ?? null;
  const policy = dmarcRecord?.match(/\bp=(\w+)/i)?.[1].toLowerCase() ?? null;

  const checks: DnsCheck[] = [
    {
      name: "SPF",
      host: domain,
      level: root === null ? "unknown" : !spf ? "fail" : spf.includes("_spf.google.com") ? "ok" : "warn",
      detail: root === null ? DNS_UNAVAILABLE : !spf ? "No SPF record found for this domain." : spf.includes("_spf.google.com") ? spf : `${spf} (Google Workspace is not included)`,
    },
    {
      name: "DKIM, Google Workspace",
      host: `google._domainkey.${domain}`,
      level: googleDkim === null ? "unknown" : googleDkim.length ? "ok" : "fail",
      detail: googleDkim === null ? DNS_UNAVAILABLE : googleDkim.length ? "Signing key published. Check a received message to confirm Google Workspace signing." : "No key published. Turn on DKIM in Google Admin and add the record.",
    },
    {
      name: "DKIM, Resend",
      host: `resend._domainkey.${domain}`,
      level: resendDkim === null ? "unknown" : resendDkim.length ? "ok" : "fail",
      detail: resendDkim === null ? DNS_UNAVAILABLE : resendDkim.length ? "Signing key published. Check a received message to confirm Resend signing." : "No key published. Verify the domain in Resend.",
    },
    {
      name: "DMARC",
      host: `_dmarc.${domain}`,
      level: dmarc === null ? "unknown" : !dmarcRecord ? "fail" : policy === "none" ? "warn" : "ok",
      detail: dmarc === null
        ? DNS_UNAVAILABLE
        : !dmarcRecord
        ? "No DMARC record."
        : policy === "none"
          ? `${dmarcRecord} Monitoring only: spoofed mail is not rejected. Move to quarantine once SPF and DKIM have passed for a few weeks.`
          : dmarcRecord,
    },
  ];
  const result = { domain, checks };
  if ([root, dmarc, googleDkim, resendDkim].every((records) => records !== null)) {
    dnsMemo = { at: Date.now(), result };
  }
  return result;
}

export interface SearchRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleReport {
  state: "ok" | "unconfigured" | "error";
  error: string | null;
  site: string | null;
  /** First and last day covered (Search Console data lags about two days). */
  startDate: string | null;
  endDate: string | null;
  totals: { clicks: number; impressions: number; ctr: number; position: number } | null;
  byDay: { day: string; clicks: number; impressions: number }[];
  queries: SearchRow[];
  pages: SearchRow[];
}

let gscMemo: { at: number; key: string; report: SearchConsoleReport } | null = null;

/** Search Console performance for the `days` ending two days ago. */
export async function loadSearchConsole(days: number, today: string): Promise<SearchConsoleReport> {
  const empty = { site: null, startDate: null, endDate: null, totals: null, byDay: [], queries: [], pages: [] };
  const site = process.env.GSC_SITE_URL?.trim() ?? null;
  if (!site || !searchConsoleConfigured()) {
    return { ...empty, state: "unconfigured", error: "Search Console is not connected (GSC_SITE_URL and the GOOGLE_* variables)." };
  }
  const memoKey = `${days}:${today}`;
  if (gscMemo && gscMemo.key === memoKey && Date.now() - gscMemo.at < (gscMemo.report.state === "ok" ? 30 : 5) * 60_000) return gscMemo.report;

  const { startDate, endDate } = searchWindow(today, days);

  let report: SearchConsoleReport;
  try {
    const token = await googleAccessToken();
    const query = async (dimensions: string[], rowLimit: number) =>
      (await searchAnalytics(token, { startDate, endDate, dimensions, rowLimit })).map((r) => ({
        key: r.keys?.[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }));
    const [byDay, queries, pages] = await Promise.all([query(["date"], 500), query(["query"], 25), query(["page"], 25)]);
    const clicks = byDay.reduce((n, r) => n + r.clicks, 0);
    const impressions = byDay.reduce((n, r) => n + r.impressions, 0);
    report = {
      state: "ok",
      error: null,
      site,
      startDate,
      endDate,
      totals: {
        clicks,
        impressions,
        ctr: impressions ? clicks / impressions : 0,
        position: impressions ? byDay.reduce((n, r) => n + r.position * r.impressions, 0) / impressions : 0,
      },
      byDay: byDay.map((r) => ({ day: r.key, clicks: r.clicks, impressions: r.impressions })),
      queries,
      pages,
    };
  } catch (err) {
    report = { ...empty, site, state: "error", error: err instanceof Error ? err.message : String(err) };
  }
  gscMemo = { at: Date.now(), key: memoKey, report };
  return report;
}
