#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "google-genai>=1.16.0",
#   "Pillow>=10.0.0",
# ]
# ///
"""Generate images via Google Gemini (google-genai SDK) with multi-reference support.

Auto-loads .env.local from the working directory if present.
Maps GEMINI_API_KEY → GOOGLE_API_KEY if needed.
Always writes a true PNG.
"""
from __future__ import annotations

import argparse
import io
import os
import sys
from pathlib import Path

RATIO_TO_SIZE = {
    "1:1": (1024, 1024),
    "9:16": (768, 1344),
    "16:9": (1344, 768),
    "4:5": (896, 1120),
    "3:4": (864, 1152),
    "4:3": (1152, 864),
}


def _load_env_local() -> None:
    p = Path.cwd() / ".env.local"
    if not p.exists():
        return
    for line in p.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate images via Google Gemini")
    p.add_argument("prompt", help="Image generation prompt")
    p.add_argument("--output", "-o", required=True, help="Output PNG path")
    p.add_argument(
        "--ratio",
        "-r",
        default="1:1",
        choices=list(RATIO_TO_SIZE.keys()),
        help="Aspect ratio (default 1:1)",
    )
    p.add_argument(
        "--reference-image",
        "-i",
        action="append",
        default=[],
        help="Reference image path (repeatable). Pass 3+ to blend style and free pose.",
    )
    p.add_argument(
        "--model",
        default=None,
        help="Override model. Default: gemini-3.1-flash-image-preview when refs are provided, gemini-2.5-flash-image otherwise.",
    )
    p.add_argument(
        "--force-white-bg",
        action="store_true",
        help="Pillow post-pass: flood-fill near-white pixels to exact #FFFFFF",
    )
    return p.parse_args()


def _ensure_png(img_bytes: bytes) -> bytes:
    from PIL import Image

    img = Image.open(io.BytesIO(img_bytes))
    if img.format == "PNG":
        return img_bytes
    out = io.BytesIO()
    img.convert("RGB").save(out, format="PNG", optimize=True)
    return out.getvalue()


def _force_white(img_bytes: bytes, threshold: int = 240) -> bytes:
    from PIL import Image

    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r > threshold and g > threshold and b > threshold:
                px[x, y] = (255, 255, 255)
    out = io.BytesIO()
    img.save(out, format="PNG", optimize=True)
    return out.getvalue()


def _call_gemini(args: argparse.Namespace) -> tuple[bytes, str]:
    from google import genai
    from google.genai import types
    import PIL.Image

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print(
            "Error: GOOGLE_API_KEY (or GEMINI_API_KEY) is not set.",
            file=sys.stderr,
        )
        sys.exit(2)

    client = genai.Client(api_key=api_key)

    model = args.model
    if model is None:
        model = (
            "gemini-3.1-flash-image-preview"
            if args.reference_image
            else "gemini-2.5-flash-image"
        )

    width, height = RATIO_TO_SIZE[args.ratio]

    contents: list = []
    for ref_path in args.reference_image:
        contents.append(PIL.Image.open(ref_path))
    contents.append(args.prompt)

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio=args.ratio),
        ),
    )

    img_bytes = None
    for cand in response.candidates or []:
        if not cand.content or not cand.content.parts:
            continue
        for part in cand.content.parts:
            if getattr(part, "inline_data", None) and part.inline_data.data:
                img_bytes = part.inline_data.data
                break
        if img_bytes:
            break

    if img_bytes is None:
        print(
            "Error: Gemini returned no image data. Response may have been blocked by safety filters.",
            file=sys.stderr,
        )
        sys.exit(3)

    return img_bytes, model


def main() -> int:
    _load_env_local()
    args = _parse_args()

    img_bytes, used_model = _call_gemini(args)
    img_bytes = _ensure_png(img_bytes)
    if args.force_white_bg:
        img_bytes = _force_white(img_bytes)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(img_bytes)
    width, height = RATIO_TO_SIZE[args.ratio]
    print(
        f"✓ {out_path} ({len(img_bytes):,} bytes, {width}x{height}, {used_model})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
