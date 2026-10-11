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
  maui-art-loop.py --project-root <checkout> --run-dir <run dir> --slug <slug>
                   --scene "<scene>" [--pose ...] [--mood ...] [--extra ...]
                   [--max-attempts 4] [--threshold 0.85] [--provider openai] [--model ID]
                   [--seeds seeds.json] [--reference brushing-v2.png]

Writes <run-dir>/art/attempt-N/{master.png,master.jev-gate.json,transparent/,final.jev-gate.json}
and <run-dir>/art/art-loop.json. Never writes into the checkout's public/ or docs/.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_REFERENCE = SCRIPT_DIR.parent / "references" / "maui" / "approved-reference" / "brushing-v2.png"
UV = shutil.which("uv") or str(Path.home() / ".local" / "bin" / "uv")
# gpt-image draws three planted paws whenever a front paw is raised, producing five limbs.
ANATOMY_GUARD = ("Pose guard: all four paws stay on the ground, either standing on four legs or seated with both front "
                 "paws planted. No raised, waving, pointing or holding paw; props rest on the ground near his paws or are held in his mouth.")


POSE_DIR = SCRIPT_DIR.parent / "references" / "maui" / "pose-reference"
# Owner feedback 2026-09-28: runs kept redrawing the appearance reference (seated, facing
# front, props beside him). When no --pose is given the loop rotates through these, least
# used across earlier runs first, and switches to the next pose halfway through the attempts.
# Bipedal entries follow the owner's standard that Maui often stands upright like the apron
# and tip-jar illustrations; they send a pose example as a second reference.
POSES = [
    {"id": "bipedal-hug", "bipedal": True, "ref": "bipedal-hug-jar.png",
     "pose": "bipedal: standing upright on his two short hind legs like a mascot, both hind paws planted, "
             "both front paws together holding the main prop in front of his chest, head bowed over it and "
             "eyes reading it, three-quarter view"},
    {"id": "stand-side", "bipedal": False, "ref": None,
     "pose": "standing on all four legs in side profile, all four paws planted flat on the ground, tail up, "
             "carrying the main prop in his mouth, eyes on the other props he is carrying it toward"},
    {"id": "bipedal-tools", "bipedal": True, "ref": "bipedal-apron-tools.png",
     "pose": "bipedal: standing upright on his two short hind legs, both hind paws planted, one prop held "
             "in each front paw at chest height and in use, head turned and tipped down toward the tool he "
             "is working with, three-quarter view"},
    {"id": "lying-down", "bipedal": False, "ref": None,
     "pose": "lying down on his belly with both front legs stretched forward flat on the ground, chin low, "
             "eyes on the main prop on the floor in front of him, low wide composition"},
    {"id": "play-bow", "bipedal": False, "ref": None,
     "pose": "play bow: front legs flat on the ground, rear end up, tail wagging, the main prop on the ground "
             "between his front paws and his eyes on it, playful"},
    {"id": "seated-three-quarter", "bipedal": False, "ref": None,
     "pose": "seated in a three-quarter view turned toward the props, both front paws planted, head tilted "
             "up at the main prop, placed right of center"},
]
FRESH_COMPOSITION = ("The appearance reference fixes how Maui looks, NOT the picture: do not copy its seated "
                     "front-facing pose, its framing, or its placement on the left. Build a fresh composition "
                     "where Maui is doing something with the props, not just sitting beside them.")
POSE_EXAMPLE = ("The second attached image is a POSE EXAMPLE only: copy Maui's upright bipedal stance from it, "
                "not its face direction, expression, apron, props, text, or scene. Appearance still comes from "
                "the first image.")
# Owner feedback 2026-10-05: the 09-28 and 10-05 bipedal heroes held their props but kept the
# reference's camera-facing grin. Every reference faces the viewer and the base prompt says
# "identical face", so the generator copies the head angle and expression too.
WORK_GAZE = ("GAZE: Maui looks at his work, not at the viewer. Turn his head toward the prop he is using and "
             "point his pupils at it, the way a groomer watches the coat he is brushing. Calm, focused "
             "expression: a small smile, mouth closed or tongue just showing. 'Identical face' means the same "
             "eyes, nose, muzzle, ears and fur shapes, NOT the reference's head angle or its open-mouth grin at "
             "the camera.")


def pose_history(run_dir: Path) -> dict[str, int]:
    """How often each rotation pose was used by earlier art loops next to this run directory."""
    counts = {p["id"]: 0 for p in POSES}
    here = run_dir.resolve()
    # Weekly runs live in output/groomlocal-weekly/<ts>; re-runs nest one level deeper.
    base = next((p for p in here.parents if p.name == "groomlocal-weekly"), here.parent)
    for summary in base.rglob("art/art-loop.json"):
        if here == summary.parent.parent or here in summary.parents:
            continue
        try:
            data = json.loads(summary.read_text())
        except (OSError, ValueError):
            continue
        for attempt in data.get("attempts", []):
            if attempt.get("pose_id") in counts:
                counts[attempt["pose_id"]] += 1
    return counts


def pose_plan(run_dir: Path) -> list[dict]:
    """Rotation order for this run: least used first, list order breaking ties."""
    counts = pose_history(run_dir)
    return sorted(POSES, key=lambda p: (counts[p["id"]], POSES.index(p)))


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
         out: Path, review_out: Path | None = None, bipedal: bool = False, look_at_work: bool = False) -> dict:
    cmd = [sys.executable, SCRIPT_DIR / "maui-jev-gate.py", image, "--scene", scene, "--stage", stage,
           "--threshold", str(threshold), "--project-root", project_root, "--reference", reference, "--out", out]
    if review_out:
        cmd += ["--review-out", review_out]
    if bipedal:
        cmd += ["--bipedal"]
    if look_at_work:
        cmd += ["--look-at-work"]
    result = run(cmd, project_root, timeout=600)
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
    parser.add_argument("--project-root", type=Path, required=True)
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--slug", required=True)
    parser.add_argument("--scene", required=True)
    parser.add_argument("--pose")
    parser.add_argument("--mood")
    parser.add_argument("--extra", help="scene-specific nudge appended to every attempt")
    parser.add_argument("--no-anatomy-guard", action="store_true",
                        help="drop the default pose guard (the generator draws a fifth limb whenever a paw is raised)")
    parser.add_argument("--allow-viewer-gaze", action="store_true",
                        help="portrait shots only: drop the look-at-the-work prompt rule and the gaze gate")
    parser.add_argument("--max-attempts", type=int, default=4)
    parser.add_argument("--threshold", type=float, default=0.85)
    parser.add_argument("--provider", choices=["openai", "openrouter"], default="openai")
    parser.add_argument("--model")
    parser.add_argument("--seeds", type=Path, help="reviewed transparency seeds JSON keyed by slug")
    parser.add_argument("--reference", type=Path, default=DEFAULT_REFERENCE)
    args = parser.parse_args()

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
    plan = pose_plan(args.run_dir)
    print("pose rotation: " + ", ".join(p["id"] for p in plan[:2]) if not args.pose else f"pose (explicit): {args.pose}",
          flush=True)

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
        if args.pose:
            pose_id, pose_text = "custom", args.pose
            pose_ref = None
        else:
            chosen = plan[0] if number <= (args.max_attempts + 1) // 2 else plan[1 % len(plan)]
            pose_id, pose_text = chosen["id"], chosen["pose"]
            pose_ref = POSE_DIR / chosen["ref"] if chosen["ref"] and (POSE_DIR / chosen["ref"]).is_file() else None
        if record.get("attempt", 0) > 1 and attempts[-2].get("pose_id") != pose_id:
            correction = ""  # a new pose starts clean; the old pose's fixes do not apply
        # Bipedal scenes stand on the hind paws by the owner's standard; the four-paws guard would fight the pose.
        bipedal = "bipedal" in pose_text.lower()
        record.update({"pose_id": pose_id, "pose": pose_text, "pose_reference": str(pose_ref) if pose_ref else None,
                       "look_at_work": not args.allow_viewer_gaze})
        guard = "" if (args.no_anatomy_guard or bipedal) else ANATOMY_GUARD
        look_at_work = not args.allow_viewer_gaze
        extra = " ".join(part for part in [args.extra, FRESH_COMPOSITION, POSE_EXAMPLE if pose_ref else "",
                                            WORK_GAZE if look_at_work else "", guard, correction] if part)
        master = attempt_dir / "master.png"
        try:
            record["generation"] = generate(project_root, args.slug, args.scene, pose_text, args.mood, extra or None,
                                            args.provider, args.model, args.reference, master, pose_ref)
            record["master_sha256"] = checker.digest(master)
            master_gate = gate(master, args.scene, "master", args.threshold, project_root, args.reference,
                               attempt_dir / "master.jev-gate.json", bipedal=bipedal,
                               look_at_work=look_at_work)
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
                              attempt_dir / "final.jev-gate.json", review_out=review_path, bipedal=bipedal,
                              look_at_work=look_at_work)
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
