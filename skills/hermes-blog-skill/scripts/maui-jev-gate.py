#!/usr/bin/env python3
"""Two-stage Maui art gate.

Stage A: a vision model looks at the candidate beside the approved reference and
records literal observations (paw counts, tail, bandana text, props, stray text).
It never decides pass/fail.

Stage B: TypeSafe Jev (text-only System One model) turns those observations plus
the Maui standard into calibrated yes/no probabilities, one per gate. Code then
applies a single threshold. Every gate must reach the threshold to pass.
With --acting, code adds an acting gate from the observer's face fields: the face
must perform the action, not repeat the reference's front-facing grin.

Usage:
  maui-jev-gate.py <image.png> --scene "<article scene brief>" [--stage master|final]
                   [--reference brushing-v2.png] [--threshold 0.85]
                   [--project-root <checkout>] [--out gate.json]
                   [--review-out image-review.json]   (final stage only)
                   [--vision-model gpt-5.4] [--observations existing.json]
                   [--pose-mode planted|upright|free] [--paws-down-max N] [--pose-note TEXT]
                   [--acting] [--eyes-ok prop,closed,viewer] [--stock-face-ok]

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
from typing import NamedTuple

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
    "identity": "Match the approved reference's facial features exactly: same rounded fluffy cream-white head, floppy ears, dark burgundy eyes and nose, friendly smile. Do not restyle Maui. The head angle and eye direction may differ from the reference.",
    "anatomy": "Show exactly four canine limbs total with every paw on the ground: a plain four-leg standing pose or a seated pose with both front paws planted. No raised, pointing, waving or holding paw; props rest on the ground near his paws or are held in his mouth. An upright pose on the hind legs is a separate action. Never draw a third front paw.",
    "anatomy_upright": "Upright pose: Maui is on his two short hind legs with both hind paws on the ground, and his two front paws are off the ground as the Body position line says. Exactly two front paws and two hind paws, no third paw anywhere, short compact dog legs, no human torso.",
    "anatomy_free": "Draw exactly four legs, each one clearly separate and traceable from a shoulder or hip to its paw, in the pose the Body position line describes. Never a fifth leg or a third front paw. If a leg is hidden, hide it fully behind the body or the set piece.",
    "bandana": "Red neck bandana with clearly readable white MAUI text and a small white paw emblem, facing the viewer.",
    "edges": "Keep the whole character, tail, ears, paws and every prop fully inside the frame with 10 to 15 percent empty margin on all sides. Nothing clipped or faded. The previous attempt ran off the frame, so draw the whole scene smaller and centered, and use only small freestanding props: no counter, desk, shelf, table or bench that extends toward the side of the picture. Any furniture must be short, end well inside the frame, and have plain empty background visible beyond it on every side.",
    "style": "Crisp vector-like cel-shaded raster illustration with thick dark burgundy outlines and flat cream/tan shading. Not painterly, sketchy, 3D, photoreal or pixel art.",
    "scene": "Depict the requested article scene with safe grooming props only.",
    "acting": "The previous attempt's face did not act: it repeated the reference's front-facing grin or looked away from the action. Redraw the head angle, eye direction, eyelids and mouth exactly as the Face line describes. Same features as the reference, a different expression.",
    "clean_text": "No text, letters, labels, captions or watermark anywhere except the word MAUI on the bandana. Checklists and papers must show only blank lines or check marks, never words.",
    "transparency": "Export correction needed, not a new generation: re-run the background extractor with reviewed seeds.",
}

MAUI_STANDARD = {
    "appearance": "Fluffy cream-white dog with a rounded head, floppy ears, compact canine torso, short rounded paws, dark burgundy eyes and nose, friendly face. Head angle, eye direction, eyelids, mouth and ears act out the scene; the features stay the same. Thick dark burgundy exterior outlines, thinner interior lines, solid cream/ivory fur with warm tan angular cel-shaded shapes. Crisp vector-like raster illustration.",
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
class Pose(NamedTuple):
    """How the limbs are meant to sit, so the hard anatomy rules match the pose that was asked for.

    planted: every visible paw on the ground; a raised paw is rejected (the generator adds a fifth limb).
    upright: on the hind legs, front paws off the ground (owner standard for apron and prop scenes).
    free:    an action pose whose paws leave the ground by design (leap, belly-up roll, peeking over an edge).
    """
    mode: str = "planted"
    paws_down_max: int | None = None
    note: str = ""

    @property
    def max_down(self) -> int:
        if self.paws_down_max is not None:
            return self.paws_down_max
        return {"planted": 4, "upright": 2, "free": 4}[self.mode]


class Acting(NamedTuple):
    """What the face may do for this action. `eyes_ok` holds any of: prop, closed, viewer."""
    eyes_ok: tuple[str, ...] = ("prop",)
    stock_face_ok: bool = False


# Without the upright note the observer labels an upright dog's two standing legs as front paws
# and reports four front paws (pose test 2026-09-28, attempt 1: four limbs, gate said six).
OBSERVER_NOTES = {
    "planted": "",
    "upright": (
        "\n\nPose note: this candidate is intentionally UPRIGHT on the hind legs. His REAR paws are the two feet at "
        "the bottom of the figure. His FRONT paws are the paws at the ends of his two upper limbs (arms), usually "
        "holding, hugging or reaching for a prop; a front limb reaching across the body is still one front limb. "
        "Count front and rear by that rule, and trace each arm from the shoulder to its paw before counting. "
        "Standing or sitting upright is the intended pose: report human_proportions true only if the legs, torso "
        "or paws themselves look human."
    ),
    "free": (
        "\n\nPose note: this candidate is an intentional ACTION pose, so paws may be in the air, on a set piece, or "
        "hidden behind it. Trace every leg from its shoulder or hip to its paw before counting, and count a leg "
        "only once. A paw resting on a tub edge, window or box is a raised paw, not a paw on the ground."
    ),
}
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
    "human_proportions": "boolean: true only for human-like body parts (long human legs, hands with fingers, an elongated human torso); an upright mascot stance on short dog legs is NOT human proportions",
    "tail": "one of: complete, partly hidden, fully hidden behind his body or inside a towel or set piece, missing (erased or left out where it should show), clipped by frame",
    "ears_visible": "integer",
    "face_match_notes": "string: compare only the features (eye shape and color, nose, muzzle, head shape, ear shape) to the reference image. Do not mention head angle, eye direction or expression here; they have their own fields and may differ from the reference on purpose",
    "eyes_look_at": "one of: the viewer, the prop or task he is working on, another prop, nothing in particular, eyes are closed. Decide from where the pupils sit inside the eyes and where the nose points, not from the scene brief. Pupils centered with the face straight on means the viewer",
    "head_angle": "one of: straight on, three-quarter, profile, tipped down",
    "mouth": "one of: open grin with tongue out like the reference, small closed smile, closed with tongue tip showing, small round open mouth, wide open laughing or panting, holding an object, hidden",
    "expression": "string: what the face is doing in plain words, e.g. concentrating with narrowed eyes, blissful with closed eyes, surprised",
    "copies_reference_camera_grin": "boolean: true when the head angle, eye direction AND mouth all repeat the reference image's front-facing grin at the camera; false when any of them changed",
    "fur_color": "string",
    "outline_color": "string",
    "outline_matches_reference": "boolean: exterior outline color and thickness look the same as in the reference image",
    "line_weight": "one of: thick clean, thin, sketchy, none",
    "shading_style": "one of: flat cel, painterly, sketchy, 3d, photoreal, pixel",
    "bandana_color": "string or 'none'",
    "bandana_text_read": "string exactly as read, or 'not visible'",
    "paw_emblem_visible": "boolean",
    "props": "array of strings",
    "unsafe_items": "array of strings: only real hazards such as needles, medicine, open blades at the dog, fire. Ordinary grooming things (brush, comb, dryer, nail clipper, towel, shampoo, tub) are safe and never belong here",
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


def observe(image_path: Path, reference_path: Path, scene: str, stage: str, model: str, key: str,
            pose: Pose = Pose()) -> dict:
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
        + OBSERVER_NOTES[pose.mode]
        + (f"\nThe intended body position is: {pose.note}" if pose.note else "")
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
def build_questions(stage: str, pose: Pose = Pose()) -> dict:
    noul = lambda instructions, yes, no: {"type": "noul", "instructions": instructions, "criteria": {"true": yes, "false": no}}
    if pose.mode == "planted":
        anatomy = noul(
            "Using the paw and limb fields in `observations`, does the character have exactly four canine limbs allowing natural occlusion, with no extra paw and no human proportions, per `maui_standard.anatomy`? Count strictly from the numbers: a dog has two front limbs and two rear limbs, so `front_paws_visible` greater than 2, `rear_paws_visible` greater than 2, or `visible_limbs_total` greater than 4 means an extra limb even if the observer did not flag it. `raised_paw` true is an automatic no: the image model reliably draws a fifth limb when a paw is raised and observers misassign the planted paws. A standing dog with `raised_paw` true and `paws_on_ground` of 3 has five limbs.",
            "`raised_paw` false, `front_paws_visible` at most 2, `rear_paws_visible` at most 2, `visible_limbs_total` at most 4, `extra_limb_suspected` false, and dog proportions",
            "`raised_paw` true, more than two front paws, more than two rear paws, more than four visible limbs, an unassignable or suspected extra paw, a visibly missing limb, or human leg proportions")
    else:
        intent = ("an intentional UPRIGHT pose (owner standard: Maui often stands or sits up on his hind legs with his "
                  "front paws holding, hugging or reaching for a prop)" if pose.mode == "upright" else
                  "an intentional ACTION pose in which paws leave the ground or hide behind a set piece by design")
        anatomy = noul(
            f"This is {intent}; `intended_pose` describes it. Using the paw and limb fields in `observations`, does the character have exactly four canine limbs allowing natural occlusion, with short compact dog proportions? Count strictly: `front_paws_visible` greater than 2, `rear_paws_visible` greater than 2, `visible_limbs_total` greater than 4, or `paws_on_ground` greater than {pose.max_down} means an extra limb even if the observer did not flag it. `raised_paw` true is expected here and is not a defect by itself. Limbs hidden behind the body or a set piece are natural occlusion.",
            f"`front_paws_visible` at most 2, `rear_paws_visible` at most 2, `visible_limbs_total` at most 4, `paws_on_ground` at most {pose.max_down}, `extra_limb_suspected` false, short dog legs and compact torso",
            f"more than two front paws, more than two rear paws, more than four visible limbs, more than {pose.max_down} paws on the ground, an unassignable or suspected extra paw, or an elongated human torso or human legs")
    questions = {
        "identity": noul(
            "Using `observations.face_match_notes`, `observations.fur_color`, `observations.ears_visible` and `observations.character_count`, does the candidate depict the same Maui described in `maui_standard.appearance`, as a single character? A turned head, a different eye direction or a calmer expression is intended and does not count against identity.",
            "Same rounded cream-white dog with floppy ears, dark burgundy eyes and nose, burgundy outlines, cream/tan fur, one character only",
            "Different breed, different face, different colors, generic puppy, or more than one character"),
        "anatomy": anatomy,
        "bandana": noul(
            "Using `observations.bandana_color`, `observations.bandana_text_read` and `observations.paw_emblem_visible`, does the bandana meet `maui_standard.bandana`?",
            "Red bandana whose text reads MAUI (or is naturally partly hidden with no other name shown)",
            "No bandana, a different color, a different or misspelled name, or unreadable garbled letters where text should be"),
        "edges": noul(
            "Using `observations.clipped_elements`, `observations.tail` and the code-measured `observations.measured_smallest_margin_percent`, is the whole character and every prop complete inside the frame, per `maui_standard.composition`? A tail that is partly or fully hidden behind the body, a towel or a set piece is natural occlusion, not clipping.",
            "`clipped_elements` is empty, the tail is complete or hidden by the scene and not erased or clipped by the frame, and the measured margin is at least 3 percent",
            "Any element clipped or cut off by the frame edge, an erased or frame-clipped tail, or a measured margin under 3 percent"),
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


# Acting is decided in code (acting_probability); Jev never sees these fields. With them in its
# state, a turned head read as "not the same face" and identity fell to 0.76-0.80 (test 2026-10-05).
ACTING_FIELDS = ("eyes_look_at", "head_angle", "mouth", "expression", "copies_reference_camera_grin")
INTENDED_POSE = {
    "planted": "four-legged: standing, seated or lying with every visible paw down",
    "upright": "upright on the two hind paws, front paws holding, hugging or reaching for a prop",
    "free": "action pose with paws off the ground or hidden behind a set piece",
}


def judge(observations: dict, scene: str, stage: str, key: str, pose: Pose = Pose()) -> dict:
    clean = {k: v for k, v in observations.items() if not k.startswith("_") and k not in ACTING_FIELDS}
    body = {
        "model": JEV_MODEL,
        "state": {
            "observations": clean,
            "article_scene_brief": scene,
            "review_stage": stage,
            "maui_standard": MAUI_STANDARD,
            "intended_pose": pose.note or INTENDED_POSE[pose.mode],
        },
        "questions": build_questions(stage, pose),
    }
    response = _post_json(JEV_URL, body, {"Authorization": f"Bearer {key}"}, timeout=120)
    return response


def acting_probability(observations: dict | None, acting: Acting) -> float | None:
    """Code-owned acting gate (owner feedback 2026-10-05 and 2026-11-13): the face performs the action.

    The stock face (the reference's front-facing open grin) fails unless the action is a joy beat
    that calls for it. Eyes must be on the work, or closed or on the viewer where the action allows.
    """
    if not observations or "eyes_look_at" not in observations:
        return None
    target = str(observations.get("eyes_look_at", "")).lower()
    kind = ("viewer" if "viewer" in target else "closed" if "closed" in target
            else "prop" if ("prop" in target or "task" in target) else "none")
    if observations.get("copies_reference_camera_grin") is True and not acting.stock_face_ok:
        return 0.0
    if kind == "viewer" and "viewer" not in acting.eyes_ok:
        return 0.0
    stock_mouth = str(observations.get("mouth", "")).lower().startswith("open grin")
    if stock_mouth and not acting.stock_face_ok:
        return 0.4  # head turned, but still wearing the reference's grin
    if kind == "prop" or kind in acting.eyes_ok:
        return 1.0
    return 0.3  # staring at nothing, or eyes shut where the action needs them open


def decide(answers: dict, stage: str, threshold: float, observations: dict | None = None,
           pose: Pose = Pose(), acting: Acting | None = None) -> dict:
    keys = (GATE_KEYS_FINAL if stage == "final" else GATE_KEYS_MASTER) + (["acting"] if acting else [])
    probabilities = {k: float(answers[k]["noul"]) for k in keys if k in answers}
    if acting and (score := acting_probability(observations, acting)) is not None:
        probabilities["acting"] = score
    # Hard rules owned by code, independent of Jev. More than two front paws, two rear paws or
    # four limbs is always a rejection. Planted poses also reject any raised paw (observers
    # misassign planted paws in exactly those images). Upright and free poses raise paws by
    # design, so there the count of paws on the ground decides instead.
    if observations:
        over = any(int(observations.get(k) or 0) > limit for k, limit in
                   (("front_paws_visible", 2), ("rear_paws_visible", 2), ("visible_limbs_total", 4)))
        if pose.mode == "planted":
            raised = bool(observations.get("raised_paw"))
        else:
            over = over or int(observations.get("paws_on_ground") or 0) > pose.max_down
            raised = False
        if (raised or over) and "anatomy" in probabilities:
            probabilities["anatomy"] = min(probabilities["anatomy"], 0.0 if raised else 0.05)
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


def correction_text(failing: list[str], pose: Pose = Pose()) -> str:
    hints = [CORRECTION_HINTS[f"anatomy_{pose.mode}" if (k == "anatomy" and pose.mode != "planted") else k]
             for k in failing if k in CORRECTION_HINTS and k != "transparency"]
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
             work_dir: Path | None = None, pose: Pose = Pose(), acting: Acting | None = None) -> dict:
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
        observations = observe(looked_at, reference, scene, stage, vision_model, openai_key, pose)
    margins = measure_margins(image)
    observations["measured_smallest_margin_percent"] = margins["smallest_percent"]
    observations["_measured_margins"] = margins
    jev = judge(observations, scene, stage, jev_key, pose)
    decision = decide(jev["answers"], stage, threshold, observations, pose, acting)
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
        "pose_mode": pose.mode,
        "paws_down_max": pose.max_down,
        "acting": {"eyes_ok": list(acting.eyes_ok), "stock_face_ok": acting.stock_face_ok} if acting else None,
        "correction": correction_text(decision["failing"], pose),
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
    parser.add_argument("--pose-mode", choices=["planted", "upright", "free"], default="planted",
                        help="planted: every paw down, a raised paw is rejected. upright: on the hind legs. "
                             "free: action pose with paws off the ground. Limb counts are enforced in every mode")
    parser.add_argument("--paws-down-max", type=int, help="most paws that may touch the ground in this pose")
    parser.add_argument("--pose-note", default="", help="the intended body position, shown to the observer and to Jev")
    parser.add_argument("--acting", action="store_true",
                        help="add the acting gate: the face must perform the action, not repeat the reference grin")
    parser.add_argument("--eyes-ok", default="prop",
                        help="comma list of where the eyes may be for this action: prop, closed, viewer")
    parser.add_argument("--stock-face-ok", action="store_true",
                        help="joy actions only: the reference's open-mouth grin is the right face")
    args = parser.parse_args()

    if not args.image.is_file():
        print(json.dumps({"passed": False, "error": f"image not found: {args.image}"}))
        return 1
    if not args.reference.is_file():
        print(json.dumps({"passed": False, "error": f"reference not found: {args.reference}"}))
        return 1
    observations = json.loads(args.observations.read_text()) if args.observations else None
    try:
        pose = Pose(args.pose_mode, args.paws_down_max, args.pose_note)
        acting = (Acting(tuple(e.strip() for e in args.eyes_ok.split(",") if e.strip()), args.stock_face_ok)
                  if args.acting else None)
        result = run_gate(args.image, args.reference, args.scene, args.stage, args.threshold,
                          args.project_root, args.vision_model, observations, pose=pose, acting=acting)
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
