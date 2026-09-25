#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow>=10.0.0,<12"]
# ///
"""Generate one Maui blog hero master for the art loop.

Called by skills/hermes-blog-skill/scripts/maui-art-loop.py as:
  blog-hero-image.py <slug> "<scene>" --provider openai --ref <reference.png> --out <master.png>
                     [--pose ...] [--mood ...] [--extra ...] [--model ...]

Builds the prompt from the owner-approved base prompt (public/maui-assets/MAUI-BASE-PROMPT.md)
plus the scene, pose, mood and any correction text, calls scripts/image-providers/gpt-image.py
with the approved reference image, and writes <out>.prompt.txt beside the image for provenance.
Exit codes: 0 success, 2 usage or configuration, 3 generation failed.
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE_PROMPT_FILE = ROOT / "public" / "maui-assets" / "MAUI-BASE-PROMPT.md"
PROVIDERS = {"openai": ROOT / "scripts" / "image-providers" / "gpt-image.py"}


def base_prompt() -> str:
    """The block between the two '---' lines after 'MAUI BASE PROMPT:'."""
    if not BASE_PROMPT_FILE.is_file():
        raise SystemExit(f"base prompt file missing: {BASE_PROMPT_FILE}")
    state = 0
    lines: list[str] = []
    for raw in BASE_PROMPT_FILE.read_text().splitlines():
        line = raw.rstrip("\n")
        if state == 0 and line.strip() == "MAUI BASE PROMPT:":
            state = 1
        elif state == 1 and line.strip() == "---":
            state = 2
        elif state == 2 and line.strip() == "---":
            break
        elif state == 2:
            lines.append(line)
    text = "\n".join(lines).strip()
    if not text:
        raise SystemExit(f"could not extract the base prompt from {BASE_PROMPT_FILE}")
    return text


def build_prompt(scene: str, pose: str | None, mood: str | None, extra: str | None) -> str:
    parts = [base_prompt(), "", f"Scene: {scene.strip()}"]
    if pose:
        parts.append(f"Pose: {pose.strip()}")
    if mood:
        parts.append(f"Mood: {mood.strip()}")
    if extra:
        parts.append(extra.strip())
    return "\n".join(parts)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("slug")
    p.add_argument("scene")
    p.add_argument("--provider", choices=["openai", "openrouter"], default="openai")
    p.add_argument("--ref", type=Path, required=True, help="approved reference image")
    p.add_argument("--out", type=Path, required=True, help="output PNG path")
    p.add_argument("--pose")
    p.add_argument("--mood")
    p.add_argument("--extra")
    p.add_argument("--model")
    args = p.parse_args()

    if args.provider != "openai":
        print(f"provider {args.provider} is not available in this checkout; use --provider openai", file=sys.stderr)
        return 2
    helper = PROVIDERS["openai"]
    if not helper.is_file():
        print(f"image helper missing: {helper}", file=sys.stderr)
        return 2
    if not args.ref.is_file():
        print(f"reference image missing: {args.ref}", file=sys.stderr)
        return 2

    prompt = build_prompt(args.scene, args.pose, args.mood, args.extra)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.with_suffix(".prompt.txt").write_text(prompt + "\n")

    uv = shutil.which("uv") or str(Path.home() / ".local" / "bin" / "uv")
    cmd = [uv, "run", "--quiet", str(helper), prompt,
           "--output", str(args.out), "--reference-image", str(args.ref),
           "--background", "opaque", "--quality", "high"]
    if args.model:
        cmd += ["--model", args.model]
    # Pass only the image credential; never the app's whole environment file.
    env = {k: v for k, v in os.environ.items() if k in {"PATH", "HOME", "OPENAI_API_KEY", "UV_CACHE_DIR", "TMPDIR"}}
    result = subprocess.run(cmd, cwd=str(ROOT), env=env, capture_output=True, text=True)
    sys.stdout.write(result.stdout[-2000:])
    if result.returncode != 0 or not args.out.is_file():
        sys.stderr.write(result.stderr[-2000:])
        print(f"generation failed (exit {result.returncode})", file=sys.stderr)
        return 3
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
