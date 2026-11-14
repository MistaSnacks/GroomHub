"""Offline contract checks; generated square fixtures are not Maui approvals."""
import hashlib
import importlib.util
import io
import json
import os
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from PIL import Image, ImageDraw

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"


def module(name):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), SCRIPTS / (name + ".py"))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


checker = module("check-maui-image")
preflight = module("cms-preflight")
uploader = module("upload-cms-image")
jev_gate = module("maui-jev-gate")
art_loop = module("maui-art-loop")
specks = module("maui-fill-specks")
export_seeds = module("maui-export-seeds")


class Helpers(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.png = self.root / "fixture.png"
        image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
        ImageDraw.Draw(image).rectangle((120, 120, 900, 900), fill=(200, 180, 150, 255))
        image.save(self.png)
        self.reference = self.root / "reference.png"
        image.save(self.reference)
        self.review = self.root / "review.json"
        self.record = {"sha256": checker.digest(self.png), "referenceSha256": checker.digest(self.reference),
                       "reviewer": "offline test fixture", "reviewedAt": datetime.now(timezone.utc).isoformat(),
                       "decision": "approved", "evidence": "Synthetic square fixture for tests only.",
                       "checks": dict.fromkeys(["identity", "anatomy", "bandana", "completeEdges", "transparency", "sceneSafety"], True)}
        self.review.write_text(json.dumps(self.record))

    def test_file_pass_is_not_visual_approval(self):
        result = checker.inspect(self.png)
        self.assertTrue(result["fileChecksPass"])
        self.assertFalse(result["approved"])

    def test_matching_review_contract(self):
        self.assertTrue(checker.inspect(self.png, self.review, self.reference)["approved"])

    def test_image_replacement_invalidates_review(self):
        with Image.open(self.png) as image:
            image.putpixel((500, 500), (100, 100, 100, 255))
            image.save(self.png)
        self.assertFalse(checker.inspect(self.png, self.review, self.reference)["approved"])

    def test_uncertain_anatomy_blocks(self):
        self.record["checks"]["anatomy"] = None
        self.review.write_text(json.dumps(self.record))
        self.assertFalse(checker.inspect(self.png, self.review, self.reference)["approved"])

    def test_opaque_and_empty_images_fail(self):
        for fill in [(240, 230, 210, 255), (0, 0, 0, 0)]:
            Image.new("RGBA", (1024, 1024), fill).save(self.png)
            self.assertFalse(checker.inspect(self.png)["fileChecksPass"])

    def test_clipped_edge_fails(self):
        with Image.open(self.png) as image:
            ImageDraw.Draw(image).rectangle((0, 100, 900, 900), fill=(200, 180, 150, 255))
            image.save(self.png)
        self.assertFalse(checker.inspect(self.png)["fileChecksPass"])

    def test_preflight_requires_authority(self):
        directory = self.root / "docs/automation"
        directory.mkdir(parents=True)
        (directory / "weekly-guides-policy.json").write_text(json.dumps({"mode": "publish", "publication_authorized": False}))
        with self.assertRaisesRegex(ValueError, "not authorized"):
            preflight.collect(self.root)

    def test_upload_payload_and_no_secret_in_result(self):
        asset = {"id": "fixture-asset", "originalUrl": "https://media.snackboxcms.com/groomlocal/fixture.png"}
        class Opener:
            def open(inner, request, timeout):
                self.assertEqual(request.full_url, "https://snackboxcms.com/api/v1/groomlocal/assets")
                self.assertEqual(request.get_method(), "POST")
                self.assertIn(b'name="file"', request.data)
                self.assertIn(self.png.read_bytes(), request.data)
                return io.BytesIO(json.dumps({"result": asset}).encode())
        with patch.dict(os.environ, {"SNACKBOX_GROOMLOCAL_TOKEN": "test-only-secret"}), patch.object(uploader.urllib.request, "build_opener", return_value=Opener()):
            result = uploader.upload(self.png, "Synthetic test square")
        self.assertEqual(result["ref"], {"_ref": "fixture-asset"})
        self.assertNotIn("test-only-secret", json.dumps(result))
        self.assertEqual(result["sourceSha256"], hashlib.sha256(self.png.read_bytes()).hexdigest())

    def test_upload_refuses_redirects(self):
        self.assertIsNone(uploader.NoRedirect().redirect_request(None, None, 307, "", {}, "https://other.example"))

    def _answers(self, **overrides):
        base = {k: {"type": "noul", "noul": 0.97} for k in jev_gate.GATE_KEYS_FINAL}
        base["readiness"] = {"type": "score", "score": 2.9, "confidence": 0.9}
        for key, value in overrides.items():
            base[key] = {"type": "noul", "noul": value}
        return base

    def test_jev_gate_passes_only_when_every_gate_clears_threshold(self):
        decision = jev_gate.decide(self._answers(), "master", 0.85)
        self.assertTrue(decision["passed"])
        self.assertEqual(decision["failing"], [])
        decision = jev_gate.decide(self._answers(anatomy=0.6), "master", 0.85)
        self.assertFalse(decision["passed"])
        self.assertEqual(decision["failing"], ["anatomy"])
        self.assertEqual(decision["weakest_gate"], "anatomy")
        self.assertIn("four canine limbs", jev_gate.correction_text(decision["failing"]))

    def test_jev_gate_final_stage_requires_transparency_and_treats_missing_as_failure(self):
        answers = self._answers()
        del answers["transparency"]
        decision = jev_gate.decide(answers, "final", 0.85)
        self.assertFalse(decision["passed"])
        self.assertEqual(decision["failing"], ["transparency"])
        self.assertTrue(jev_gate.decide(self._answers(), "master", 0.85)["passed"])

    def test_jev_review_record_satisfies_checker_contract(self):
        decision = jev_gate.decide(self._answers(), "final", 0.85)
        observations = {"_vision_model": "test-vision", "front_paws_visible": 2, "rear_paws_visible": 1,
                        "occlusion_explanation": "rear left hidden by body", "tail": "complete",
                        "bandana_text_read": "MAUI", "text_elsewhere": "", "background": "teal composite", "edge_quality": "clean"}
        file_report = checker.inspect(self.png)
        review = jev_gate.build_review(self.png, self.reference, observations, decision, file_report)
        self.assertEqual(review["decision"], "approved")
        self.assertNotIn("test-only-secret", json.dumps(review))
        self.review.write_text(json.dumps(review))
        self.assertTrue(checker.inspect(self.png, self.review, self.reference)["approved"])
        rejected = jev_gate.build_review(self.png, self.reference, observations, jev_gate.decide(self._answers(bandana=0.2), "final", 0.85), file_report)
        self.assertEqual(rejected["decision"], "rejected")
        self.review.write_text(json.dumps(rejected))
        self.assertFalse(checker.inspect(self.png, self.review, self.reference)["approved"])

    def test_jev_gate_never_calls_network_without_keys(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": "", "VOICE_TOOLS_OPENAI_KEY": "", "TYPESAFE_API_KEY": ""}), \
             patch.object(jev_gate, "_parse_env_file", return_value={}):
            with self.assertRaisesRegex(RuntimeError, "OPENAI_API_KEY"):
                jev_gate.run_gate(self.png, self.reference, "scene", "master", 0.85, None, "vision-model")

    def test_art_loop_picks_strongest_candidate(self):
        attempts = [{"attempt": 1, "master_gate": "a", "readiness_score": 1.2, "min_probability": 0.4},
                    {"attempt": 2, "error": "generation failed"},
                    {"attempt": 3, "master_gate": "c", "readiness_score": 2.7, "min_probability": 0.8},
                    {"attempt": 4, "master_gate": "d", "readiness_score": 2.7, "min_probability": 0.9}]
        self.assertEqual(art_loop.pick_best(attempts), 3)
        self.assertIsNone(art_loop.pick_best([{"attempt": 1, "error": "x"}]))

    def test_speck_fill_closes_pinholes_but_keeps_real_gaps(self):
        with Image.open(self.png) as image:
            rgba = image.convert("RGBA")
            for x, y in [(300, 300), (301, 300), (300, 301)]:
                rgba.putpixel((x, y), (0, 0, 0, 0))
            ImageDraw.Draw(rgba).rectangle((600, 600, 640, 640), fill=(0, 0, 0, 0))
            rgba.save(self.png)
        out = self.root / "filled.png"
        report = specks.fill(self.png, out, 40)
        self.assertEqual(report["filled_pixels"], 3)
        self.assertEqual(len(report["remaining_gaps"]), 1)
        self.assertEqual(report["remaining_gaps"][0]["area"], 41 * 41)
        with Image.open(out) as filled:
            self.assertEqual(filled.getpixel((300, 300))[3], 255)
            self.assertEqual(filled.getpixel((620, 620))[3], 0)
            self.assertEqual(filled.getpixel((0, 0))[3], 0)

    def test_jev_gate_raised_paw_rejects_planted_poses_only(self):
        answers = self._answers()  # Jev says anatomy 0.97
        upright = jev_gate.Pose("upright")
        raised = {"raised_paw": True, "front_paws_visible": 2, "rear_paws_visible": 2, "visible_limbs_total": 4,
                  "paws_on_ground": 2}
        # Planted poses: a raised paw is an automatic rejection (five-limb lesson, 2026-09-21).
        planted = jev_gate.decide(answers, "master", 0.85, raised)
        self.assertFalse(planted["passed"])
        self.assertEqual(planted["gates"]["anatomy"], 0.0)
        # Upright poses (owner standard): raised front paws are expected, limb counts decide.
        self.assertEqual(jev_gate.decide(answers, "master", 0.85, raised, upright)["gates"]["anatomy"], 0.97)
        self.assertFalse(jev_gate.decide(answers, "master", 0.85, dict(raised, paws_on_ground=3), upright)["passed"])
        self.assertIn("hind legs", jev_gate.correction_text(["anatomy"], upright))
        # More than four visible limbs is always a rejection, whatever Jev says, in every mode.
        three_front = {"raised_paw": False, "front_paws_visible": 3, "rear_paws_visible": 1, "visible_limbs_total": 4}
        for mode in ("planted", "upright", "free"):
            rejected = jev_gate.decide(answers, "master", 0.85, three_front, jev_gate.Pose(mode))
            self.assertEqual(rejected["failing"], ["anatomy"])
            self.assertEqual(rejected["gates"]["anatomy"], 0.05)
        clean = {"raised_paw": False, "front_paws_visible": 2, "rear_paws_visible": 1, "visible_limbs_total": 3}
        self.assertTrue(jev_gate.decide(answers, "master", 0.85, clean)["passed"])

    def test_jev_gate_free_poses_count_paws_on_the_ground(self):
        answers = self._answers()
        leap = {"raised_paw": True, "front_paws_visible": 2, "rear_paws_visible": 2, "visible_limbs_total": 4,
                "paws_on_ground": 0}
        belly_up = jev_gate.Pose("free", paws_down_max=0)
        self.assertTrue(jev_gate.decide(answers, "master", 0.85, leap, belly_up)["passed"])
        # A "belly up" drawing that still stands on a paw is the wrong pose or hides an extra limb.
        self.assertFalse(jev_gate.decide(answers, "master", 0.85, dict(leap, paws_on_ground=1), belly_up)["passed"])
        self.assertIn("four legs", jev_gate.correction_text(["anatomy"], belly_up))
        peek = {"raised_paw": True, "front_paws_visible": 2, "rear_paws_visible": 0, "visible_limbs_total": 2,
                "paws_on_ground": 0}
        self.assertTrue(jev_gate.decide(answers, "master", 0.85, peek, belly_up)["passed"])

    def test_jev_gate_acting_rejects_the_stock_face(self):
        answers = self._answers()
        work = jev_gate.Acting()
        on_work = {"eyes_look_at": "the prop or task he is working on", "copies_reference_camera_grin": False,
                   "mouth": "closed with tongue tip showing"}
        self.assertTrue(jev_gate.decide(answers, "master", 0.85, on_work, acting=work)["passed"])
        # Owner feedback 2026-10-05: heroes held props but grinned at the camera like the reference.
        grin = dict(on_work, eyes_look_at="the viewer", copies_reference_camera_grin=True)
        rejected = jev_gate.decide(answers, "master", 0.85, grin, acting=work)
        self.assertEqual(rejected["failing"], ["acting"])
        self.assertIn("Face line", jev_gate.correction_text(["acting"]))
        # Owner feedback 2026-11-13: head turned to the work, face still the reference's grin.
        stock_mouth = dict(on_work, mouth="open grin with tongue out like the reference")
        self.assertEqual(jev_gate.decide(answers, "master", 0.85, stock_mouth, acting=work)["failing"], ["acting"])
        # Joy actions ask for that grin, and may look at the viewer.
        joy = jev_gate.Acting(eyes_ok=("prop", "viewer"), stock_face_ok=True)
        self.assertTrue(jev_gate.decide(answers, "master", 0.85, grin, acting=joy)["passed"])
        # Closed eyes pass only where the action calls for them.
        shut = dict(on_work, eyes_look_at="eyes are closed", mouth="small closed smile")
        self.assertFalse(jev_gate.decide(answers, "master", 0.85, shut, acting=work)["passed"])
        self.assertTrue(jev_gate.decide(answers, "master", 0.85, shut, acting=jev_gate.Acting(("prop", "closed")))["passed"])
        # A missing face observation fails closed; the gate is off unless the loop asks for it.
        self.assertIn("acting", jev_gate.decide(answers, "master", 0.85, {"raised_paw": False}, acting=work)["failing"])
        self.assertTrue(jev_gate.decide(answers, "master", 0.85, grin)["passed"])

    def test_art_loop_actions_are_complete_and_gate_flags_match(self):
        modes = {a["mode"] for a in art_loop.ACTIONS}
        self.assertEqual(modes, {"planted", "upright", "free"})
        for a in art_loop.ACTIONS:
            self.assertTrue(a["body"] and a["face"] and a["suits"], a["id"])
            self.assertNotIn("facing the viewer", a["face"])
            if a["ref"]:
                self.assertTrue((art_loop.POSE_DIR / a["ref"]).is_file(), a["ref"])
            self.assertLessEqual(jev_gate.Pose(a["mode"], a.get("paws_down_max")).max_down, 4)
            if a["mode"] == "upright":
                self.assertTrue(a["id"] == "sit-pretty" or "bipedal" in a["body"])
        self.assertEqual(art_loop.acting_flags(art_loop.ACTION_BY_ID["groom-at-work"]), ["--acting", "--eyes-ok", "prop"])
        self.assertEqual(art_loop.acting_flags(art_loop.ACTION_BY_ID["play-bow"]),
                         ["--acting", "--eyes-ok", "prop,viewer", "--stock-face-ok"])
        for legacy in art_loop.LEGACY_POSE_IDS.values():
            self.assertIn(legacy, art_loop.ACTION_BY_ID)

    def test_art_loop_plan_puts_unused_actions_first_and_blocks_recent_ones(self):
        root = Path(self.temp.name) / "groomlocal-weekly"
        def loop(name, started, attempts, approved=None):
            folder = root / name / "art"
            folder.mkdir(parents=True)
            (folder / "art-loop.json").write_text(json.dumps(
                {"started_at": started, "attempts": attempts, "approved": approved}))
        # A loop from before 2026-11-13 recorded pose ids; the approved attempt is the one that counts.
        loop("2026-09-28_000000", "2026-09-28T00:00:00", [{"attempt": 1, "pose_id": "stand-side"},
                                                           {"attempt": 2, "pose_id": "bipedal-hug"}], {"attempt": 2})
        loop("2026-11-16_000000", "2026-11-16T00:00:00", [{"attempt": 1, "action_id": "shake-off"}], {"attempt": 1})
        # An exhausted loop never reached a reader, so it does not use up its action.
        loop("2026-11-17_000000", "2026-11-17T00:00:00", [{"attempt": 1, "action_id": "zoomies"}])
        plan = art_loop.action_plan(root / "2026-11-23_000000")
        by_id = {a["id"]: a for a in plan}
        self.assertEqual(len(plan), len(art_loop.ACTIONS))
        self.assertEqual(by_id["hug-carry"]["used"], 1)
        self.assertEqual(by_id["stand-carry"]["used"], 0)
        self.assertFalse(by_id["shake-off"]["available"])
        self.assertFalse(by_id["hug-carry"]["available"])
        self.assertTrue(by_id["zoomies"]["available"])
        self.assertEqual(by_id["zoomies"]["used"], 0)
        self.assertTrue(plan[0]["available"])
        self.assertEqual([a["id"] for a in plan[-2:]], ["hug-carry", "shake-off"])


    def test_jev_gate_rejects_eyes_with_whites(self):
        # Owner 2026-11-13: Maui's eyes are beady; white around a pupil is off-model whatever Jev says.
        answers = self._answers()
        beady = {"eye_style": "solid dark beady ovals with a highlight like the reference"}
        self.assertTrue(jev_gate.decide(answers, "master", 0.85, beady)["passed"])
        whites = {"eye_style": "white visible around a darker pupil or iris"}
        rejected = jev_gate.decide(answers, "master", 0.85, whites)
        self.assertEqual(rejected["failing"], ["identity"])
        self.assertIn("beady", jev_gate.correction_text(["identity"]))
        for a in art_loop.ACTIONS:
            self.assertNotRegex(a["face"], r"pupil|eyes (looking|on|locked|fixed|narrowed|wide on|rolled|turned)")


    def test_jev_gate_final_carries_picture_verdicts_from_the_master(self):
        # The export cannot change the scene or the face, so a second opinion on them must not fail a final.
        master = jev_gate.decide(self._answers(), "master", 0.85)["gates"]
        flipped = self._answers(scene=0.45, transparency=0.97)
        self.assertEqual(jev_gate.decide(flipped, "final", 0.85)["failing"], ["scene"])
        self.assertTrue(jev_gate.decide(flipped, "final", 0.85, master_gates=master)["passed"])
        # What an export can break is still judged on the final itself.
        for key in ("identity", "anatomy", "edges", "transparency"):
            broken = jev_gate.decide(self._answers(**{key: 0.2}), "final", 0.85, master_gates=master)
            self.assertEqual(broken["failing"], [key])

    def test_jev_gate_acting_accepts_a_turned_head_with_no_named_target(self):
        work = jev_gate.Acting()
        turned = {"eyes_look_at": "nothing in particular", "head_angle": "three-quarter", "mouth": "small closed smile",
                  "copies_reference_camera_grin": False}
        self.assertEqual(jev_gate.acting_probability(turned, work), 1.0)
        self.assertEqual(jev_gate.acting_probability(dict(turned, head_angle="straight on"), work), 0.3)


    def test_export_seeds_never_erase_fur_colored_regions(self):
        # 2026-11-13: the vision pass called a torso (distance 8) and a leg (11) "gap"; both were erased.
        candidates = [{"id": 3, "seed": [0.28, 0.49], "area": 48974, "paperDistance": 8.0},
                      {"id": 29, "seed": [0.62, 0.69], "area": 204, "paperDistance": 2.0},
                      {"id": 4, "seed": [0.57, 0.51], "area": 36970, "paperDistance": 1.0}]
        seeds, vetoed = export_seeds.choose_seeds(candidates, {"3": "gap", "29": "gap", "4": "character"})
        self.assertEqual([c["id"] for c in seeds], [29])
        self.assertEqual([c["id"] for c in vetoed], [3])


if __name__ == "__main__":
    unittest.main()
