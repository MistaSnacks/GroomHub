// Apply the verified 2026-10-14 website enrichment to business_listings.
//
//   npx tsx scripts/apply-enrichment-2026-10-14.ts                  dry run (default): reads only, writes the report and backup SQL
//   npx tsx scripts/apply-enrichment-2026-10-14.ts --apply          saves every affected row to backup-rows-<time>.json, then writes
//   npx tsx scripts/apply-enrichment-2026-10-14.ts --restore <file> puts the five fields back from a backup-rows file
//
// Rules:
// - Only verified evidence: list fields use `verified_value`, scalars need `verified: true`.
// - Fill only empty fields. On unclaimed listings the import placeholder services ["full groom"] counts as empty.
// - Claimed listings (owner_id set): fill only truly empty fields, never replace owner data.
// - Services and specialties are mapped to the site's tag taxonomy and stored as tag labels, the same
//   values the owner dashboard saves. A value with no matching tag is dropped and listed in the report.
// - grooms_cats defaults to false at import, so false counts as empty on unclaimed listings only.
// - Booking links to a platform's bare home page (daysmartpet.com/) are dropped: they do not book this shop.
// - --apply re-reads each row and skips it if any target field changed since the plan was made.
import { config } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServiceLabel, getSpecialtyLabel, matchServiceTag, matchSpecialtyTag } from "../src/lib/tags";
import { LISTING_REDIRECTS } from "../src/lib/listing-review";
import { isPlaceholderServices } from "../src/lib/listing-facts";

export const BACKUP_TABLE = "business_listings_backup_enrichment_20261106";
const SOURCE = join(__dirname, "..", "..", "analysis", "enrichment-full-2026-10-14", "proposals.verified.jsonl");
const OUT_DIR = join(__dirname, "..", "..", "analysis", "enrichment-full-2026-10-14", "apply-2026-11-06");


export interface ListingRow {
  id: string;
  slug: string;
  owner_id: string | null;
  services: string[] | null;
  specialties: string[] | null;
  booking_url: string | null;
  grooms_cats: boolean | null;
  year_established: number | null;
}

type Field = "services" | "specialties" | "booking_url" | "grooms_cats" | "year_established";
export const FIELDS: Field[] = ["services", "specialties", "booking_url", "grooms_cats", "year_established"];

/** Listings left out after the owner review of the 2026-11-06 dry run. */
export const EXCLUDED_SLUGS: Record<string, string> = {
  "clean-cut-the-barber-company-ellensburg-ellensburg": "a human barber shop, not a dog groomer",
  "pet-pros-bonney-lake": "website is a brand page for several EarthWise Pet stores; booking link names another store",
};

interface Evidence {
  value: unknown;
  verified?: boolean;
  verified_value?: unknown[];
}

export interface Proposal {
  slug: string;
  fields: Partial<Record<string, Evidence>>;
}

export interface Change {
  field: Field;
  from: unknown;
  to: unknown;
}

export interface Plan {
  listing: ListingRow;
  changes: Change[];
  /** Fields the proposal had but the rules kept out, with the reason. */
  skipped: Array<{ field: Field; reason: string }>;
}

/**
 * Enrichment wording that names an existing tag in other words. Only existing tags; values
 * not here or in the taxonomy are dropped.
 */
const ENRICHMENT_ALIASES: Record<string, { service?: string; specialty?: string }> = {
  "puppy intro groom": { service: "puppy-grooming" },
  mobile: { service: "mobile-grooming" },
  "senior dogs": { specialty: "senior-pets" },
  "large/giant breeds": { specialty: "large-dogs" },
  "special-needs dogs": { specialty: "special-needs" },
  "fear free certified": { specialty: "fear-free" },
  "cat-only": { specialty: "cat-specialist" },
};

const serviceTag = (raw: string) => matchServiceTag(raw) ?? ENRICHMENT_ALIASES[raw.trim().toLowerCase()]?.service ?? null;
const specialtyTag = (raw: string) => matchSpecialtyTag(raw) ?? ENRICHMENT_ALIASES[raw.trim().toLowerCase()]?.specialty ?? null;


const isEmptyList = (v: string[] | null | undefined) => !v || v.length === 0;

/**
 * Map raw enrichment values onto tag labels. A raw value can land in either list:
 * "dematting" is a specialty tag, "self-wash" a service tag. Unmatched values are returned.
 */
export function mapToTags(services: string[], specialties: string[]): { services: string[]; specialties: string[]; unmatched: string[] } {
  const serviceSlugs: string[] = [];
  const specialtySlugs: string[] = [];
  const unmatched: string[] = [];
  const add = (list: string[], slug: string) => {
    if (!list.includes(slug)) list.push(slug);
  };
  for (const raw of services) {
    const s = serviceTag(raw);
    const p = specialtyTag(raw);
    if (s) add(serviceSlugs, s);
    else if (p) add(specialtySlugs, p);
    else unmatched.push(raw);
  }
  for (const raw of specialties) {
    const p = specialtyTag(raw);
    const s = serviceTag(raw);
    if (p) add(specialtySlugs, p);
    else if (s) add(serviceSlugs, s);
    else unmatched.push(raw);
  }
  return { services: serviceSlugs.map(getServiceLabel), specialties: specialtySlugs.map(getSpecialtyLabel), unmatched };
}

export function bookingUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const bareHome = (u.pathname === "/" || u.pathname === "") && !u.search && u.hostname.replace(/^www\./, "").split(".").length <= 2;
    return bareHome ? null : u.toString();
  } catch {
    return null;
  }
}

export function planListing(listing: ListingRow, proposal: Proposal, currentYear = 2026): { plan: Plan; unmatched: string[] } {
  const claimed = !!listing.owner_id;
  const changes: Change[] = [];
  const skipped: Plan["skipped"] = [];
  const f = proposal.fields;
  const verifiedList = (key: string): string[] => ((f[key]?.verified_value ?? []) as unknown[]).filter((v): v is string => typeof v === "string");

  const mapped = mapToTags(verifiedList("services"), verifiedList("specialties"));

  if (f.services || mapped.services.length) {
    const open = isEmptyList(listing.services) || (!claimed && isPlaceholderServices(listing.services));
    if (!mapped.services.length) skipped.push({ field: "services", reason: "no value matched a service tag" });
    else if (!open) skipped.push({ field: "services", reason: claimed ? "claimed listing already has services" : "already has services" });
    else changes.push({ field: "services", from: listing.services, to: mapped.services });
  }
  if (f.specialties || mapped.specialties.length) {
    if (!mapped.specialties.length) skipped.push({ field: "specialties", reason: "no value matched a specialty tag" });
    else if (!isEmptyList(listing.specialties)) skipped.push({ field: "specialties", reason: "already has specialties" });
    else changes.push({ field: "specialties", from: listing.specialties, to: mapped.specialties });
  }
  if (f.booking_url) {
    const url = f.booking_url.verified ? bookingUrl(f.booking_url.value) : null;
    if (!url) skipped.push({ field: "booking_url", reason: "not verified, not a URL, or a platform home page" });
    else if (listing.booking_url?.trim()) skipped.push({ field: "booking_url", reason: "already has a booking link" });
    else changes.push({ field: "booking_url", from: listing.booking_url, to: url });
  }
  if (f.grooms_cats) {
    const v = f.grooms_cats.verified && typeof f.grooms_cats.value === "boolean" ? f.grooms_cats.value : null;
    const unset = listing.grooms_cats === null || (!claimed && listing.grooms_cats === false);
    if (v === null) skipped.push({ field: "grooms_cats", reason: "not verified" });
    else if (!unset) skipped.push({ field: "grooms_cats", reason: claimed ? "claimed listing" : "already set" });
    else if (listing.grooms_cats === v) skipped.push({ field: "grooms_cats", reason: "already the same" });
    else changes.push({ field: "grooms_cats", from: listing.grooms_cats, to: v });
  }
  if (f.year_established) {
    const y = f.year_established.verified ? Number(f.year_established.value) : NaN;
    if (!Number.isInteger(y) || y < 1950 || y > currentYear) skipped.push({ field: "year_established", reason: "not verified or out of range" });
    else if (listing.year_established !== null) skipped.push({ field: "year_established", reason: "already set" });
    else changes.push({ field: "year_established", from: null, to: y });
  }
  return { plan: { listing, changes, skipped }, unmatched: mapped.unmatched };
}

const sqlString = (s: string) => `'${s.replace(/'/g, "''")}'`;

export function backupSql(ids: string[]): string {
  return [
    `-- Run before --apply. Copies every row the enrichment will touch. Safe to re-run.`,
    `create table if not exists public.${BACKUP_TABLE} as table public.business_listings with no data;`,
    `alter table public.${BACKUP_TABLE} enable row level security;`,
    `insert into public.${BACKUP_TABLE}`,
    `select b.* from public.business_listings b`,
    `where b.id in (${ids.map(sqlString).join(", ")})`,
    `  and not exists (select 1 from public.${BACKUP_TABLE} k where k.id = b.id);`,
    `select count(*) as backed_up from public.${BACKUP_TABLE};`,
    "",
  ].join("\n");
}

const COLUMNS = "id, slug, owner_id, services, specialties, booking_url, grooms_cats, year_established";

async function readListings(db: SupabaseClient): Promise<ListingRow[]> {
  const rows: ListingRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from("business_listings").select(COLUMNS).order("id").range(offset, offset + 999);
    if (error) throw new Error(`business_listings: ${error.message}`);
    rows.push(...((data ?? []) as ListingRow[]));
    if (!data || data.length < 1000) return rows;
  }
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface BackupFile {
  rows: (ListingRow & Record<string, unknown>)[];
  changes: { id: string; changes: Change[] }[];
}

/**
 * Puts back only the fields this script changed, and only where the value is still the one it wrote.
 * A field an owner edited after the apply keeps the owner's value.
 */
async function restore(db: SupabaseClient, file: string) {
  const backup = JSON.parse(readFileSync(file, "utf8")) as BackupFile;
  const rowsById = new Map(backup.rows.map((r) => [r.id, r]));
  let restored = 0;
  for (const { id, changes } of backup.changes) {
    const before = rowsById.get(id);
    const { data: now, error } = await db.from("business_listings").select(COLUMNS).eq("id", id).single();
    if (!before || error || !now) {
      console.error(`skip ${id}: ${error?.message ?? "not in backup"}`);
      continue;
    }
    const fields = changes.filter((c) => sameValue((now as ListingRow)[c.field], c.to)).map((c) => c.field);
    const kept = changes.length - fields.length;
    if (kept) console.log(`keep ${before.slug}: ${kept} field(s) changed since the apply`);
    if (!fields.length) continue;
    const { error: updateError } = await db.from("business_listings").update(Object.fromEntries(fields.map((f) => [f, before[f]]))).eq("id", id);
    if (updateError) console.error(`fail ${before.slug}: ${updateError.message}`);
    else restored++;
  }
  console.log(`Restored ${restored} of ${backup.changes.length} rows from ${file}`);
}

async function main() {
  config({ path: join(__dirname, "..", ".env.local"), quiet: true });
  const apply = process.argv.includes("--apply");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const restoreAt = process.argv.indexOf("--restore");
  if (restoreAt !== -1) {
    const file = process.argv[restoreAt + 1];
    if (!file || !existsSync(file)) throw new Error("--restore needs the path of a backup-rows-*.json file.");
    return restore(db, file);
  }
  if (!existsSync(SOURCE)) throw new Error(`Missing ${SOURCE}.`);

  const proposals: Proposal[] = readFileSync(SOURCE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const listings = await readListings(db);
  const bySlug = new Map(listings.map((l) => [l.slug, l]));

  const plans: Plan[] = [];
  const unmatchedCounts = new Map<string, number>();
  const missing: string[] = [];
  const excluded: string[] = [];
  for (const p of proposals) {
    if (!Object.keys(p.fields).some((k) => (FIELDS as string[]).includes(k))) continue;
    if (EXCLUDED_SLUGS[p.slug]) {
      excluded.push(`${p.slug} (${EXCLUDED_SLUGS[p.slug]})`);
      continue;
    }
    const listing = bySlug.get(p.slug) ?? bySlug.get(LISTING_REDIRECTS[p.slug] ?? "");
    if (!listing) {
      missing.push(p.slug);
      continue;
    }
    const { plan, unmatched } = planListing(listing, p);
    for (const u of unmatched) unmatchedCounts.set(u, (unmatchedCounts.get(u) ?? 0) + 1);
    plans.push(plan);
  }
  const changing = plans.filter((p) => p.changes.length > 0);

  const perField = Object.fromEntries(FIELDS.map((f) => [f, { change: 0, skipped: {} as Record<string, number> }]));
  for (const p of plans) {
    for (const c of p.changes) perField[c.field].change++;
    for (const s of p.skipped) perField[s.field].skipped[s.reason] = (perField[s.field].skipped[s.reason] ?? 0) + 1;
  }
  const placeholderReplaced = changing.filter((p) => p.changes.some((c) => c.field === "services") && isPlaceholderServices(p.listing.services)).length;
  const claimedTouched = changing.filter((p) => p.listing.owner_id).map((p) => ({ slug: p.listing.slug, fields: p.changes.map((c) => c.field) }));

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "plan.json"), JSON.stringify(changing.map((p) => ({ id: p.listing.id, slug: p.listing.slug, claimed: !!p.listing.owner_id, changes: p.changes })), null, 2));
  writeFileSync(join(OUT_DIR, "backup.sql"), backupSql(changing.map((p) => p.listing.id)));
  const sample = shuffle(changing, 20261106).slice(0, 15);
  const report = [
    `# Enrichment apply plan (${apply ? "apply" : "dry run"}), ${new Date().toISOString()}`,
    "",
    `Proposals with a target field: ${plans.length + missing.length}. Matched to a current listing: ${plans.length}. Not found: ${missing.length}${missing.length ? ` (${missing.join(", ")})` : ""}.`,
    `Excluded by hand: ${excluded.length}${excluded.length ? ` (${excluded.join("; ")})` : ""}.`,
    `Listings that change: ${changing.length}. Placeholder services replaced: ${placeholderReplaced}. Claimed listings touched: ${claimedTouched.length}.`,
    "",
    "| Field | Will change | Skipped (reason: count) |",
    "|---|---|---|",
    ...FIELDS.map((f) => `| ${f} | ${perField[f].change} | ${Object.entries(perField[f].skipped).map(([r, n]) => `${r}: ${n}`).join("; ") || "none"} |`),
    "",
    "## Claimed listings touched (empty fields only)",
    ...(claimedTouched.length ? claimedTouched.map((c) => `- ${c.slug}: ${c.fields.join(", ")}`) : ["- none"]),
    "",
    "## Values dropped (no matching tag)",
    ...[...unmatchedCounts].sort((a, b) => b[1] - a[1]).map(([v, n]) => `- ${v}: ${n}`),
    "",
    "## 15 random diffs (seed 20261106)",
    ...sample.flatMap((p) => [`- ${p.listing.slug}${p.listing.owner_id ? " (claimed)" : ""}`, ...p.changes.map((c) => `  - ${c.field}: ${JSON.stringify(c.from)} -> ${JSON.stringify(c.to)}`)]),
    "",
  ].join("\n");
  writeFileSync(join(OUT_DIR, "report.md"), report);
  console.log(report);
  console.log(`Wrote ${join(OUT_DIR, "report.md")}, plan.json and backup.sql.`);

  if (!apply) return;

  // Full-row backup on disk before any write. The SQL backup needs dashboard access; this needs only the service key.
  const ids = changing.map((p) => p.listing.id);
  const backupRows: Record<string, unknown>[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db.from("business_listings").select("*").in("id", ids.slice(i, i + 200));
    if (error) throw new Error(`Backup read failed (${error.message}). Nothing was written.`);
    backupRows.push(...((data ?? []) as Record<string, unknown>[]));
  }
  if (backupRows.length !== ids.length) throw new Error(`Backup holds ${backupRows.length} of ${ids.length} rows. Nothing was written.`);
  const backupFile = join(OUT_DIR, `backup-rows-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  const backup: BackupFile = { rows: backupRows as BackupFile["rows"], changes: changing.map((p) => ({ id: p.listing.id, changes: p.changes })) };
  writeFileSync(backupFile, JSON.stringify(backup, null, 1));
  console.log(`Backed up ${backupRows.length} rows to ${backupFile}`);

  const log: string[] = [];
  let applied = 0;
  for (const p of changing) {
    const { data: now, error } = await db.from("business_listings").select(COLUMNS).eq("id", p.listing.id).single();
    if (error || !now) {
      log.push(`skip ${p.listing.slug}: re-read failed`);
      continue;
    }
    const drifted = p.changes.filter((c) => !sameValue((now as ListingRow)[c.field], c.from) || (now as ListingRow).owner_id !== p.listing.owner_id);
    if (drifted.length) {
      log.push(`skip ${p.listing.slug}: changed since the plan (${drifted.map((c) => c.field).join(", ")})`);
      continue;
    }
    const patch = Object.fromEntries(p.changes.map((c) => [c.field, c.to]));
    // Conditional on the owner seen in the re-read, so a claim that lands in between is not overwritten.
    let update = db.from("business_listings").update(patch).eq("id", p.listing.id);
    update = p.listing.owner_id ? update.eq("owner_id", p.listing.owner_id) : update.is("owner_id", null);
    const { data: updated, error: updateError } = await update.select("id");
    if (updateError) log.push(`fail ${p.listing.slug}: ${updateError.message}`);
    else if (!updated?.length) log.push(`skip ${p.listing.slug}: owner changed during the apply`);
    else {
      applied++;
      log.push(`ok ${p.listing.slug}: ${Object.keys(patch).join(", ")}`);
    }
  }
  const logFile = join(OUT_DIR, "apply.log");
  writeFileSync(logFile, `${log.join("\n")}\n`);
  console.log(`Applied ${applied} of ${changing.length}. Log: ${logFile}`);
}

if (process.argv[1] && /apply-enrichment-2026-10-14\.ts$/.test(process.argv[1])) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
