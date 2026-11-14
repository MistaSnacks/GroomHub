#!/usr/bin/env python3
"""Generate Maui art and keep going until the Jev gate passes or attempts run out.

Each attempt:
  1. generate an opaque cream master with the checkout's scripts/blog-hero-image.py
  2. gate the master (maui-jev-gate.py --stage master); on failure, append the
     gate's correction text to the next prompt and try again
  3. on a master pass, export the RGBA derivative with scripts/maui-remove-background.py,
     have a vision pass classify the extractor's numbered enclosed regions so only real
     background gaps become seeds (maui-export-seeds.py), re-extract with those seeds,
     fill pinhole specks (maui-fill-specks.py), run the byte-level checker, then gate
     the final on a teal composite
  4. on a final pass, write image-review.json in the checker's contract and confirm
     `check-maui-image.py --review --reference` reports approved

Stops at the first approved attempt. If every attempt fails, the best candidate is
kept as unapproved and the loop reports `exhausted`. If the only problem is the
transparent export, it reports `needs_export_review` so seeds can be reviewed
without spending another generation.

Usage:
  maui-art-loop.py --plan --run-dir <run dir>          list the actions, least used first
  maui-art-loop.py --project-root <checkout> --run-dir <run dir> --slug <slug>
                   --action <id> --scene "<scene>" [--mood ...] [--extra ...]
                   [--max-attempts 4] [--threshold 0.85] [--provider openai] [--model ID]
                   [--seeds seeds.json] [--reference brushing-v2.png]

Writes <run-dir>/art/attempt-N/{master.png,master.jev-gate.json,transparent/,final.jev-gate.json}
and <run-dir>/art/art-loop.json. Never writes into the checkout's public/ or docs/.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_REFERENCE = SCRIPT_DIR.parent / "references" / "maui" / "approved-reference" / "brushing-v2.png"
UV = shutil.which("uv") or str(Path.home() / ".local" / "bin" / "uv")
POSE_DIR = SCRIPT_DIR.parent / "references" / "maui" / "pose-reference"

# An ACTION is one designed beat: what the body does, what the face does, and how the limbs
# may sit. Body and face are written together because the owner's two complaints came from
# choosing them apart: a pose picked without the scene (10-28: "lying down" for a dryer on a
# table) and a face left at the reference's grin whatever Maui was doing (10-05, 11-13).
#   mode           planted | upright | free, the gate's anatomy rule for this action
#   paws_down_max  most paws that may touch the ground (None = the mode's default)
#   eyes_ok        where the eyes may be besides the work itself: closed, viewer
#   stock_face_ok  joy beats only: the reference's open grin is the right face
# Face lines never mention pupils or where the eyes point: that wording made the generator draw
# white around the eye, and the owner rejected it (2026-11-13). Maui's eyes are solid beady ovals.
# A loop keeps one action for every attempt. The scene names what Maui does ("peeking", "resting"),
# so switching to a sibling action fails the scene gate (test 2026-11-13: scene 0.49).
ACTIONS = [
    {"id": "groom-at-work", "mode": "upright", "ref": "bipedal-apron-tools.png",
     "suits": "brushing, combing, trimming, drying, any how-to step",
     "body": "bipedal: standing upright on his two short hind legs, both hind paws planted, his whole body leaning "
             "toward the thing he is grooming, one tool in each front paw, the working tool touching it",
     "face": "head tipped down and turned so his nose points at the exact spot where the tool touches, cheeks "
             "pushed up under his eyes in concentration, mouth closed with the tip of his pink tongue poking "
             "out at one corner, ears swinging forward"},
    {"id": "hug-carry", "mode": "upright", "ref": "bipedal-hug-jar.png",
     "suits": "bringing, packing, choosing, costs, supplies",
     "body": "bipedal: standing upright on his two short hind legs, both hind paws planted, both front paws wrapped "
             "around one big prop held against his chest, leaning back a little under its weight",
     "face": "chin resting on top of the prop, cheek fur squashed against it, nose pointing down into what he "
             "carries, small proud closed-mouth smile"},
    {"id": "reach-up", "mode": "upright", "ref": None,
     "suits": "catching, reaching, rain, snow, falling leaves, showers, treats",
     "body": "bipedal: stretched tall on his two short hind legs, both hind paws on the ground, both front paws "
             "reaching up together toward the main prop above his head, body in one long curve from tail to nose",
     "face": "head tipped far back with his nose pointing straight up at the prop, eyes big and round, mouth "
             "open in a small round 'ooh', ears falling back behind his head"},
    {"id": "sit-pretty", "mode": "upright", "ref": None,
     "suits": "waiting, asking, treats, first visits, meeting a groomer",
     "body": "sitting up on his haunches in a begging pose, both hind paws on the ground, both front paws tucked up "
             "against his chest, back straight, tail sweeping the floor",
     "face": "head tipped up with his nose pointing at the main prop, eyes big, round and hopeful, mouth "
             "closed in a tiny smile, ears lifted a little at the base"},
    {"id": "play-bow", "mode": "planted", "ref": "action-play-bow.png",
     "eyes_ok": ("viewer",), "stock_face_ok": True,
     "suits": "play, toys, puppies, energy, happy results",
     "body": "play bow: chest and both front legs flat on the ground stretched forward, rear end high in the air, "
             "tail curled up and wagging, the main prop on the ground just in front of his front paws",
     "face": "bright open-mouth grin with tongue out, nose pointing at the prop, eyes big and shining, ears "
             "bouncing back"},
    {"id": "nose-down", "mode": "planted", "ref": None,
     "suits": "inspecting, checking, mud, ticks, foxtails, a new product",
     "body": "standing on all four legs in three-quarter view, all four paws planted, front end dipped so his nose "
             "almost touches the main prop on the ground, rear a little higher, tail straight out behind him",
     "face": "face pointing straight down with his nose almost on the prop, mouth closed, ears hanging forward "
             "past his cheeks, curious"},
    {"id": "shake-off", "mode": "planted", "ref": None, "eyes_ok": ("closed",),
     "suits": "bath, rain, mud, drying, shedding",
     "body": "standing on all four legs in a wide stance, all four paws planted, whole body twisting in a big shake, "
             "fur fluffed out in spikes, both ears flying out sideways, water drops or loose fur flying off in short "
             "arcs that stay close to his body",
     "face": "eyes squeezed shut in happy crescents, mouth in a wide closed grin, cheeks flapping with the shake"},
    {"id": "lying-low", "mode": "planted", "ref": None,
     "suits": "calm, anxious or senior dogs, waiting, rest after a groom",
     "body": "lying on his belly like a sphinx in three-quarter view, both front legs stretched forward flat on the "
             "ground, hind legs tucked under him, head held just above his paws so the whole bandana shows under his "
             "chin, the main prop on the ground between his front paws",
     "face": "chin tucked with his nose pointing down at the prop between his paws, eyes half closed under "
             "flat sleepy top lids, mouth closed in a soft smile, ears hanging loose"},
    {"id": "stand-carry", "mode": "planted", "ref": None,
     "suits": "fetching, bringing a leash or towel, getting ready to go",
     "body": "side profile, standing on all four legs with all four paws planted flat on the ground, chest out, "
             "tail high, carrying the main prop in his mouth toward a second prop",
     "face": "head dipped so his nose points at the second prop right in front of him, cheeks puffed around "
             "what he carries, proud"},
    {"id": "head-tilt", "mode": "planted", "ref": None,
     "suits": "questions, comparisons, how much, how often, choosing",
     "body": "seated in three-quarter view, both front paws planted, turned toward the main prop beside him",
     "face": "head tilted hard to one side with his nose pointing at the prop, one ear flopped up over the top "
             "of his head, eyes big and round, mouth closed and pushed to one side in a puzzled look, drawn "
             "with no question mark or other symbol"},
    {"id": "belly-up", "mode": "free", "paws_down_max": 0, "ref": None,
     "eyes_ok": ("closed", "viewer"), "stock_face_ok": True,
     "suits": "happy after a groom, belly brushing, summer, relaxing",
     "body": "rolled onto his back, belly up, spine curved like a banana, all four paws loose in the air with bent "
             "wrists, tail flopped on the ground, on a mat barely bigger than he is",
     "face": "head upside down beside the main prop, tongue lolling out the side of an open happy mouth, eyes "
             "closed in blissful crescents, ears spread flat on the ground"},
    {"id": "peek-over", "mode": "free", "paws_down_max": 0, "ref": None,
     "suits": "bath tub, grooming van window, supply box, laundry basket, arriving somewhere new",
     "body": "peeking over the top edge of the set piece: only his head, his bandana and his two front paws show "
             "above the edge, both front paws hooked over it, the rest of his body hidden inside or behind the set piece",
     "face": "face tipped down so his nose points at the main prop below him, one ear flopped over the edge, "
             "eyes big and round, mouth closed in a small mischievous smile"},
    {"id": "zoomies", "mode": "free", "paws_down_max": 1, "ref": None,
     "eyes_ok": ("viewer",), "stock_face_ok": True,
     "suits": "zoomies after a bath, running in rain or leaves, excitement, exercise",
     "body": "strict side profile, flying gallop in mid-air: both front legs stretched forward and both hind legs "
             "stretched back, exactly four legs clearly separated, ears and tail streaming behind him, three short "
             "speed lines and a few drops or leaves kicked up close behind him",
     "face": "nose pointing at the prop ahead of him, eyes big and round, mouth wide open in a laughing pant, "
             "tongue flying back"},
    {"id": "towel-wrap", "mode": "planted", "ref": None, "eyes_ok": ("closed",),
     "suits": "after a bath, winter, cold rain, cozy, drying",
     "body": "seated and bundled in a big fluffy towel like a burrito, only his head, his bandana and the tips of "
             "his front paws showing, a towel hood over the top of his head with both ears poking out",
     "face": "eyes closed in content crescents, cheeks pushed up by the towel, small sleepy smile"},
]
ACTION_BY_ID = {a["id"]: a for a in ACTIONS}
# Art loops before 2026-11-13 recorded these pose ids.
LEGACY_POSE_IDS = {"bipedal-hug": "hug-carry", "bipedal-tools": "groom-at-work", "stand-side": "stand-carry",
                   "lying-down": "lying-low", "seated-three-quarter": "head-tilt", "play-bow": "play-bow"}
REPEAT_WINDOW = 3  # an action used by one of the last three loops is refused

LIMB_GUARD = {
    # gpt-image draws three planted paws whenever a front paw is raised, producing five limbs.
    "planted": "Limb guard: every paw that shows stays on the ground. No raised, waving, pointing or holding paw; "
               "props rest on the ground or are held in his mouth.",
    "upright": "Limb guard: exactly two front paws and two hind paws. No third paw anywhere.",
    "free": "Limb guard: exactly four legs in total, each one clearly separate and traceable to a shoulder or hip. "
            "Never a fifth leg or a third front paw. A hidden leg is hidden fully.",
}
FRESH_COMPOSITION = ("The appearance reference fixes how Maui looks, NOT the picture: do not copy its seated "
                     "front-facing pose, its framing, or its placement on the left.")
STICKER_COMPOSITION = ("COMPOSITION: one compact cut-out group in the middle of the canvas: Maui, at most one set "
                       "piece and two small props, all touching or overlapping. The whole group is no wider and no "
                       "taller than two thirds of the canvas, with empty cream background on every side. Draw every "
                       "object whole: never part of a van, wall, door or counter. Every cord, hose, rug, puddle and "
                       "motion mark ends well inside the frame. No cast shadow and no ground tint under him: the "
                       "background is removed later.")
POSE_EXAMPLE = ("The second attached image is a POSE EXAMPLE only: copy the body position and energy from it, not "
                "its drawing style, face direction, props, text or scene. Appearance still comes from the first image.")
ACTING = ("ACTING: Maui performs the action with his whole body and his face. Keep the reference's features exactly, "
          "above all its EYES: solid dark beady ovals, each with one small white highlight, with no white around them, "
          "no iris and no separate pupil. He shows where he looks by turning his head and pointing his nose. He shows "
          "how he feels with eyelids, cheeks, mouth and ears, as the Face line says. Do not paste the reference's "
          "front-facing open grin onto this pose.")


def past_actions(run_dir: Path) -> list[str]:
    """Action of every earlier APPROVED art loop near this run directory, oldest first.

    Exhausted loops never reached a reader, so they do not use up an action.
    """
    here = run_dir.resolve()
    # Weekly runs live in output/groomlocal-weekly/<ts>; re-runs nest one level deeper.
    base = next((p for p in here.parents if p.name == "groomlocal-weekly"), here.parent)
    loops = []
    for summary in base.rglob("art/art-loop.json"):
        if here == summary.parent.parent or here in summary.parents:
            continue
        try:
            data = json.loads(summary.read_text())
        except (OSError, ValueError):
            continue
        winner = (data.get("approved") or {}).get("attempt")
        chosen = next((a for a in data.get("attempts") or [] if a.get("attempt") == winner), {})
        action = chosen.get("action_id") or LEGACY_POSE_IDS.get(chosen.get("pose_id"))
        if action in ACTION_BY_ID:
            loops.append((data.get("started_at") or "", str(summary), action))
    return [action for _, _, action in sorted(loops)]


def action_plan(run_dir: Path) -> list[dict]:
    """Every action with its usage, least used first; recently used ones are marked unavailable."""
    history = past_actions(run_dir)
    recent = set(history[-REPEAT_WINDOW:])
    counts = {a["id"]: history.count(a["id"]) for a in ACTIONS}
    order = sorted(ACTIONS, key=lambda a: (a["id"] in recent, counts[a["id"]], ACTIONS.index(a)))
    return [{"id": a["id"], "suits": a["suits"], "used": counts[a["id"]], "available": a["id"] not in recent,
             "body": a["body"]} for a in order]


def acting_flags(action: dict) -> list[str]:
    flags = ["--acting", "--eyes-ok", ",".join(("prop",) + tuple(action.get("eyes_ok", ())))]
    return flags + (["--stock-face-ok"] if action.get("stock_face_ok") else [])


def _module(name: str):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), SCRIPT_DIR / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(cmd: list[str], cwd: Path, env: dict | None = None, timeout: int = 900) -> subprocess.CompletedProcess:
    print("$", " ".join(str(c) for c in cmd), flush=True)
    return subprocess.run([str(c) for c in cmd], cwd=str(cwd), env=env or os.environ.copy(),
                          capture_output=True, text=True, timeout=timeout)


def generate(project_root: Path, slug: str, scene: str, pose: str | None, mood: str | None,
             extra: str | None, provider: str, model: str | None, reference: Path, out: Path,
             pose_ref: Path | None = None) -> dict:
    hero = project_root / "scripts" / "blog-hero-image.py"
    if not hero.is_file():
        raise RuntimeError(f"image helper not found: {hero}")
    cmd = [UV, "run", "--quiet", "--python", "3.11", "--with", "requests>=2.31", "--with", "Pillow>=10.0.0",
           hero, slug, scene, "--provider", provider, "--ref", reference, "--out", out]
    if pose_ref:
        cmd += ["--ref", pose_ref]
    if pose:
        cmd += ["--pose", pose]
    if mood:
        cmd += ["--mood", mood]
    if extra:
        cmd += ["--extra", extra]
    if model:
        cmd += ["--model", model]
    result = run(cmd, project_root)
    if result.returncode != 0 or not out.is_file():
        raise RuntimeError(f"generation failed (exit {result.returncode}): {result.stderr[-800:] or result.stdout[-800:]}")
    return {"stdout": result.stdout[-1500:], "provenance": str(out.with_suffix(".prompt.txt"))}


def _run_remover(project_root: Path, manifest: Path, out_dir: Path, seeds: Path | None, slug: str) -> Path:
    remover = project_root / "scripts" / "maui-remove-background.py"
    if not remover.is_file():
        raise RuntimeError(f"background remover not found: {remover}")
    cmd = [UV, "run", "--quiet", "--with", "numpy", "--with", "scipy", "--with", "Pillow", "python", remover,
           "--sources", manifest, "--output", out_dir]
    if seeds:
        cmd += ["--seeds", seeds]
    result = run(cmd, project_root)
    final = out_dir / f"{slug}.png"
    if result.returncode != 0 or not final.is_file():
        raise RuntimeError(f"transparent export failed (exit {result.returncode}): {result.stderr[-800:]}")
    return final


def export_transparent(project_root: Path, slug: str, master: Path, out_dir: Path, seeds: Path | None,
                       record: dict) -> Path:
    """Extract, let a vision pass choose seeds for enclosed background gaps, re-extract, then fill pinhole specks."""
    manifest = out_dir.parent / "sources.json"
    try:
        source = master.resolve().relative_to(project_root.resolve())
    except ValueError as error:
        raise RuntimeError("master must live inside the checkout so the remover can resolve it") from error
    manifest.write_text(json.dumps([{"scene": slug, "source": str(source)}], indent=2))
    raw = _run_remover(project_root, manifest, out_dir, seeds, slug)
    record["export"] = {"first_pass": str(raw), "seeds_supplied": str(seeds) if seeds else None}

    if not seeds:
        seeds_path = out_dir / "seeds.json"
        seed_cmd = [sys.executable, SCRIPT_DIR / "maui-export-seeds.py", "--regions", out_dir / "regions.json",
                    "--diagnostic", out_dir / f"{slug}-regions.jpg", "--slug", slug, "--out", seeds_path,
                    "--project-root", project_root]
        seed_result = run(seed_cmd, project_root, timeout=400)
        record["export"]["seed_pass"] = seed_result.stdout[-1500:] or seed_result.stderr[-800:]
        chosen = json.loads(seeds_path.read_text()).get(slug, {}).get("seeds", []) if seeds_path.is_file() else []
        record["export"]["seeds_chosen"] = chosen
        if chosen:
            raw = _run_remover(project_root, manifest, out_dir, seeds_path, slug)
            record["export"]["second_pass"] = str(raw)

    filled = out_dir / f"{slug}-filled.png"
    fill_cmd = [sys.executable, SCRIPT_DIR / "maui-fill-specks.py", raw, "--out", filled]
    fill_result = run(fill_cmd, project_root, timeout=600)
    if fill_result.returncode != 0 or not filled.is_file():
        raise RuntimeError(f"speck fill failed: {fill_result.stderr[-600:]}")
    try:
        record["export"]["speck_fill"] = json.loads(fill_result.stdout)
    except json.JSONDecodeError:
        record["export"]["speck_fill"] = fill_result.stdout[-600:]
    final = out_dir / f"{slug}-final.png"
    shutil.copyfile(filled, final)
    return final


def gate(image: Path, scene: str, stage: str, threshold: float, project_root: Path, reference: Path,
         out: Path, pose_flags: list[str], review_out: Path | None = None) -> dict:
    cmd = [sys.executable, SCRIPT_DIR / "maui-jev-gate.py", image, "--scene", scene, "--stage", stage,
           "--threshold", str(threshold), "--project-root", project_root, "--reference", reference, "--out", out]
    if review_out:
        cmd += ["--review-out", review_out]
    result = run(cmd + pose_flags, project_root, timeout=600)
    if not out.is_file():
        raise RuntimeError(f"gate produced no output (exit {result.returncode}): {result.stderr[-800:] or result.stdout[-800:]}")
    return json.loads(out.read_text())


def pick_best(attempts: list[dict]) -> int | None:
    """Index of the strongest candidate: readiness score first, then weakest gate probability."""
    scored = [(a.get("readiness_score", 0.0), a.get("min_probability", 0.0), i)
              for i, a in enumerate(attempts) if a.get("master_gate")]
    if not scored:
        return None
    return max(scored)[2]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--plan", action="store_true", help="print the actions, least used first, and exit")
    parser.add_argument("--project-root", type=Path)
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--slug")
    parser.add_argument("--scene")
    parser.add_argument("--action", choices=sorted(ACTION_BY_ID), help="the designed action for this image; see --plan")
    parser.add_argument("--allow-repeat-action", action="store_true",
                        help="use an action one of the last three loops used; explain why in the report")
    parser.add_argument("--pose", help="custom body position instead of --action; say 'bipedal' in it for an upright pose")
    parser.add_argument("--mood")
    parser.add_argument("--extra", help="scene-specific nudge appended to every attempt")
    parser.add_argument("--allow-repeat-prop", action="store_true",
                        help="allow a retired main prop (clipboard, checklist, calendar, paperwork); explain why in the report")
    parser.add_argument("--allow-viewer-gaze", action="store_true",
                        help="portrait shots only: drop the acting rule and the acting gate")
    parser.add_argument("--max-attempts", type=int, default=4)
    parser.add_argument("--threshold", type=float, default=0.85)
    parser.add_argument("--provider", choices=["openai", "openrouter"], default="openai")
    parser.add_argument("--model")
    parser.add_argument("--seeds", type=Path, help="reviewed transparency seeds JSON keyed by slug")
    parser.add_argument("--reference", type=Path, default=DEFAULT_REFERENCE)
    args = parser.parse_args()

    plan = action_plan(args.run_dir)
    if args.plan:
        print(json.dumps(plan, indent=2))
        return 0
    if not (args.project_root and args.slug and args.scene):
        parser.error("--project-root, --slug and --scene are required")
    if bool(args.action) == bool(args.pose):
        parser.error("give exactly one of --action or --pose. Run --plan, pick the first available action whose "
                     "'suits' fits the article, then write --scene for that action")
    if args.action and not args.allow_repeat_action and not next(a for a in plan if a["id"] == args.action)["available"]:
        parser.error(f"action {args.action} was used by one of the last {REPEAT_WINDOW} art loops; pick another "
                     "from --plan or pass --allow-repeat-action with a reason")

    project_root = args.project_root.resolve()
    art_dir = (args.run_dir / "art").resolve()
    art_dir.mkdir(parents=True, exist_ok=True)
    summary_path = art_dir / "art-loop.json"
    checker = _module("check-maui-image")

    attempts: list[dict] = []
    status = "in_progress"
    correction = ""
    approved: dict | None = None
    started = datetime.now(timezone.utc).isoformat()
    # Owner direction 2026-10-28: heroes kept repeating clipboard/calendar props. Retired as main props.
    retired = [w for w in ("clipboard", "checklist", "check list", "calendar", "paperwork", "form")
               if re.search(r"\b" + w + r"s?\b", args.scene.lower())]
    if retired and not args.allow_repeat_prop:
        sys.exit(f"scene uses retired prop(s) {retired}; build the scene around a set piece Maui is using "
                 "(see SKILL.md 'More unique images') or pass --allow-repeat-prop with a reason")
    if args.action:
        action = ACTION_BY_ID[args.action]
    else:
        action = {"id": "custom", "mode": "upright" if "bipedal" in args.pose.lower() else "planted", "ref": None,
                  "body": args.pose, "face": "eyes on the prop he is using, an expression that fits what he is doing"}
    print(f"action: {action['id']}", flush=True)
    pose_ref = POSE_DIR / action["ref"] if action["ref"] and (POSE_DIR / action["ref"]).is_file() else None
    act = not args.allow_viewer_gaze
    pose_flags = ["--pose-mode", action["mode"], "--pose-note", action["body"]]
    if action.get("paws_down_max") is not None:
        pose_flags += ["--paws-down-max", str(action["paws_down_max"])]
    if act:
        pose_flags += acting_flags(action)

    def save():
        summary_path.write_text(json.dumps({
            "slug": args.slug, "scene": args.scene, "threshold": args.threshold, "max_attempts": args.max_attempts,
            "started_at": started, "finished_at": datetime.now(timezone.utc).isoformat(),
            "status": status, "attempts": attempts, "best_attempt": pick_best(attempts), "approved": approved,
            "reference": str(args.reference), "referenceSha256": checker.digest(args.reference),
        }, indent=2))

    for number in range(1, args.max_attempts + 1):
        attempt_dir = art_dir / f"attempt-{number}"
        attempt_dir.mkdir(exist_ok=True)
        record: dict = {"attempt": number, "dir": str(attempt_dir), "correction_applied": correction}
        attempts.append(record)
        record.update({"action_id": action["id"], "pose": action["body"], "face": action["face"],
                       "pose_mode": action["mode"], "pose_reference": str(pose_ref) if pose_ref else None,
                       "acting_gate": act})
        extra = " ".join(part for part in [
            f"Face: {action['face']}." if act else "", args.extra, ACTING if act else "", FRESH_COMPOSITION,
            STICKER_COMPOSITION, POSE_EXAMPLE if pose_ref else "", LIMB_GUARD[action["mode"]], correction] if part)
        master = attempt_dir / "master.png"
        try:
            record["generation"] = generate(project_root, args.slug, args.scene, action["body"], args.mood, extra,
                                            args.provider, args.model, args.reference, master, pose_ref)
            record["master_sha256"] = checker.digest(master)
            master_gate = gate(master, args.scene, "master", args.threshold, project_root, args.reference,
                               attempt_dir / "master.jev-gate.json", pose_flags)
        except RuntimeError as error:
            record["error"] = str(error)
            print(f"attempt {number}: error: {error}", flush=True)
            save()
            continue
        decision = master_gate["decision"]
        record.update({"master_gate": str(attempt_dir / "master.jev-gate.json"), "gates": decision["gates"],
                       "readiness_score": decision["readiness_score"], "min_probability": decision["min_probability"],
                       "failing": decision["failing"], "master_passed": decision["passed"]})
        print(f"attempt {number}: master gates {json.dumps(decision['gates'])} readiness {decision['readiness_score']:.2f} "
              f"-> {'PASS' if decision['passed'] else 'FAIL ' + ','.join(decision['failing'])}", flush=True)
        if not decision["passed"]:
            correction = master_gate.get("correction", "")
            save()
            continue

        # Master passed: export, byte-check, and gate the final.
        try:
            final = export_transparent(project_root, args.slug, master, attempt_dir / "transparent", args.seeds, record)
            record["final"] = str(final)
            record["final_sha256"] = checker.digest(final)
            file_report = checker.inspect(final)
            record["file_checks"] = {k: file_report[k] for k in ("fileChecksPass", "errors", "alphaRange", "marginFractions")}
            review_path = attempt_dir / "image-review.json"
            final_gate = gate(final, args.scene, "final", args.threshold, project_root, args.reference,
                              attempt_dir / "final.jev-gate.json",
                              pose_flags + ["--master-gate", attempt_dir / "master.jev-gate.json"],
                              review_out=review_path)
        except RuntimeError as error:
            record["error"] = str(error)
            status = "needs_export_review"
            print(f"attempt {number}: export problem: {error}", flush=True)
            save()
            break
        final_decision = final_gate["decision"]
        record.update({"final_gate": str(attempt_dir / "final.jev-gate.json"), "final_gates": final_decision["gates"],
                       "final_failing": final_decision["failing"], "final_passed": final_decision["passed"]})
        if final_decision["passed"] and review_path.is_file():
            confirm = checker.inspect(final, review_path, args.reference)
            record["checker_confirmed"] = confirm["approved"]
            if confirm["approved"]:
                status = "approved"
                approved = {"attempt": number, "master": str(master), "final": str(final), "final_sha256": record["final_sha256"],
                            "image_review": str(review_path), "on_teal": final_gate.get("looked_at"),
                            "regions_diagnostic": str(attempt_dir / "transparent" / f"{args.slug}-regions.jpg")}
                print(f"attempt {number}: APPROVED final {final}", flush=True)
                save()
                break
            record["error"] = "checker rejected the review record: " + "; ".join(confirm["errors"])
        only_export_issue = set(final_decision["failing"]) <= {"transparency", "file_checks"}
        if only_export_issue:
            status = "needs_export_review"
            print(f"attempt {number}: master approved but export failed {final_decision['failing']}; review seeds in "
                  f"{attempt_dir / 'transparent' / (args.slug + '-regions.jpg')}", flush=True)
            save()
            break
        correction = final_gate.get("correction", "")
        print(f"attempt {number}: final gate failed {final_decision['failing']}", flush=True)
        save()

    if status == "in_progress":
        status = "exhausted"
    save()
    print(json.dumps({"status": status, "attempts": len(attempts), "best_attempt": pick_best(attempts),
                      "approved": approved, "summary": str(summary_path)}, indent=2))
    return {"approved": 0, "exhausted": 2, "needs_export_review": 3}[status]


if __name__ == "__main__":
    raise SystemExit(main())
