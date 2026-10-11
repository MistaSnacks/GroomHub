"""Offline checks for the humanize scanner and fact gate (scripts/ai_tells.py)."""
import contextlib
import copy
import importlib.util
import io
import json
import os
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
spec = importlib.util.spec_from_file_location("ai_tells", SCRIPTS / "ai_tells.py")
tells = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tells)


def block(text, style="normal", marks=None, href=None, list_item=None):
    b = {"_type": "block", "style": style,
         "children": [{"_type": "span", "text": text, "marks": marks or []}], "markDefs": []}
    if href:
        b["markDefs"].append({"_key": "l", "_type": "link", "href": href})
    if list_item:
        b["listItem"] = list_item
    return b


DRAFT = {
    "_id": "blog-test-guide", "_type": "blogPost", "slug": "test-guide",
    "title": "Test Guide: A Seamless Checklist",
    "excerpt": "What a $70 groom includes.",
    "seo": {"description": "Unlock the answer."},
    "heroAlt": "Maui holding a brush",
    "body": [block("Most dogs need a bath every 4 to 6 weeks.", href="https://www.aspca.org/x")],
    "sections": [
        {"_key": "t", "kind": "table", "heading": "Prices by size", "caption": "Sample of 12 menus, Sep 2026",
         "table": {"headings": ["Size", "Price"], "rows": [{"_key": "r", "cells": ["Small", "$65"]}]}},
        {"_key": "x", "kind": "text", "body": [
            block("What to tell the groomer", style="h2"),
            block("Useful information is not a confession; it is the map."),
            block("Bring the leash.", list_item="bullet")]},
        {"_key": "c", "kind": "callout", "heading": "Appointment handoff",
         "body": [block("Bring your notes — the groomer needs them.")]},
    ],
    "artworkReview": {"evidence": "robust seamless leverage"},
    "sources": [{"title": "A comprehensive source", "url": "https://example.com"}],
}


def run_main(args):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = tells.main(args)
    return code, out.getvalue(), err.getvalue()


class HumanizeScannerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def write(self, name, obj):
        path = os.path.join(self.tmp, name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(obj, f)
        return path

    def test_snackbox_sections_keep_headings_and_skip_review_fields(self):
        doc = tells.load_portable_text({"document": DRAFT})
        heads = [b.text for b in doc.blocks if b.kind == "h2"]
        self.assertEqual(heads, ["Prices by size", "What to tell the groomer", "Appointment handoff"])
        texts = " ".join(b.text for b in doc.blocks)
        self.assertIn("Sample of 12 menus", texts)
        self.assertIn("Small | $65", texts)
        self.assertNotIn("leverage", texts)
        self.assertNotIn("comprehensive source", texts)

    def test_scan_finds_tells_in_meta_and_sections(self):
        r = tells.analyze(tells.load_portable_text(DRAFT))
        cats = [f["category"] for f in r["findings"]]
        self.assertIn("em-dash", cats)
        self.assertIn("structure", cats)
        vocab = [f["text"] for f in r["findings"] if f["category"] == "ai-vocab"]
        self.assertTrue(any("Seamless" in t for t in vocab))
        self.assertTrue(any("Unlock" in t for t in vocab))

    def test_gate_fails_on_em_dash_and_passes_clean_draft(self):
        code, _, err = run_main([self.write("before.json", DRAFT), "--gate"])
        self.assertEqual(code, 1)
        self.assertIn("em-dash", err)
        clean = copy.deepcopy(DRAFT)
        clean["title"] = "Test guide: a checklist"
        clean["seo"]["description"] = "Get the answer."
        clean["sections"][1]["body"][1] = block("Tell the groomer about the snapping. They plan for it.")
        clean["sections"][2]["body"][0] = block("Bring your notes. The groomer needs them.")
        code, _, err = run_main([self.write("after.json", clean), "--gate"])
        self.assertEqual(code, 0, err)

    def test_compare_flags_lost_link_and_new_number(self):
        after = copy.deepcopy(DRAFT)
        after["body"] = [block("Most dogs need a bath every 5 weeks.")]
        code, out, _ = run_main(["--compare", self.write("b.json", DRAFT), self.write("a.json", after), "--json"])
        self.assertEqual(code, 1)
        result = json.loads(out)
        self.assertIn("https://www.aspca.org/x", result["links"]["missing"])
        self.assertEqual(result["numbers"]["new"], ["5"])

    def test_compare_passes_when_facts_survive_across_formats(self):
        md = os.path.join(self.tmp, "after.md")
        with open(md, "w", encoding="utf-8") as f:
            f.write("---\ntitle: Test guide\nexcerpt: What a $70 groom includes.\n---\n"
                    "Most dogs need a bath every 4 to 6 weeks ([ASPCA](https://www.aspca.org/x)).\n\n"
                    "| Size | Price |\n|---|---|\n| Small | $65 |\n\nSample of 12 menus, Sep 2026.\n")
        code, out, _ = run_main(["--compare", self.write("b.json", DRAFT), md])
        self.assertEqual(code, 0, out)


if __name__ == "__main__":
    unittest.main()
