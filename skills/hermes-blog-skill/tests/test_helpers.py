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

    def test_jev_gate_limb_counts_are_hard_rejections_but_a_raised_paw_is_not(self):
        answers = self._answers()  # Jev says anatomy 0.97
        # Apron Maui is bipedal and holds props: a raised paw with four limbs is fine (owner rule, 2026-09-15).
        bipedal = {"raised_paw": True, "front_paws_visible": 2, "rear_paws_visible": 2, "visible_limbs_total": 4}
        decision = jev_gate.decide(answers, "master", 0.85, bipedal)
        self.assertTrue(decision["passed"])
        self.assertEqual(decision["gates"]["anatomy"], 0.97)
        # More than four visible limbs is always a rejection, whatever Jev says.
        three_front = {"raised_paw": False, "front_paws_visible": 3, "rear_paws_visible": 1, "visible_limbs_total": 4}
        rejected = jev_gate.decide(answers, "master", 0.85, three_front)
        self.assertFalse(rejected["passed"])
        self.assertEqual(rejected["failing"], ["anatomy"])
        self.assertEqual(rejected["gates"]["anatomy"], 0.05)
        five = {"raised_paw": True, "front_paws_visible": 2, "rear_paws_visible": 2, "visible_limbs_total": 5}
        self.assertFalse(jev_gate.decide(answers, "master", 0.85, five)["passed"])
        clean = {"raised_paw": False, "front_paws_visible": 2, "rear_paws_visible": 1, "visible_limbs_total": 3}
        self.assertTrue(jev_gate.decide(answers, "master", 0.85, clean)["passed"])


if __name__ == "__main__":
    unittest.main()
