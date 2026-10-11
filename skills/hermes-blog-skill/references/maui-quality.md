# Maui image quality gate

Apply to the hero and every inline illustration, before any CMS publication. Keep uncertain images in draft; a confident generation response is not a review.

1. Generate a new scene with the fixed approved brushing reference. Preserve prompt, actual generator/model, reference identity and opaque master. Export a separate true RGBA PNG using the existing background-removal workflow. No recycling production art for a new article.
2. Run bundled `scripts/check-maui-image.py <final.png>` with Pillow. It reports SHA-256, PNG/RGBA format, dimensions (at least 1024 each side), actual alpha range, nonempty opaque subject, and transparent edge margin. A file pass only means it is ready for visual inspection. The checker cannot count limbs or detect erased fur.
3. The separate visual pass is automated by `scripts/maui-art-loop.py`, which drives steps 1, 2, 4 and 5 and only stops when the gate passes or attempts run out. Its judge, `scripts/maui-jev-gate.py`, works in two stages so the decision is calibrated rather than a nervous self-assessment: a vision model (default `gpt-5.4`, override with `MAUI_VISION_MODEL`) records literal observations about the candidate beside `references/maui/approved-reference/brushing-v2.png` (paw counts and which limb each belongs to, tail, ears, face comparison, bandana text as read, props, stray text, clipping, margins, background, and for exports holes or rectangles on a teal composite); TypeSafe Jev (`jev-latest`, `TYPESAFE_API_KEY`) then answers one yes/no question per gate from those observations and the Maui standard. Gates: identity, anatomy, bandana, edges, style, scene, clean_text, gaze (code-owned: Maui's eyes must be on the prop or task, not on the viewer, and the face must not repeat the reference's camera grin; off only with `--allow-viewer-gaze`), and transparency for the final export. Every gate must reach `--threshold` (default 0.85). A failing gate feeds a concrete correction sentence into the next generation prompt. Each run keeps `master.jev-gate.json` and `final.jev-gate.json` with the raw observations and probabilities so a person can audit the call. The agent may still look at the approved final and block on a concrete named defect, but it may not override an approved gate with unexplained uncertainty, and it may not approve an image the gate rejected. If the loop reports `exhausted`, keep the best candidate unapproved and report; a person decides. The gate checks the same points a person would:
   - Same rounded face, compact canine proportions, burgundy outlines, cream/tan cel shading.
   - Exactly four limbs total, accounting for natural occlusion; no extra paws or human leg proportions.
   - Complete tail, ears, paws, props, tables and sleeve cuffs; comfortable margins.
   - Red bandana, readable MAUI and paw emblem when visible; no wrong name.
   - Real transparency and clean edges, with intact cream fur and no holes, checkerboards or background rectangles.
   - Scene matches the article and does not depict unsafe grooming advice.
4. The loop writes `image-review.json` from a passing final gate (reviewer names the vision model and Jev; evidence carries the observations and probabilities). Write one by hand only when a person reviewed the image instead:

```json
{
  "sha256": "<exact final PNG hash>",
  "referenceSha256": "<approved brushing reference hash>",
  "reviewer": "<actual person or vision agent/model>",
  "reviewedAt": "<ISO timestamp with timezone>",
  "decision": "approved",
  "checks": {
    "identity": true, "anatomy": true, "bandana": true,
    "completeEdges": true, "transparency": true, "sceneSafety": true
  },
  "evidence": "<specific observations, including visible/occluded limbs and background checks>"
}
```

5. Re-run `check-maui-image.py <final.png> --review <image-review.json> --reference <brushing-v2.png>`. Only `approved: true` passes the combined gate. Any missing, uncertain, false or changed result blocks publishing. The checker validates the review record and file identity; it does not independently prove the review is honest or anatomically correct.
6. Upload to Snackbox, download `originalUrl` and confirm the same SHA-256. The CMS also generates WebP variants: different hashes are expected for those, but their transparency and appearance must still be inspected. Review again if any bytes of the original change. Record per-image asset ID, original hash, served URLs and review evidence; all images must be covered before marking the article ready.

The loop's `--max-attempts` (default 4) bounds image spend; do not add manual generation rounds on top of it. When it reports `exhausted`, retain the best candidate as unapproved and report the failing gates and probabilities rather than accepting a flawed image. The loop's export stage already asks the vision observer to classify every numbered region in `<slug>-regions.jpg` (`scripts/maui-export-seeds.py`) so only genuine background gaps become seeds (never a color rule: Maui's cream fur is almost paper-colored), re-extracts with those seeds, and fills pinhole specks of at most 40 pixels inside the character (`scripts/maui-fill-specks.py`; larger enclosed regions are reported, never filled). When it still reports `needs_export_review`, the master is approved and only the transparent export needs a person's seeds: inspect `<slug>-regions.jpg` and `seeds.json`, correct the seed list, and re-run the export step, not a new generation. Human review is the fallback when the loop cannot reach the threshold.
