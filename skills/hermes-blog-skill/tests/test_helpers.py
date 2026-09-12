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


if __name__ == "__main__":
    unittest.main()
