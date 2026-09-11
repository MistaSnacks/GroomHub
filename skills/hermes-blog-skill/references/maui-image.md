description: Generate Maui blog illustration variants using GroomLocal's approved September 2026 appearance, then prepare and verify a transparent site export.

# /maui-image — Maui illustrations for Grooming Guides

Create a topic-appropriate Maui illustration for GroomLocal's Grooming Guides. The project root is the current GroomLocal checkout. All project paths below are relative to that root.

## Read the current design standard

Before creating, editing, or choosing artwork, read:

- [Maui style standard](maui/STYLE-STANDARD.md)
- [Canonical base prompt](maui/MAUI-BASE-PROMPT.md)

Inspect `docs/maui/approved-reference/brushing-v2.png` as the fixed appearance reference. The other five approved references support relevant pose checks. These immutable September 2026 references supersede older style guidance. Do not anchor identity to `00-maui-main.png`, add a flat-sticker override, or replace an approved reference with a later generation.

Lock Maui's rounded cream-white head, compact canine body, short paws, burgundy outlines, cream/tan cel shading, and red MAUI bandana with its white paw emblem. Change only the action, pose, and props. Follow the standard for anatomy, margins, complete edges, dimensions, and export checks.

## Input and generation

Invocation:

```text
/maui-image <slug> "<scene description>"
```

Use a kebab-case illustration identifier and a short description of Maui's action, pose, and relevant props. Match the article's subject; choose a simple scene from the supplied article when no scene is specified. Ask only when the subject or intended scene cannot be inferred. Keep appearance rules in the canonical base prompt.

From the project root, the existing helper is:

```bash
scripts/maui-blog-image.sh <slug> "<scene description>"
```

It reads `public/maui-assets/MAUI-BASE-PROMPT.md`, references `docs/maui/approved-reference/brushing-v2.png`, and invokes the bundled Gemini and OpenAI image helpers in `scripts/image-providers/`. It writes candidates to `public/maui-assets/_compare/<slug>/` and refreshes the comparison index. These candidates use a solid cream background as generation masters. Do not force white backgrounds or claim that PNG encoding alone supplies transparency.

Inspect the actual outputs, not just the helper's completion message. If one provider fails, report which candidate exists; do not promise an unverified fallback. Do not repeatedly generate variants without addressing a concrete failure. If a comparison preview is already running, use its actual URL rather than assuming port 3001. Preserve any user-requested variant selection before proceeding.

## Required transparent export

1. Compare the selected candidate to the approved reference: face and proportions, exactly four canine limbs with natural occlusion, readable bandana, complete tail/ears/paws/props, closed cuffs where hands appear, and unclipped edges. Fix failures before installation.
2. Retain the opaque master separately in `docs/maui/opaque-masters/` and save its prompt and source-reference provenance. Never overwrite approved references.
3. Use `scripts/maui-remove-background.py` on the opaque master to create a separate RGBA PNG. Follow `docs/maui/STYLE-STANDARD.md`; inspect the helper's source-manifest format before running it. Reuse `docs/maui/transparency-seeds.json` only for matching reviewed scenes. Review new enclosed background regions before adding seeds. Remove only background regions, never cream-colored pixels globally or intact fur/costume details. Do not regenerate Maui simply to remove a background.
4. Verify real RGBA alpha, transparent canvas corners, intact character interiors, and clean antialiased edges. Inspect the cutout on cream, teal, and dark at full resolution and site display size. Check gaps between limbs and props. Reject cream rectangles, fake checkerboards, white sticker borders, erased fur, clipped accessories, and stretched or cropped compositions. Follow the standard's minimum dimensions and margins.
5. Install only the verified transparent derivative, for this new-only workflow `public/maui-assets/<slug>.png`. Do not replace existing article artwork in a weekly run. Set the article's MDX `image:` field to that asset. Use the new query-free asset URL and check it against `next.config.ts` image patterns. Keep opaque masters and comparison candidates out of live asset mappings. Never directly move an opaque comparison candidate into a live asset path.

For a new article, add its article slug to the appropriate topic in `src/lib/grooming-guides.ts`. The visitor-facing section is Grooming Guides at `/blog`; existing article routes stay `/blog/<article-slug>`.

Report the produced image, checks actually completed, and any unresolved defects. Creating or selecting an image does not itself authorize deployment.
