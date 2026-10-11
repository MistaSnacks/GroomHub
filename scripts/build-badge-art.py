"""Generate src/lib/badge-art.ts: the owner website badge artwork (style A, approved 2026-10-07).

Badge text is drawn as outlines in the site fonts (Fredoka for the wordmark, Inter for
the small line), because an SVG loaded through <img> cannot load web fonts and would
otherwise fall back to whatever font each visitor has. The Maui logo comes from
public/maui-logo-circle.svg, the circle crop used by the site header.

Run again only when the badge wording, fonts or logo change:

    python3 -m venv /tmp/badge-venv && /tmp/badge-venv/bin/pip install fonttools uharfbuzz
    curl -sLo /tmp/Fredoka.ttf "https://github.com/google/fonts/raw/main/ofl/fredoka/Fredoka%5Bwdth,wght%5D.ttf"
    curl -sLo /tmp/Inter.ttf "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf"
    /tmp/badge-venv/bin/python scripts/build-badge-art.py /tmp/Fredoka.ttf /tmp/Inter.ttf

Then rebuild the static PNG (public/badges/groomlocal-owner-confirmed.png) from the
"confirmed" badge at 2x.
"""
import io
import json
import math
import re
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
FREDOKA, INTER = Path(sys.argv[1]), Path(sys.argv[2])
LOGO = ROOT / "public" / "maui-logo-circle.svg"
OUT = ROOT / "src" / "lib" / "badge-art.ts"

W = 220
NAVY, TEAL, CORAL, CREAM, BROWN = "#1E293B", "#4ECDC4", "#FF7E67", "#FDF8F0", "#956A46"
TEAL_INK = "#23857E"
TEXT_X = 66


def num(v: float) -> str:
    s = f"{v:.1f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


class Face:
    def __init__(self, path: Path, **axes):
        inst = instantiateVariableFont(TTFont(path), axes)
        buf = io.BytesIO()
        inst.save(buf)
        data = buf.getvalue()
        self.tt = TTFont(io.BytesIO(data))
        self.hb = hb.Font(hb.Face(data))
        self.upem = self.tt["head"].unitsPerEm
        self.gs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()

    def _shape(self, text):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {"kern": True, "liga": True})
        return buf.glyph_infos, buf.glyph_positions

    def width(self, text, size, tracking=0.0):
        infos, pos = self._shape(text)
        return sum(p.x_advance for p in pos) * size / self.upem + tracking * (len(infos) - 1)

    def path(self, text, size, x, y, tracking=0.0):
        infos, pos = self._shape(text)
        s = size / self.upem
        pen = SVGPathPen(self.gs, ntos=num)
        cx = x
        for info, p in zip(infos, pos):
            t = TransformPen(pen, (s, 0, 0, -s, cx + p.x_offset * s, y - p.y_offset * s))
            self.gs[self.order[info.codepoint]].draw(t)
            cx += p.x_advance * s + tracking
        return pen.getCommands()


wordmark_face = Face(FREDOKA, wght=700, wdth=100)
kicker_face = Face(INTER, wght=600, opsz=14)

logo_src = LOGO.read_text()
assert "<script" not in logo_src.lower() and "href" not in logo_src.lower()
logo_inner = re.search(r"<svg[^>]*>(.*)</svg>", logo_src, re.S).group(1).strip()
logo_viewbox = re.search(r'viewBox="([^"]+)"', logo_src).group(1)

cx, cy, r, ring = 33, 32, 21, 2.5
logo = (
    f'<clipPath id="gl-badge-logo"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>'
    f'<g clip-path="url(#gl-badge-logo)"><circle cx="{cx}" cy="{cy}" r="{r}" fill="{CREAM}"/>'
    f'<svg x="{cx - r}" y="{cy - r}" width="{2 * r}" height="{2 * r}" viewBox="{logo_viewbox}" fill="none">{logo_inner}</svg></g>'
    f'<circle cx="{cx}" cy="{cy}" r="{num(r - ring / 2)}" fill="none" stroke="{TEAL}" stroke-width="{ring}"/>'
)


def star(x, y, size):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = size if i % 2 == 0 else size * 0.45
        pts.append(f"{num(x + rr * math.cos(a))},{num(y + rr * math.sin(a))}")
    return f'<polygon points="{" ".join(pts)}" fill="{CORAL}"/>'


def check(x, y, s):
    return (f'<path d="M{num(x - s)} {num(y)}l{num(s * 0.7)} {num(s * 0.7)} {num(s * 1.4)}-{num(s * 1.5)}" '
            f'fill="none" stroke="{TEAL_INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>')


KICKERS = {
    "featured": ("FEATURED ON", star(TEXT_X + 4.5, 21.2, 5)),
    "confirmed": ("OWNER CONFIRMED ON", check(TEXT_X + 3.6, 21.5, 3.2)),
    "listed": ("FIND US ON", ""),
}
kickers = {}
for key, (text, icon) in KICKERS.items():
    x = TEXT_X + (12 if icon else 0)
    assert x + kicker_face.width(text, 9, 1.35) <= W - 10, key
    kickers[key] = f'{icon}<path d="{kicker_face.path(text, 9, x, 25, tracking=1.35)}" fill="{BROWN}"/>'

assert TEXT_X - 1 + wordmark_face.width("GroomLocal", 24, -0.48) <= W - 10
wordmark = f'<path d="{wordmark_face.path("GroomLocal", 24, TEXT_X - 1, 48, tracking=-0.48)}" fill="{NAVY}"/>'

OUT.write_text(
    "// GENERATED by scripts/build-badge-art.py. Do not edit by hand.\n"
    "// Badge style A (approved 2026-10-07): Maui circle logo, small capitals line, GroomLocal wordmark.\n\n"
    f"export const BADGE_LOGO = {json.dumps(logo)};\n\n"
    f"export const BADGE_WORDMARK = {json.dumps(wordmark)};\n\n"
    "export const BADGE_KICKERS = {\n"
    + "".join(f"  {k}: {json.dumps(v)},\n" for k, v in kickers.items())
    + "} as const;\n"
)
print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes)")
