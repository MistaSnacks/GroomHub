import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CircleCheck, CircleX, Info, TriangleAlert, type LucideIcon } from "lucide-react";

/** Server-safe building blocks for the admin console. No hooks in this file. */

export type Tone = "ok" | "warn" | "fail" | "info" | "neutral" | "teal";

const TONE_PILL: Record<Tone, string> = {
  ok: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  warn: "bg-amber-50 text-amber-800 ring-amber-600/25",
  fail: "bg-red-50 text-red-800 ring-red-600/20",
  info: "bg-sky-50 text-sky-800 ring-sky-600/20",
  neutral: "bg-stone-100 text-stone-700 ring-stone-500/15",
  teal: "bg-teal-50 text-teal-800 ring-teal-600/20",
};

const TONE_ICON: Partial<Record<Tone, LucideIcon>> = { ok: CircleCheck, warn: TriangleAlert, fail: CircleX, info: Info };

export function Pill({ tone = "neutral", icon = false, children, title }: { tone?: Tone; icon?: boolean; children: ReactNode; title?: string }) {
  const Icon = icon ? TONE_ICON[tone] : undefined;
  return (
    <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONE_PILL[tone]}`}>
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {children}
    </span>
  );
}

export function StatusIcon({ tone, className = "h-4 w-4" }: { tone: Tone; className?: string }) {
  const Icon = TONE_ICON[tone] ?? Info;
  const color = tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : tone === "fail" ? "text-red-600" : "text-sky-600";
  return <Icon className={`${className} ${color} shrink-0`} aria-label={tone} />;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 border-b border-adm-line bg-adm-plane/80 px-5 pb-5 pt-6 md:flex-row md:items-end md:justify-between md:px-8">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#956A46]">{eyebrow}</p>}
        <h1 className="text-[28px] leading-tight text-brand-primary">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm text-stone-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className="space-y-6 px-5 py-6 md:px-8">{children}</div>;
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
  flush = false,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No inner padding, for tables that run edge to edge. */
  flush?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={`adm-rise min-w-0 rounded-2xl border border-adm-line bg-white shadow-[0_1px_2px_rgba(30,41,59,0.04),0_8px_24px_-12px_rgba(30,41,59,0.10)] ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-5 pb-1 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-[17px] text-brand-primary">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-stone-500">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {/* Edge-to-edge tables scroll sideways inside the panel on narrow screens instead of widening the page. */}
      <div className={flush ? "overflow-x-auto pt-2" : "px-5 pb-5 pt-3"}>{children}</div>
    </section>
  );
}

/** Signed percent change. Neutral gray when there is nothing to compare with. */
export function Delta({ value, goodWhenUp = true, label = "vs prior period" }: { value: number | null; goodWhenUp?: boolean; label?: string }) {
  if (value === null) return <span className="text-[11px] text-stone-400">no prior data</span>;
  const up = value >= 0;
  const good = value === 0 ? null : up === goodWhenUp;
  const color = good === null ? "text-stone-500 bg-stone-100" : good ? "text-emerald-800 bg-emerald-50" : "text-red-800 bg-red-50";
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-400">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${color}`}>
        <Icon className="h-3 w-3" aria-hidden />
        {Math.abs(value)}%
      </span>
      {label}
    </span>
  );
}

/** Tiny trend line. The last point gets the accent so "now" is easy to find. */
export function Spark({ values, color = "var(--color-adm-s1)", width = 96, height = 28 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const y = (v: number) => height - 3 - (v / max) * (height - 6);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lastX = (values.length - 1) * step;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <path d={`${d} L${lastX},${height} L0,${height} Z`} fill={color} opacity={0.1} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={y(values[values.length - 1])} r={3} fill={color} stroke="white" strokeWidth={1.5} />
    </svg>
  );
}

export function StatTile({
  label,
  value,
  sub,
  delta,
  spark,
  href,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: ReactNode;
  spark?: number[];
  href?: string;
  tone?: Tone;
}) {
  // Label and value sit at the same height in every tile of a row; the delta pins to the bottom.
  const body = (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        {tone && <StatusIcon tone={tone} className="h-3.5 w-3.5" />}
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-[28px] font-semibold leading-none tracking-tight text-brand-primary">{value}</p>
        {spark && <Spark values={spark} />}
      </div>
      {sub && <p className="text-[11px] leading-snug text-stone-500">{sub}</p>}
      {delta && <div className="mt-auto pt-1">{delta}</div>}
    </div>
  );
  const cls = "adm-rise block min-w-0 rounded-2xl border border-adm-line bg-white p-4 shadow-[0_1px_2px_rgba(30,41,59,0.04)]";
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:border-teal-600/40`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Completion meter. The unfilled track is a light step of the same hue. */
export function Meter({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const fill = pct >= 75 ? "bg-emerald-600" : pct >= 45 ? "bg-amber-500" : "bg-red-500";
  const track = pct >= 75 ? "bg-emerald-100" : pct >= 45 ? "bg-amber-100" : "bg-red-100";
  return (
    <div className="flex items-center gap-2" title={label ?? `${pct} of 100`}>
      <div className={`h-1.5 w-full min-w-12 overflow-hidden rounded-full ${track}`}>
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-7 shrink-0 text-right text-[11px] font-semibold tabular-nums text-stone-600">{pct}</span>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-adm-line bg-adm-plane/50 px-6 py-8 text-center">
      <p className="text-sm font-medium text-stone-700">{title}</p>
      {children && <div className="mt-1 text-xs text-stone-500">{children}</div>}
    </div>
  );
}

/** Horizontal funnel. Each step's bar is its share of the first step. */
export function Funnel({ steps }: { steps: { label: string; value: number; note?: string }[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const pct = (s.value / top) * 100;
        const prev = i > 0 ? steps[i - 1].value : null;
        const conv = prev ? Math.round((s.value / prev) * 1000) / 10 : null;
        return (
          <li key={s.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-stone-700">{s.label}</span>
              <span className="tabular-nums">
                <span className="font-semibold text-brand-primary">{s.value.toLocaleString("en-US")}</span>
                {conv !== null && <span className="ml-2 text-[11px] text-stone-500">{conv}% of previous</span>}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-teal-50">
              <div className="h-full rounded-full bg-adm-s1" style={{ width: `${Math.max(pct, s.value > 0 ? 1.5 : 0)}%` }} />
            </div>
            {s.note && <p className="mt-1 text-[11px] text-stone-500">{s.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/** Links that switch the look-back window, keeping the rest of the URL. */
export function RangeSwitch({ basePath, current, ranges = [7, 30, 90], extra = {} }: { basePath: string; current: number; ranges?: number[]; extra?: Record<string, string> }) {
  return (
    <div className="flex items-center rounded-lg border border-adm-line bg-white p-0.5 text-sm" role="group" aria-label="Date range">
      {ranges.map((r) => {
        const params = new URLSearchParams({ ...extra, range: String(r) });
        return (
          <Link
            key={r}
            href={`${basePath}?${params.toString()}`}
            aria-current={r === current ? "true" : undefined}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${r === current ? "bg-brand-primary text-white" : "text-stone-600 hover:text-brand-primary"}`}
          >
            {r}d
          </Link>
        );
      })}
    </div>
  );
}

export const th = "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-500";
export const td = "px-4 py-3 align-top";
export const tableWrap = "overflow-x-auto";
export const rowCls = "border-t border-adm-line/70 hover:bg-adm-plane/40";

export function ExternalA({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`text-teal-700 hover:underline ${className}`}>
      {children}
    </a>
  );
}

/** Hostname only, for table cells where a long path would push other columns away. */
export function prettyHost(url: string | null | undefined): string {
  return prettyUrl(url).split("/")[0];
}

/** Host and path without the scheme, for compact website display. */
export function prettyUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
