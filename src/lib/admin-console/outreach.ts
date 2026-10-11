import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Read-only view of the daily outreach job, which runs on another Mac and keeps
 * its running list in a JSON file there. The console reads that file over SSH.
 *
 * Only works where the SSH key lives (the owner's machine): on Vercel, or with
 * OUTREACH_SSH_TARGET unset, it reports "unavailable" and the rest of the console
 * carries on. The last good read is kept on disk so a sleeping or dead remote
 * still shows numbers, marked with their age. Nothing here ever writes to the
 * remote machine or sends mail.
 */

export interface OutreachContact {
  slug: string;
  email: string;
  /** YYYY-MM-DD */
  sent: string;
  campaign: string;
  /** YYYY-MM-DD the bounce notice was matched, when there was one. */
  bounced: string | null;
}

export interface OutreachData {
  updated: string | null;
  contacted: OutreachContact[];
  /** Listings with no email found: the call-or-visit queue. */
  manualNoEmail: string[];
  researchedNoEmail: string[];
  dataIssues: { slug: string; issue: string }[];
  followups: { slug: string; sent: string; type: string }[];
  /** Run folders (YYYY-MM-DD), oldest first. */
  runs: string[];
  lastReport: string | null;
}

export interface OutreachSnapshot {
  /** live = read just now; cached = remote unreachable, showing the last good read. */
  state: "live" | "cached" | "unavailable";
  fetchedAt: string | null;
  reason: string | null;
  data: OutreachData | null;
}

const REMOTE_COMMAND = [
  'cat "$HOME/.hermes/groomlocal-outreach-contacted.json"',
  "printf '\\n@@RUNS@@\\n'",
  'ls "$HOME/.hermes/groomlocal-daily-outreach/runs"',
  "printf '@@REPORT@@\\n'",
  'cat "$HOME/.hermes/groomlocal-daily-outreach/runs/$(ls "$HOME/.hermes/groomlocal-daily-outreach/runs" | tail -1)/report.md"',
].join("; ");

const SNAPSHOT_FILE = path.join(process.cwd(), ".admin-cache", "outreach.json");
const LIVE_TTL_MS = 5 * 60_000;
const FAILURE_TTL_MS = 2 * 60_000;

let memo: { at: number; snapshot: OutreachSnapshot } | null = null;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Exported for tests: turn the remote command's output into structured data. */
export function parseOutreach(raw: string): OutreachData {
  const [jsonPart, rest = ""] = raw.split("\n@@RUNS@@\n");
  const [runsPart = "", reportPart = ""] = rest.split("@@REPORT@@\n");
  const parsed = JSON.parse(jsonPart) as Record<string, unknown>;
  const list = (key: string): Record<string, unknown>[] =>
    Array.isArray(parsed[key]) ? (parsed[key] as unknown[]).filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];
  return {
    updated: str(parsed.updated) || null,
    contacted: list("contacted")
      .filter((c) => str(c.slug) && str(c.sent))
      .map((c) => ({ slug: str(c.slug), email: str(c.email), sent: str(c.sent), campaign: str(c.campaign), bounced: str(c.bounced) || null })),
    manualNoEmail: strings(parsed.manual_no_email),
    researchedNoEmail: strings(parsed.researched_no_email),
    dataIssues: list("data_issues").map((d) => ({ slug: str(d.slug), issue: str(d.issue) })),
    followups: list("followups").map((f) => ({ slug: str(f.slug), sent: str(f.sent), type: str(f.type) })),
    runs: runsPart.split("\n").map((r) => r.trim()).filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r)),
    lastReport: reportPart.trim() || null,
  };
}

function runSsh(target: string, key: string | undefined): Promise<string> {
  const args = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=4"];
  if (key) args.push("-i", key);
  args.push(target, REMOTE_COMMAND);
  return new Promise((resolve, reject) => {
    execFile("ssh", args, { timeout: 9000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr.trim().split("\n").pop() || error.message));
      else resolve(stdout);
    });
  });
}

async function readSnapshotFile(): Promise<{ fetchedAt: string; data: OutreachData } | null> {
  try {
    return JSON.parse(await readFile(SNAPSHOT_FILE, "utf8")) as { fetchedAt: string; data: OutreachData };
  } catch {
    return null;
  }
}

export async function loadOutreach(): Promise<OutreachSnapshot> {
  const target = process.env.OUTREACH_SSH_TARGET?.trim();
  if (process.env.VERCEL) {
    return { state: "unavailable", fetchedAt: null, reason: "Outreach data lives on the outreach Mac and is only readable from the local console.", data: null };
  }
  if (!target) {
    return { state: "unavailable", fetchedAt: null, reason: "Set OUTREACH_SSH_TARGET (and OUTREACH_SSH_KEY) in .env.local to read the outreach job.", data: null };
  }
  if (memo && Date.now() - memo.at < (memo.snapshot.state === "live" ? LIVE_TTL_MS : FAILURE_TTL_MS)) return memo.snapshot;

  let snapshot: OutreachSnapshot;
  try {
    const data = parseOutreach(await runSsh(target, process.env.OUTREACH_SSH_KEY?.trim() || undefined));
    const fetchedAt = new Date().toISOString();
    snapshot = { state: "live", fetchedAt, reason: null, data };
    // The list holds business contact emails, so keep the copy private and out of git.
    await mkdir(path.dirname(SNAPSHOT_FILE), { recursive: true });
    await writeFile(SNAPSHOT_FILE, JSON.stringify({ fetchedAt, data }), { mode: 0o600 });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const saved = await readSnapshotFile();
    snapshot = saved
      ? { state: "cached", fetchedAt: saved.fetchedAt, reason, data: saved.data }
      : { state: "unavailable", fetchedAt: null, reason, data: null };
  }
  memo = { at: Date.now(), snapshot };
  return snapshot;
}

/** Sends per day (YYYY-MM-DD), with bounces counted on the day the email was sent. */
export function sendsByDay(data: OutreachData, days: string[]): { day: string; sent: number; bounced: number }[] {
  const map = new Map(days.map((d) => [d, { day: d, sent: 0, bounced: 0 }]));
  for (const c of data.contacted) {
    const bucket = map.get(c.sent);
    if (!bucket) continue;
    bucket.sent++;
    if (c.bounced) bucket.bounced++;
  }
  return [...map.values()];
}
