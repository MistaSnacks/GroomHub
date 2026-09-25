#!/usr/bin/env python3
"""Two-stage Maui art gate.

Stage A: a vision model looks at the candidate beside the approved reference and
records literal observations (paw counts, tail, bandana text, props, stray text).
It never decides pass/fail.

Stage B: TypeSafe Jev (text-only System One model) turns those observations plus
the Maui standard into calibrated yes/no probabilities, one per gate. Code then
applies a single threshold. Every gate must reach the threshold to pass.

Usage:
  maui-jev-gate.py <image.png> --scene "<article scene brief>" [--stage master|final]
                   [--reference brushing-v2.png] [--threshold 0.85]
                   [--project-root <checkout>] [--out gate.json]
                   [--review-out image-review.json]   (final stage only)
                   [--vision-model gpt-5.4] [--observations existing.json]

Keys: OPENAI_API_KEY (or VOICE_TOOLS_OPENAI_KEY) and TYPESAFE_API_KEY, resolved from
process env, then <project-root>/.env.local, then ~/.hermes/.env. Values are never
printed or written into artifacts.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import importlib.util
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
DEFAULT_REFERENCE = SKILL_DIR / "references" / "maui" / "approved-reference" / "brushing-v2.png"
DEFAULT_VISION_MODEL = os.environ.get("MAUI_VISION_MODEL", "gpt-5.4")
JEV_MODEL = "jev-latest"
JEV_URL = "https://api.typesafe.ai/v1/systemone"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
DEFAULT_THRESHOLD = 0.85

GATE_KEYS_MASTER = ["identity", "anatomy", "bandana", "edges", "style", "scene", "clean_text"]
GATE_KEYS_FINAL = GATE_KEYS_MASTER + ["transparency"]

# Text appended to the next generation prompt when a gate fails.
CORRECTION_HINTS = {
    "identity": "Match the approved reference face exactly: same rounded fluffy cream-white head, floppy ears, dark burgundy eyes and nose, friendly smile. Do not restyle Maui.",
    "anatomy": "Show exactly four canine limbs total with every paw on the ground: a plain four-leg standing pose or a seated pose with both front paws planted. No raised, pointing, waving or holding paw; props sit beside Maui or are held in his mouth. Never draw a third front paw.",
    "bandana": "Red neck bandana with clearly readable white MAUI text and a small white paw emblem, facing the viewer.",
    "edges": "Keep the whole character, tail, ears, paws and every prop fully inside the frame with 10 to 15 percent empty margin on all sides. Nothing clipped or faded.",
    "style": "Crisp vector-like cel-shaded raster illustration with thick dark burgundy outlines and flat cream/tan shading. Not painterly, sketchy, 3D, photoreal or pixel art.",
    "scene": "Depict the requested article scene with safe grooming props only.",
    "clean_text": "No text, letters, labels, captions or watermark anywhere except the word MAUI on the bandana. Checklists and papers must show only blank lines or check marks, never words.",
    "transparency": "Export correction needed, not a new generation: re-run the background extractor with reviewed seeds.",
}

MAUI_STANDARD = {
    "appearance": "Fluffy cream-white dog with a rounded head, floppy ears, compact canine torso, short rounded paws, dark burgundy eyes and nose, friendly smile with pink tongue. Thick dark burgundy exterior outlines, thinner interior lines, solid cream/ivory fur with warm tan angular cel-shaded shapes. Crisp vector-like raster illustration.",
    "anatomy": "Exactly four canine limbs total (two front, two rear). Natural occlusion is fine: depending on the angle a seated or standing dog may show three or all four paws, with a hidden leg tucked behind the body or a prop. Any fifth paw, third front paw, unassignable paw, or human leg proportions is a failure.",
    "bandana": "Red bandana tied around the neck with readable white MAUI text and a small white paw emblem. It may be naturally partly hidden by a towel or tub, but never replaced with a different name.",
    "composition": "Complete character and all props fully inside the canvas. Complete tails, ears, paws, tables, brushes and sleeve cuffs. No edge clipping, faded parts or ghosted objects. Breathing room of 10 to 15 percent is the target, but because the background is removed for site use any measured margin of at least 3 percent with nothing clipped is acceptable.",
    "text": "No captions, labels or watermarks anywhere except MAUI on the bandana.",
    "safety": "Scene must match the article and never depict unsafe grooming advice, needles, medicine or dangerous tools near the dog.",
    "final_export": "Site images must have real transparency: no cream rectangle, checkerboard or white sticker border behind the character, and no holes erased out of the fur. For inspection the transparent PNG is flattened onto a solid teal canvas, so a solid teal background in the observations means the transparency is working.",
}


# ----------------------------------------------------------------------------- helpers
def digest(path: Path) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _parse_env_file(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for line in path.read_text(errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line[len("export "):]
        key, value = line.split("=", 1)
        out[key.strip()] = value.strip().strip('"').strip("'")
    return out


def resolve_key(names: list[str], project_root: Path | None) -> str | None:
    sources = [dict(os.environ)]
    if project_root:
        sources.append(_parse_env_file(Path(project_root) / ".env.local"))
    sources.append(_parse_env_file(Path.home() / ".hermes" / ".env"))
    for source in sources:
        for name in names:
            value = source.get(name)
            if value:
                return value
    return None


def _post_json(url: str, body: dict, headers: dict, timeout: int = 180, retries: int = 3) -> dict:
    data = json.dumps(body).encode()
    last_error: Exception | None = None
    for attempt in range(retries):
        request = urllib.request.Request(url, data=data, method="POST",
                                         headers={"Content-Type": "application/json", **headers})
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode())
        except urllib.error.HTTPError as error:
            text = error.read().decode(errors="replace")[:600]
            last_error = RuntimeError(f"HTTP {error.code} from {url.split('/v1')[0]}: {text}")
            if error.code not in (429, 500, 502, 503, 529):
                break
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = RuntimeError(f"network error calling {url.split('/v1')[0]}: {error}")
        time.sleep(2 ** attempt)
    raise last_error or RuntimeError("request failed")


def _load_checker():
    spec = importlib.util.spec_from_file_location("check_maui_image", SCRIPT_DIR / "check-maui-image.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def measure_margins(image_path: Path, tolerance: int = 24) -> dict:
    """Measure the subject's distance from each edge in code: alpha bbox for RGBA exports,
    otherwise pixels that differ from the border's background color."""
    from PIL import Image, ImageChops

    with Image.open(image_path) as image:
        image.load()
        width, height = image.size
        if image.mode == "RGBA" and image.getchannel("A").getextrema()[0] == 0:
            mask = image.getchannel("A").point(lambda value: 255 if value > 8 else 0)
        else:
            rgb = image.convert("RGB")
            step = max(1, min(width, height) // 128)
            border = [rgb.getpixel((x, y)) for x in range(0, width, step) for y in (0, 3, height - 4, height - 1)] \
                + [rgb.getpixel((x, y)) for y in range(0, height, step) for x in (0, 3, width - 4, width - 1)]
            paper = tuple(sorted(channel)[len(border) // 2] for channel in zip(*border))
            diff = ImageChops.difference(rgb, Image.new("RGB", rgb.size, paper)).split()
            mask = ImageChops.lighter(ImageChops.lighter(diff[0], diff[1]), diff[2]).point(lambda value: 255 if value > tolerance else 0)
        bounds = mask.getbbox()
    if not bounds:
        return {"bounds": None, "fractions": None, "smallest_percent": 0}
    x0, y0, x1, y1 = bounds
    fractions = [x0 / width, y0 / height, (width - x1) / width, (height - y1) / height]
    return {"bounds": bounds, "fractions": [round(f, 4) for f in fractions], "smallest_percent": int(min(fractions) * 100)}


def composite_on_teal(image_path: Path, out_path: Path) -> Path:
    """Flatten an RGBA final onto teal so a vision model can see holes, rectangles and edges."""
    from PIL import Image

    with Image.open(image_path) as image:
        rgba = image.convert("RGBA")
        teal = Image.new("RGBA", rgba.size, (31, 111, 120, 255))
        teal.alpha_composite(rgba)
        teal.convert("RGB").save(out_path, format="PNG")
    return out_path


# ------------------------------------------------------------------- stage A: observe
OBSERVATION_SCHEMA = {
    "character_count": "integer: number of dog characters drawn",
    "front_paws_visible": "integer: every front paw you can see, including a raised, waving or pointing one",
    "rear_paws_visible": "integer",
    "visible_limbs_total": "integer: total distinct legs or paws you can see, counting a raised paw as one",
    "occlusion_explanation": "string: which limbs are hidden and by what",
    "extra_limb_suspected": "boolean: any paw that cannot be assigned to one of four limbs",
    "raised_paw": "boolean: any paw lifted off the ground, waving, pointing, resting on or holding an object",
    "paws_on_ground": "integer: paws touching the ground or floor surface",
    "limb_count_certainty": "one of: clear, ambiguous",
    "human_proportions": "boolean",
    "tail": "one of: complete, partly hidden, missing, clipped by frame",
    "ears_visible": "integer",
    "face_match_notes": "string: compare eyes, nose, smile, head shape and ear shape to the reference image",
    "fur_color": "string",
    "outline_color": "string",
    "outline_matches_reference": "boolean: exterior outline color and thickness look the same as in the reference image",
    "line_weight": "one of: thick clean, thin, sketchy, none",
    "shading_style": "one of: flat cel, painterly, sketchy, 3d, photoreal, pixel",
    "bandana_color": "string or 'none'",
    "bandana_text_read": "string exactly as read, or 'not visible'",
    "paw_emblem_visible": "boolean",
    "props": "array of strings",
    "unsafe_items": "array of strings (needles, medicine, blades near the dog, etc.)",
    "text_elsewhere": "string: any letters or words visible outside the bandana, exactly as read, or ''",
    "paper_contents": "one of: none, blank lines or checkboxes only, symbols or emblems only, readable words (describe what any paper, sign, folder or label shows)",
    "watermark": "boolean",
    "clipped_elements": "array of strings touching or cut by the frame edge",
    "smallest_margin_percent": "integer estimate of the smallest gap between subject and frame edge",
    "background": "string description",
    "background_is_solid_cream": "boolean",
    "rectangle_or_checkerboard_behind_character": "boolean (final export check)",
    "holes_in_character": "boolean: a visible patch of background color inside the fur or body where it should be solid, clearly larger than a pixel speck; ignore antialiased outline edges",
    "edge_quality": "one of: clean, jagged, white halo, not applicable",
    "scene_summary": "string: what Maui is doing and with what",
    "notes": "string: anything unusual",
}


def observe(image_path: Path, reference_path: Path, scene: str, stage: str, model: str, key: str) -> dict:
    def data_url(path: Path) -> str:
        return "data:image/png;base64," + base64.b64encode(Path(path).read_bytes()).decode()

    instructions = (
        "You are an illustration inspector. The FIRST image is the approved appearance reference for a "
        "mascot dog named Maui. The SECOND image is a new candidate illustration"
        + (" already exported with a transparent background and composited onto teal" if stage == "final" else "")
        + ". Report literal observations about the SECOND image only, comparing to the first where asked. "
        "Count carefully: zoom mentally on every paw and decide which of four limbs it belongs to. "
        "Do not judge whether the image passes; only observe. Reply with one JSON object using exactly these keys:\n"
        + json.dumps(OBSERVATION_SCHEMA, indent=1)
        + f"\n\nThe article scene brief is: {scene}"
    )
    body = {
        "model": model,
        "response_format": {"type": "json_object"},
        "max_completion_tokens": 1800,
        "messages": [
            {"role": "system", "content": "Return only valid JSON. Observe, never decide."},
            {"role": "user", "content": [
                {"type": "text", "text": instructions},
                {"type": "image_url", "image_url": {"url": data_url(reference_path), "detail": "high"}},
                {"type": "image_url", "image_url": {"url": data_url(image_path), "detail": "high"}},
            ]},
        ],
    }
    response = _post_json(OPENAI_URL, body, {"Authorization": f"Bearer {key}"}, timeout=240)
    content = response["choices"][0]["message"]["content"].strip()
    if content.startswith("```"):
        content = content.strip("`").split("\n", 1)[1] if "\n" in content else content.strip("`")
        content = content.removesuffix("```").strip()
    observations = json.loads(content)
    observations["_vision_model"] = response.get("model", model)
    return observations


# --------------------------------------------------------------------- stage B: judge
def build_questions(stage: str) -> dict:
    noul = lambda instructions, yes, no: {"type": "noul", "instructions": instructions, "criteria": {"true": yes, "false": no}}
    questions = {
        "identity": noul(
            "Using `observations.face_match_notes`, `observations.fur_color`, `observations.ears_visible` and `observations.character_count`, does the candidate depict the same Maui described in `maui_standard.appearance`, as a single character?",
            "Same rounded cream-white dog with floppy ears, dark burgundy eyes and nose, burgundy outlines, cream/tan fur, one character only",
            "Different breed, different face, different colors, generic puppy, or more than one character"),
        "anatomy": noul(
            "Using the paw and limb fields in `observations`, does the character have exactly four canine limbs allowing natural occlusion, with no extra paw and no human proportions, per `maui_standard.anatomy`? Count strictly from the numbers: a dog has two front limbs and two rear limbs, so `front_paws_visible` greater than 2, `rear_paws_visible` greater than 2, or `visible_limbs_total` greater than 4 means an extra limb even if the observer did not flag it. a raised or holding paw is fine when the visible limb counts stay within four; more than four visible limbs is an automatic no: the image model reliably draws a fifth limb when a paw is raised and observers misassign the planted paws. A standing dog with `raised_paw` true and `paws_on_ground` of 3 has five limbs.",
            "`raised_paw` false, `front_paws_visible` at most 2, `rear_paws_visible` at most 2, `visible_limbs_total` at most 4, `extra_limb_suspected` false, and dog proportions",
            "`raised_paw` true, more than two front paws, more than two rear paws, more than four visible limbs, an unassignable or suspected extra paw, a visibly missing limb, or human leg proportions"),
        "bandana": noul(
            "Using `observations.bandana_color`, `observations.bandana_text_read` and `observations.paw_emblem_visible`, does the bandana meet `maui_standard.bandana`?",
            "Red bandana whose text reads MAUI (or is naturally partly hidden with no other name shown)",
            "No bandana, a different color, a different or misspelled name, or unreadable garbled letters where text should be"),
        "edges": noul(
            "Using `observations.clipped_elements`, `observations.tail` and the code-measured `observations.measured_smallest_margin_percent`, is the whole character and every prop complete inside the frame, per `maui_standard.composition`? A tail that is merely partly hidden behind the body is natural occlusion, not clipping.",
            "`clipped_elements` is empty, the tail is not missing or clipped by the frame, and the measured margin is at least 3 percent",
            "Any element clipped or cut off by the frame edge, a missing or frame-clipped tail, or a measured margin under 3 percent"),
        "style": noul(
            "Using `observations.shading_style`, `observations.line_weight` and `observations.outline_matches_reference`, is the candidate rendered in the same crisp cel-shaded vector-like style as the approved reference, per `maui_standard.appearance`? The exact color name used for the outline does not matter as long as it matches the reference.",
            "Flat cel shading with thick clean outlines that match the reference",
            "Painterly, sketchy, 3D, photorealistic or pixel art rendering, or outlines clearly unlike the reference"),
        "scene": noul(
            "Using `observations.scene_summary`, `observations.props` and `observations.unsafe_items`, does the image depict `article_scene_brief` safely, per `maui_standard.safety`?",
            "The scene matches the brief and shows only safe grooming props",
            "The scene does not match the brief, or shows needles, medicine, blades at the dog, or other unsafe content"),
        "clean_text": noul(
            "Using `observations.text_elsewhere`, `observations.paper_contents` and `observations.watermark`, is the image free of any readable text or watermark apart from MAUI on the bandana, per `maui_standard.text`? Papers, folders or checklists showing only blank lines, checkboxes, check marks or a paw emblem count as no text.",
            "`text_elsewhere` is empty and `watermark` is false; any paper shows at most blank lines, checkboxes or emblems",
            "`text_elsewhere` contains letters or words, `paper_contents` is readable words, or a watermark is present"),
    }
    if stage == "final":
        questions["transparency"] = noul(
            "The transparent export was composited onto a solid teal canvas before inspection, so `observations.background` being solid teal is the expected, correct result. Using only `observations.rectangle_or_checkerboard_behind_character`, `observations.holes_in_character` and `observations.edge_quality`, is the export clean per `maui_standard.final_export`?",
            "`rectangle_or_checkerboard_behind_character` is false, `holes_in_character` is false, and `edge_quality` is clean",
            "A cream or white rectangle or checkerboard behind the character, a hole inside the character, or a jagged or white-halo edge")
    questions["readiness"] = {
        "type": "score",
        "instructions": "Overall, how close is this candidate to an approved GroomLocal Maui illustration, considering every field in `observations` against `maui_standard`?",
        "criteria": [
            "Clearly unusable: wrong character, extra limbs, wrong name, or major clipping",
            "Noticeable defects that need a new generation",
            "Minor imperfection a careful reviewer might still accept",
            "Matches the approved Maui standard and is ready for the article",
        ],
    }
    return questions


def judge(observations: dict, scene: str, stage: str, key: str) -> dict:
    clean = {k: v for k, v in observations.items() if not k.startswith("_")}
    body = {
        "model": JEV_MODEL,
        "state": {
            "observations": clean,
            "article_scene_brief": scene,
            "review_stage": stage,
            "maui_standard": MAUI_STANDARD,
        },
        "questions": build_questions(stage),
    }
    response = _post_json(JEV_URL, body, {"Authorization": f"Bearer {key}"}, timeout=120)
    return response


def decide(answers: dict, stage: str, threshold: float, observations: dict | None = None) -> dict:
    keys = GATE_KEYS_FINAL if stage == "final" else GATE_KEYS_MASTER
    probabilities = {k: float(answers[k]["noul"]) for k in keys if k in answers}
    # Hard rule owned by code, independent of Jev: more than four visible limbs is a
    # rejection. Observers misassign planted paws in exactly these images. A raised or
    # holding paw is NOT a rejection on its own: apron Maui is bipedal by the owner's
    # standard (2026-09-15), so limb counts decide, not pose.
    if observations:
        over = any(int(observations.get(k) or 0) > limit for k, limit in
                   (("front_paws_visible", 2), ("rear_paws_visible", 2), ("visible_limbs_total", 4)))
        if over and "anatomy" in probabilities:
            probabilities["anatomy"] = min(probabilities["anatomy"], 0.05)
    missing = [k for k in keys if k not in probabilities]
    failing = sorted([k for k, p in probabilities.items() if p < threshold] + missing)
    readiness = answers.get("readiness", {})
    return {
        "threshold": threshold,
        "gates": probabilities,
        "weakest_gate": min(probabilities, key=probabilities.get) if probabilities else None,
        "min_probability": min(probabilities.values()) if probabilities else 0.0,
        "readiness_score": float(readiness.get("score", 0.0)),
        "readiness_confidence": float(readiness.get("confidence", 0.0)),
        "failing": failing,
        "passed": not failing,
    }


def correction_text(failing: list[str]) -> str:
    hints = [CORRECTION_HINTS[k] for k in failing if k in CORRECTION_HINTS and k != "transparency"]
    if not hints:
        return ""
    return "Correction from the previous rejected attempt: " + " ".join(hints)


def build_review(final_path: Path, reference_path: Path, observations: dict, decision: dict, file_report: dict) -> dict:
    checks = {
        "identity": decision["gates"].get("identity", 0) >= decision["threshold"],
        "anatomy": decision["gates"].get("anatomy", 0) >= decision["threshold"],
        "bandana": decision["gates"].get("bandana", 0) >= decision["threshold"],
        "completeEdges": decision["gates"].get("edges", 0) >= decision["threshold"],
        "transparency": bool(file_report.get("fileChecksPass")) and decision["gates"].get("transparency", 0) >= decision["threshold"],
        "sceneSafety": decision["gates"].get("scene", 0) >= decision["threshold"] and decision["gates"].get("clean_text", 0) >= decision["threshold"],
    }
    approved = all(checks.values()) and decision["passed"]
    evidence = (
        f"Vision model {observations.get('_vision_model', 'unknown')} observed: front paws {observations.get('front_paws_visible')}, "
        f"rear paws {observations.get('rear_paws_visible')}, occlusion: {observations.get('occlusion_explanation')}; tail {observations.get('tail')}; "
        f"bandana reads '{observations.get('bandana_text_read')}'; text elsewhere '{observations.get('text_elsewhere')}'; "
        f"background: {observations.get('background')}; edge quality {observations.get('edge_quality')}. "
        f"Jev gate probabilities: {json.dumps(decision['gates'])} against threshold {decision['threshold']}; "
        f"readiness {decision['readiness_score']:.2f}/3. File checks: alpha {file_report.get('alphaRange')}, margins {file_report.get('marginFractions')}."
    )
    return {
        "sha256": digest(final_path),
        "referenceSha256": digest(reference_path),
        "reviewer": f"automated: vision {observations.get('_vision_model', 'unknown')} observations + TypeSafe {JEV_MODEL} judgments (maui-jev-gate.py)",
        "reviewedAt": datetime.now(timezone.utc).isoformat(),
        "decision": "approved" if approved else "rejected",
        "checks": checks,
        "evidence": evidence,
    }


# -------------------------------------------------------------------------------- main
def run_gate(image: Path, reference: Path, scene: str, stage: str, threshold: float,
             project_root: Path | None, vision_model: str, observations: dict | None = None,
             work_dir: Path | None = None) -> dict:
    openai_key = resolve_key(["OPENAI_API_KEY", "VOICE_TOOLS_OPENAI_KEY"], project_root)
    jev_key = resolve_key(["TYPESAFE_API_KEY"], project_root)
    if observations is None and not openai_key:
        raise RuntimeError("No OPENAI_API_KEY / VOICE_TOOLS_OPENAI_KEY available for the vision observation step")
    if not jev_key:
        raise RuntimeError("No TYPESAFE_API_KEY available for the Jev judgment step")

    looked_at = image
    file_report = None
    if stage == "final":
        checker = _load_checker()
        file_report = checker.inspect(image)
        work_dir = work_dir or image.parent
        looked_at = composite_on_teal(image, work_dir / (image.stem + "-on-teal.png"))

    if observations is None:
        observations = observe(looked_at, reference, scene, stage, vision_model, openai_key)
    margins = measure_margins(image)
    observations["measured_smallest_margin_percent"] = margins["smallest_percent"]
    observations["_measured_margins"] = margins
    jev = judge(observations, scene, stage, jev_key)
    decision = decide(jev["answers"], stage, threshold, observations)
    if stage == "final" and file_report and not file_report["fileChecksPass"]:
        decision["passed"] = False
        decision["failing"] = sorted(set(decision["failing"]) | {"file_checks"})
    result = {
        "image": str(image),
        "sha256": digest(image),
        "reference": str(reference),
        "referenceSha256": digest(reference),
        "stage": stage,
        "scene": scene,
        "looked_at": str(looked_at),
        "vision_model": observations.get("_vision_model", vision_model),
        "jev_model": jev.get("model"),
        "jev_usage": jev.get("usage"),
        "observations": {k: v for k, v in observations.items() if not k.startswith("_")},
        "measured_margins": margins,
        "answers": jev["answers"],
        "decision": decision,
        "correction": correction_text(decision["failing"]),
        "file_checks": file_report,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("image", type=Path)
    parser.add_argument("--scene", required=True, help="article scene brief the image must depict")
    parser.add_argument("--stage", choices=["master", "final"], default="master")
    parser.add_argument("--reference", type=Path, default=DEFAULT_REFERENCE)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument("--project-root", type=Path, default=None)
    parser.add_argument("--vision-model", default=DEFAULT_VISION_MODEL)
    parser.add_argument("--observations", type=Path, help="reuse saved observations instead of calling the vision model")
    parser.add_argument("--out", type=Path, help="where to write the gate JSON (default: <image>.jev-gate.json)")
    parser.add_argument("--review-out", type=Path, help="final stage: write image-review.json here when the gate passes")
    args = parser.parse_args()

    if not args.image.is_file():
        print(json.dumps({"passed": False, "error": f"image not found: {args.image}"}))
        return 1
    if not args.reference.is_file():
        print(json.dumps({"passed": False, "error": f"reference not found: {args.reference}"}))
        return 1
    observations = json.loads(args.observations.read_text()) if args.observations else None
    try:
        result = run_gate(args.image, args.reference, args.scene, args.stage, args.threshold,
                          args.project_root, args.vision_model, observations)
    except (RuntimeError, KeyError, ValueError, json.JSONDecodeError) as error:
        print(json.dumps({"passed": False, "error": str(error)}))
        return 1

    out = args.out or args.image.with_name(args.image.stem + ".jev-gate.json")
    out.write_text(json.dumps(result, indent=2))
    if args.stage == "final" and args.review_out and result["decision"]["passed"]:
        review = build_review(args.image, args.reference, {**result["observations"], "_vision_model": result["vision_model"]},
                              result["decision"], result["file_checks"] or {})
        args.review_out.write_text(json.dumps(review, indent=2))
        result["review_written"] = str(args.review_out)
    summary = {k: result[k] for k in ("image", "stage", "vision_model", "jev_model")}
    summary["decision"] = result["decision"]
    summary["correction"] = result["correction"]
    summary["gate_file"] = str(out)
    if "review_written" in result:
        summary["review_written"] = result["review_written"]
    print(json.dumps(summary, indent=2))
    return 0 if result["decision"]["passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
