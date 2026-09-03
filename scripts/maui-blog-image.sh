#!/bin/bash
# Generate a Maui blog hero image — both Gemini and OpenAI variants.
#
# Usage:
#   scripts/maui-blog-image.sh <slug> "<scene description>"
#
# Outputs to: public/maui-assets/_compare/<slug>/{gemini,openai}.png
# Updates:    public/maui-assets/_compare/index.html (auto-generated index)
#
# Reference image: public/maui-assets/00-maui-main.png
# Base prompt:     pulled from public/maui-assets/MAUI-PROMPT-GUIDE.md
#
# After review, promote winner with:
#   mv public/maui-assets/_compare/<slug>/{gemini,openai}.png \
#      public/maui-assets/maui-<slug>-blog.png
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <slug> \"<scene description>\"" >&2
  echo "Example: $0 anxious-dog-grooming \"Maui curled in a blue towel-burrito wrap with a lavender sprig\"" >&2
  exit 1
fi

SLUG="$1"
SCENE="$2"

# Resolve project paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$(cd "$SCRIPT_DIR/.." && pwd)"
ASSETS="$PROJECT/public/maui-assets"
OUT="$ASSETS/_compare/$SLUG"
GUIDE="$ASSETS/MAUI-BASE-PROMPT.md"

# Multi-reference style anchor: 3 images covering varied poses (sitting, standing,
# costume) so the model averages style without locking onto a single pose. This is
# the fix for "all generations come back in the anchor's pose" — single reference
# = pose lock-in; multi-reference = style transfer with pose freedom.
REFS=(
  "$ASSETS/maui-anxious-dog-grooming-blog.png" # SINGLE canonical style anchor — no multi-ref averaging
)
REF_ARGS=()
for r in "${REFS[@]}"; do
  REF_ARGS+=(--reference-image "$r")
done

mkdir -p "$OUT"

# Load env (GEMINI_API_KEY + OPENAI_API_KEY from .env.local)
if [[ -f "$PROJECT/.env.local" ]]; then
  set -a
  source "$PROJECT/.env.local"
  set +a
fi
# Map GEMINI_API_KEY → GOOGLE_API_KEY for the ads skill's google-genai path
export GOOGLE_API_KEY="${GEMINI_API_KEY:-${GOOGLE_API_KEY:-}}"

# Extract the BASE PROMPT block from MAUI-PROMPT-GUIDE.md
# Format in the guide is:
#   MAUI BASE PROMPT:
#   ---
#   <prompt content>
#   ---
# So we need to skip the FIRST "---" (opener) and stop at the SECOND (closer).
BASE=$(awk '
  /^MAUI BASE PROMPT:$/ { state=1; next }
  state==1 && /^---$/ { state=2; next }
  state==2 && /^---$/ { state=3; next }
  state==2 { print }
' "$GUIDE")

if [[ -z "$BASE" ]]; then
  echo "Error: could not extract BASE PROMPT from $GUIDE" >&2
  exit 2
fi

PROMPT="$BASE

Scene: $SCENE"

GEMINI_OUT="$OUT/gemini.png"
OPENAI_OUT="$OUT/openai.png"

# === Gemini variant via the new gemini-image skill (multi-ref) ===
echo ""
echo "→ Generating Gemini variant via gemini-image skill (multi-ref)..."
GEMINI_SCRIPT="$HOME/.claude/skills/gemini-image/scripts/generate.py"
if [[ ! -x "$GEMINI_SCRIPT" ]]; then
  echo "  ! gemini-image skill not found or not executable at $GEMINI_SCRIPT" >&2
else
  "$GEMINI_SCRIPT" "$PROMPT" \
    --output "$GEMINI_OUT" \
    --ratio 1:1 \
    "${REF_ARGS[@]}" \
    --force-white-bg 2>&1 | sed 's/^/  /' || echo "  ! Gemini gen failed"
fi

# === OpenAI variant via the gpt-image skill (multi-ref) ===
echo ""
echo "→ Generating OpenAI variant via gpt-image skill (multi-ref)..."
GPT_SCRIPT="$HOME/.claude/skills/gpt-image/scripts/generate.py"
if [[ ! -x "$GPT_SCRIPT" ]]; then
  echo "  ! gpt-image skill not found or not executable at $GPT_SCRIPT" >&2
else
  "$GPT_SCRIPT" "$PROMPT" \
    --output "$OPENAI_OUT" \
    "${REF_ARGS[@]}" \
    --background opaque --quality high --force-white-bg 2>&1 | sed 's/^/  /' || echo "  ! OpenAI gen failed"
fi

# === Convert any JPEG-content .png files to true PNG (Gemini sometimes returns JPEG bytes) ===
for f in "$GEMINI_OUT" "$OPENAI_OUT"; do
  [[ -f "$f" ]] || continue
  uv run --quiet --python 3.11 --with "Pillow>=10.0.0" -- python -c "
from PIL import Image
import sys
p = sys.argv[1]
img = Image.open(p)
if img.format != 'PNG':
    img.convert('RGB').save(p, format='PNG', optimize=True)
" "$f" 2>/dev/null || true
done

# === Update the compare index.html ===
echo ""
echo "→ Updating compare index..."
INDEX="$ASSETS/_compare/index.html"
"$SCRIPT_DIR/maui-compare-index.py" "$ASSETS/_compare" > "$INDEX"

echo ""
echo "=== Done ==="
ls -la "$OUT" 2>/dev/null
echo ""
echo "Review: http://localhost:3001/maui-assets/_compare/index.html"
echo ""
echo "Promote winner once you've picked:"
echo "  mv \"$OUT/<gemini|openai>.png\" \"$ASSETS/maui-$SLUG-blog.png\""
