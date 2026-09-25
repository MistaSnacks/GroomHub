#!/usr/bin/env python3
"""Pick transparency seeds for the background extractor with a vision pass, not a color rule.

The extractor (`scripts/maui-remove-background.py`) writes `<slug>-regions.jpg`, a teal
diagnostic with numbered pink markers on every enclosed paper-colored region, and
`regions.json` listing those candidates. Maui's cream fur is nearly the same color as
the paper, so choosing seeds by color would erase his face. Instead a vision model
classifies each numbered marker as a background gap, part of the character, or part
of a prop, and only the background gaps become seeds.

Usage:
  maui-export-seeds.py --regions <transparent/regions.json> --diagnostic <slug>-regions.jpg
                       --slug <slug> --out seeds.json [--project-root <checkout>]
                       [--vision-model gpt-5.4] [--min-area 150]

Writes seeds.json in the extractor's format: {"<slug>": {"seeds": [[x, y], ...]}} and
prints the classification. Exit 0 with an empty seed list when nothing is a gap.
"""
from __future__ import annotations

import argparse
import base64
import importlib.util
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent


def _gate_module():
    spec = importlib.util.spec_from_file_location("maui_jev_gate", SCRIPT_DIR / "maui-jev-gate.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def classify(diagnostic: Path, candidates: list[dict], model: str, key: str, gate) -> dict:
    ids = [c["id"] for c in candidates]
    instructions = (
        "This is a mascot illustration composited on a dark blue background after an automatic background removal. "
        "Pink numbered markers sit on enclosed regions whose color is close to the original cream paper. "
        "For EACH marker number listed below, say what the marker sits on: "
        "'gap' = leftover cream/white paper that is background showing between or inside objects and should become transparent "
        "(for example the space inside a bag handle, between a leg and the body, or under an arm); "
        "'character' = the dog's fur, face, or body; 'prop' = the surface of an object such as a paper, folder, brush or bag; "
        "'unsure' if you cannot tell. Reply with one JSON object: {\"regions\": {\"<id>\": \"gap|character|prop|unsure\", ...}, \"notes\": \"...\"}. "
        f"Marker numbers: {ids}"
    )
    body = {
        "model": model,
        "response_format": {"type": "json_object"},
        "max_completion_tokens": 900,
        "messages": [
            {"role": "system", "content": "Return only valid JSON."},
            {"role": "user", "content": [
                {"type": "text", "text": instructions},
                {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + base64.b64encode(diagnostic.read_bytes()).decode(), "detail": "high"}},
            ]},
        ],
    }
    response = gate._post_json(gate.OPENAI_URL, body, {"Authorization": f"Bearer {key}"}, timeout=240)
    content = response["choices"][0]["message"]["content"].strip()
    if content.startswith("```"):
        content = content.strip("`").split("\n", 1)[1].removesuffix("```").strip()
    parsed = json.loads(content)
    parsed["_vision_model"] = response.get("model", model)
    return parsed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--regions", type=Path, required=True)
    parser.add_argument("--diagnostic", type=Path, required=True)
    parser.add_argument("--slug", required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--project-root", type=Path)
    parser.add_argument("--vision-model", default=None)
    parser.add_argument("--min-area", type=int, default=150, help="ignore candidates smaller than this many pixels")
    args = parser.parse_args()

    gate = _gate_module()
    key = gate.resolve_key(["OPENAI_API_KEY", "VOICE_TOOLS_OPENAI_KEY"], args.project_root)
    if not key:
        print(json.dumps({"error": "no OpenAI key for the vision pass"}))
        return 1
    rows = json.loads(args.regions.read_text())
    row = next((r for r in rows if r.get("scene") == args.slug), rows[0] if rows else None)
    if not row:
        print(json.dumps({"error": "no rows in regions.json"}))
        return 1
    # The diagnostic only numbers candidates within paperDistance 14; mirror that filter.
    candidates = [c for c in row.get("candidates", []) if c.get("paperDistance", 99) <= 14 and c.get("area", 0) >= args.min_area]
    if not candidates:
        args.out.write_text(json.dumps({args.slug: {"seeds": []}}, indent=2))
        print(json.dumps({"seeds": 0, "classified": {}, "note": "no enclosed candidates"}))
        return 0
    verdict = classify(args.diagnostic, candidates, args.vision_model or gate.DEFAULT_VISION_MODEL, key, gate)
    regions = {str(k): str(v).lower() for k, v in verdict.get("regions", {}).items()}
    seeds = [c["seed"] for c in candidates if regions.get(str(c["id"])) == "gap"]
    args.out.write_text(json.dumps({args.slug: {"seeds": seeds}}, indent=2))
    print(json.dumps({"seeds": len(seeds), "seed_ids": [c["id"] for c in candidates if regions.get(str(c["id"])) == "gap"],
                      "classified": regions, "vision_model": verdict.get("_vision_model"), "notes": verdict.get("notes", "")}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
