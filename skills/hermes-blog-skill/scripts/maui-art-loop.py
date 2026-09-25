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
                 "paws planted. No raised, waving, pointing or holding paw; props sit beside Maui or are held in his mouth.")


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
             extra: str | None, provider: str, model: str | None, reference: Path, out: Path) -> dict:
    hero = project_root / "scripts" / "blog-hero-image.py"
    if not hero.is_file():
        raise RuntimeError(f"image helper not found: {hero}")
    cmd = [UV, "run", "--quiet", "--python", "3.11", "--with", "requests>=2.31", "--with", "Pillow>=10.0.0",
           hero, slug, scene, "--provider", provider, "--ref", reference, "--out", out]
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
         out: Path, review_out: Path | None = None) -> dict:
    cmd = [sys.executable, SCRIPT_DIR / "maui-jev-gate.py", image, "--scene", scene, "--stage", stage,
           "--threshold", str(threshold), "--project-root", project_root, "--reference", reference, "--out", out]
    if review_out:
        cmd += ["--review-out", review_out]
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
        # Bipedal (apron) scenes stand on the hind paws by the owner's standard; the four-paws guard would fight the pose.
        bipedal = bool(args.pose and "bipedal" in args.pose.lower())
        guard = "" if (args.no_anatomy_guard or bipedal) else ANATOMY_GUARD
        extra = " ".join(part for part in [args.extra, guard, correction] if part)
        master = attempt_dir / "master.png"
        try:
            record["generation"] = generate(project_root, args.slug, args.scene, args.pose, args.mood, extra or None,
                                            args.provider, args.model, args.reference, master)
            record["master_sha256"] = checker.digest(master)
            master_gate = gate(master, args.scene, "master", args.threshold, project_root, args.reference,
                               attempt_dir / "master.jev-gate.json")
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
                              attempt_dir / "final.jev-gate.json", review_out=review_path)
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
