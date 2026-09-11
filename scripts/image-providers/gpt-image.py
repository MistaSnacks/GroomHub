#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "openai>=1.75.0",
#   "Pillow>=10.0.0",
# ]
# ///
"""Generate or edit images via OpenAI gpt-image-2 (or other gpt-image models).

Auto-loads .env.local from the working directory if present.
Always writes a true PNG. Supports reference images via images.edit.
"""
from __future__ import annotations

import argparse
import base64
import io
import os
import sys
from pathlib import Path


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
    p = argparse.ArgumentParser(
        description="Generate images via OpenAI gpt-image-2",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("prompt", help="Image generation prompt")
    p.add_argument("--output", "-o", required=True, help="Output PNG path")
    p.add_argument(
        "--size",
        default="1024x1024",
        choices=["1024x1024", "1024x1536", "1536x1024"],
        help="Image dimensions (default: 1024x1024)",
    )
    p.add_argument(
        "--reference-image",
        "-i",
        action="append",
        default=[],
        help="Reference image path (repeatable). Switches mode to images.edit.",
    )
    p.add_argument(
        "--background",
        default="opaque",
        choices=["opaque", "transparent", "auto"],
        help="Background mode (default: opaque, prevents cream tint)",
    )
    p.add_argument(
        "--quality",
        default="high",
        choices=["high", "medium", "low", "auto"],
        help="Quality tier (default: high)",
    )
    p.add_argument(
        "--model",
        default="gpt-image-2",
        choices=["gpt-image-2", "gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"],
        help="Model name (default: gpt-image-2)",
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


def _call_openai(args: argparse.Namespace) -> tuple[bytes, str, str]:
    from openai import OpenAI, PermissionDeniedError

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    if args.model == "gpt-image-2" and args.background == "transparent":
        print(
            "note: gpt-image-2 does not support transparent backgrounds; using opaque",
            file=sys.stderr,
        )
        args.background = "opaque"

    def _attempt(model: str):
        common = {"model": model, "size": args.size}
        extras = {
            "quality": args.quality,
            "background": args.background,
            "output_format": "png",
        }
        if args.reference_image:
            ref_files = [open(p, "rb") for p in args.reference_image]
            try:
                ref_arg = ref_files if len(ref_files) > 1 else ref_files[0]
                try:
                    return client.images.edit(
                        prompt=args.prompt, image=ref_arg, **common, **extras
                    ), "edit"
                except TypeError:
                    return client.images.edit(
                        prompt=args.prompt, image=ref_arg, **common
                    ), "edit"
            finally:
                for f in ref_files:
                    f.close()
        else:
            try:
                return client.images.generate(
                    prompt=args.prompt, **common, **extras
                ), "generate"
            except TypeError:
                return client.images.generate(prompt=args.prompt, **common), "generate"

    # Try requested model; fall back to gpt-image-1.5 on org-verification 403.
    used_model = args.model
    try:
        response, mode = _attempt(args.model)
    except PermissionDeniedError as e:
        msg = str(e)
        if "must be verified" in msg and args.model == "gpt-image-2":
            print(
                "note: gpt-image-2 requires org verification; falling back to gpt-image-1.5. "
                "Verify at https://platform.openai.com/settings/organization/general",
                file=sys.stderr,
            )
            used_model = "gpt-image-1.5"
            response, mode = _attempt(used_model)
        else:
            raise

    img_bytes = base64.b64decode(response.data[0].b64_json)
    return img_bytes, mode, used_model


def main() -> int:
    _load_env_local()
    if not os.environ.get("OPENAI_API_KEY"):
        print(
            "Error: OPENAI_API_KEY is not set. Add to .env.local or env.",
            file=sys.stderr,
        )
        return 2

    args = _parse_args()

    img_bytes, mode, used_model = _call_openai(args)
    img_bytes = _ensure_png(img_bytes)
    if args.force_white_bg:
        img_bytes = _force_white(img_bytes)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(img_bytes)
    print(
        f"✓ {mode} → {out_path} ({len(img_bytes):,} bytes, {args.size}, {used_model})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
