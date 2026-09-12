# Maui image quality gate

Apply to the hero and every inline illustration, before any CMS publication. Keep uncertain images in draft; a confident generation response is not a review.

1. Generate a new scene with the fixed approved brushing reference. Preserve prompt, actual generator/model, reference identity and opaque master. Export a separate true RGBA PNG using the existing background-removal workflow. No recycling production art for a new article.
2. Run bundled `scripts/check-maui-image.py <final.png>` with Pillow. It reports SHA-256, PNG/RGBA format, dimensions (at least 1024 each side), actual alpha range, nonempty opaque subject, and transparent edge margin. A file pass only means it is ready for visual inspection. The checker cannot count limbs or detect erased fur.
3. Perform a separate visual pass after generation, looking at the actual final export beside `references/maui/approved-reference/brushing-v2.png`. Inspect at full size and approximately 240/350 px, on cream, teal and dark. The reviewer can be a vision-capable agent or a person; record who actually reviewed it. Check:
   - Same rounded face, compact canine proportions, burgundy outlines, cream/tan cel shading.
   - Exactly four limbs total, accounting for natural occlusion; no extra paws or human leg proportions.
   - Complete tail, ears, paws, props, tables and sleeve cuffs; comfortable margins.
   - Red bandana, readable MAUI and paw emblem when visible; no wrong name.
   - Real transparency and clean edges, with intact cream fur and no holes, checkerboards or background rectangles.
   - Scene matches the article and does not depict unsafe grooming advice.
4. Save `image-review.json` only after that inspection:

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

Fix a specific defect and review again. After two unsuccessful correction attempts for the same defect, retain the best candidate as unapproved and report the problem rather than repeatedly spending image credits or accepting a flawed image. Human review is the fallback when the visual model cannot confidently determine anatomy.
