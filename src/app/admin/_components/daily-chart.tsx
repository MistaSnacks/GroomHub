"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Daily column chart with a hover tooltip and a table view. Stacks when given more
 * than one series. `extra` (crawler views) is drawn as a gray hatched cap on top of
 * each column and left out of the y-scale, so one crawl does not flatten every
 * other day; a cap that would run off the top is clipped there, and the tooltip
 * and table still show the real number.
 */

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

interface Props {
  days: string[];
  series: ChartSeries[];
  values: Record<string, number>[];
  extra?: number[];
  extraLabel?: string;
  height?: number;
  unit?: string;
}

const PAD = { top: 12, right: 8, bottom: 26, left: 34 };
const GAP = 2;

function niceMax(max: number): number {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= max) return m * pow;
  return 10 * pow;
}

function dayLabel(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function weekday(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

/** Column path with a 4px rounded top and a square base. */
function column(x: number, y: number, w: number, h: number, round: boolean): string {
  if (h <= 0) return "";
  const r = round ? Math.min(4, w / 2, h) : 0;
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

export function DailyChart({ days, series, values, extra = [], extraLabel = "Crawler views, left out", height = 220, unit = "" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totals = values.map((v) => series.reduce((n, s) => n + (v[s.key] ?? 0), 0));
  const scaleMax = niceMax(Math.max(1, ...totals));
  const hasExtra = extra.some((n) => n > 0);
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const band = days.length ? plotW / days.length : 0;
  const barW = Math.max(2, Math.min(24, band * 0.68));
  const y = (v: number) => PAD.top + plotH - (Math.min(v, scaleMax) / scaleMax) * plotH;
  const ticks = [0, scaleMax / 2, scaleMax];
  const labelEvery = Math.max(1, Math.ceil(days.length / Math.max(2, Math.floor(plotW / 64))));

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
          {series.map((s) => (
            <li key={s.key} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
              {s.label}
            </li>
          ))}
          {hasExtra && (
            <li className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-stone-300" aria-hidden />
              {extraLabel}
            </li>
          )}
        </ul>
      )}
      <div ref={wrap} className="relative w-full" style={{ height }} onMouseLeave={() => setHover(null)}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={`${series.map((s) => s.label).join(" and ")} per day`}>
            <defs>
              <pattern id="adm-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="#E7E2DA" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="#C9C1B5" strokeWidth="2" />
              </pattern>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#D6CCBE" : "#EFE8DE"} strokeWidth={1} />
                <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="#8A847B" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {Number.isInteger(t) ? t.toLocaleString("en-US") : t.toFixed(1)}
                </text>
              </g>
            ))}
            {days.map((day, i) => {
              const x = PAD.left + i * band + (band - barW) / 2;
              const isHover = hover === i;
              let base = 0;
              const segs = series.map((s, si) => {
                const v = values[i]?.[s.key] ?? 0;
                const top = y(base + v);
                const bottom = y(base);
                base += v;
                const isTop = !extra[i] && series.slice(si + 1).every((later) => (values[i]?.[later.key] ?? 0) === 0);
                // A 2px surface gap separates stacked segments.
                const h = Math.max(0, bottom - top - (si > 0 && v > 0 ? GAP : 0));
                return v > 0 ? <path key={s.key} d={column(x, top, barW, h, isTop)} fill={s.color} opacity={hover === null || isHover ? 1 : 0.55} /> : null;
              });
              const cap = extra[i] ?? 0;
              const capTop = Math.max(PAD.top, PAD.top + plotH - ((totals[i] + cap) / scaleMax) * plotH);
              const capH = Math.max(0, y(totals[i]) - capTop - (totals[i] > 0 ? GAP : 0));
              return (
                <g key={day}>
                  {isHover && <rect x={PAD.left + i * band} y={PAD.top} width={band} height={plotH} fill="#F4EEE5" />}
                  {segs}
                  {cap > 0 && <path d={column(x, capTop, barW, capH, true)} fill="url(#adm-hatch)" />}
                </g>
              );
            })}
            {days.map((day, i) =>
              i % labelEvery === 0 || i === days.length - 1 ? (
                (i === days.length - 1 || days.length - 1 - i >= labelEvery / 2) && (
                  <text key={day} x={PAD.left + i * band + band / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#8A847B">
                    {dayLabel(day)}
                  </text>
                )
              ) : null
            )}
            {days.map((day, i) => (
              <rect
                key={day}
                x={PAD.left + i * band}
                y={0}
                width={band}
                height={height - PAD.bottom + 4}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
              />
            ))}
          </svg>
        )}
        {hover !== null && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 min-w-36 rounded-lg border border-adm-line bg-white px-3 py-2 text-xs shadow-lg"
            style={{
              left: Math.min(Math.max(PAD.left + hover * band + band / 2 - 72, 0), width - 160),
              top: 0,
            }}
          >
            <p className="mb-1 font-semibold text-brand-primary">
              {weekday(days[hover])}, {dayLabel(days[hover])}
            </p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4 text-stone-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} aria-hidden />
                  {s.label}
                </span>
                <span className="font-semibold tabular-nums text-brand-primary">
                  {(values[hover]?.[s.key] ?? 0).toLocaleString("en-US")}
                  {unit}
                </span>
              </p>
            ))}
            {(extra[hover] ?? 0) > 0 && (
              <p className="mt-1 flex items-center justify-between gap-4 text-stone-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-stone-300" aria-hidden />
                  {extraLabel}
                </span>
                <span className="tabular-nums">{extra[hover].toLocaleString("en-US")}</span>
              </p>
            )}
          </div>
        )}
      </div>
      <details className="mt-2 text-xs text-stone-500">
        <summary className="cursor-pointer select-none hover:text-stone-700">Show as table</summary>
        <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-adm-line">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-adm-plane">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Day</th>
                {series.map((s) => (
                  <th key={s.key} className="px-3 py-1.5 text-right font-medium">
                    {s.label}
                  </th>
                ))}
                {hasExtra && <th className="px-3 py-1.5 text-right font-medium">{extraLabel}</th>}
              </tr>
            </thead>
            <tbody>
              {[...days.keys()].reverse().map((i) => (
                <tr key={days[i]} className="border-t border-adm-line/60">
                  <td className="px-3 py-1">{dayLabel(days[i])}</td>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1 text-right tabular-nums">
                      {(values[i]?.[s.key] ?? 0).toLocaleString("en-US")}
                    </td>
                  ))}
                  {hasExtra && <td className="px-3 py-1 text-right tabular-nums text-stone-400">{(extra[i] ?? 0).toLocaleString("en-US")}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
