# Maui appearance standard — user approved September 2026

The owner explicitly approved the six images in `approved-reference/` and said:
“THIS IS HOW WE WANT MAUI TO LOOK EVERYTIME IN TERMS OF CONSISTENCY OF HIS LOOK”.
These files are fixed appearance references. Never overwrite them with subsequent
generations. This standard supersedes all older Maui prompts and style guidance.

## Reference priority

1. `approved-reference/brushing-v2.png` — default appearance reference for every scene.
2. The other five approved images — pose-specific checks for bath, blow dry, costume,
   nail trimming, and table scenes. Use when relevant, not to average unrelated styles.
3. An old scene can explain its subject/action, but must never override the approved appearance.

## Appearance that stays fixed

- Rounded, fluffy cream-white head; floppy ears; compact canine torso and short paws.
- Solid dark burgundy beady oval eyes with one clean white highlight each. No white around the eye, no iris,
  no separate pupil (owner, November 2026: eyes with whites "don't match the look of Maui").
- Dark burgundy nose; pink tongue when the mouth is open.
- Clean thick dark burgundy exterior outlines and thinner interior detail lines.
- Solid cream and warm tan cel-shaded fur shapes; sculpted fluffy tufts, not sketchy strands.
- Red neck bandana with readable white `MAUI` and a small white paw emblem.
- Exactly four canine limbs total, with natural occlusion where a tub or towel hides them.
- Preserve this face and head/body relationship across poses and clothing. Do not change breed,
  invent a second character, lengthen the torso, or use human leg proportions.

## What changes with the action (owner direction, November 2026)

The owner found Maui uncanny when he did something while wearing the reference's front-facing grin.
The features above stay fixed, the beady eyes above all. The acting changes with every scene: he shows
where he looks by turning his head and pointing his nose, and how he feels with eyelids, cheeks, mouth
and ears. His whole body leans into it. The open grin
belongs to play and joy. Work gets a concentrating face, rest a sleepy one, a question a head tilt.
Vary the body too: upright, play bow, shake, leap, belly up, peeking over an edge, not only standing
or sitting. `scripts/maui-art-loop.py --plan` lists the designed actions.

## Composition and export

- Generate each scene independently with the fixed approved reference; do not extract a sprite grid.
- Square artwork for isolated characters; landscape only for expressly composed hero scenes.
- Keep the entire silhouette and props in frame. Aim for 10–15% breathing room;
  inspect actual output because a prompt does not guarantee the margin.
- Human hands end in complete closed sleeve cuffs inside the frame. Tables include complete legs.
- No erased tails, fading paws, ghosted tools, white sticker outlines, or clipped accessories.
- The approved masters have opaque cream backgrounds. Keep these immutable, but all site-facing Maui illustrations MUST have real RGBA transparency. Never call an RGB file transparent.
- Keep cream masters intact in `opaque-masters/` and `approved-reference/`. Any transparent derivative must be separately verified on cream,
  teal and dark backgrounds without deleting similarly colored fur or costume details.
- Prefer at least 1024 pixels per side; approved and rollout images are 1254 pixels square.
- Compare at the site's display size as well as full resolution. Do not stretch or crop to fill.

## Things that must not return

Sketchy or watercolor fur, 3D, photorealism, pixel art, generic puppy faces, inconsistent brown/black
outlines, white borders, fake checkerboards, erased character interiors, tiny sprite-derived exports.

## Workflow

Read this file and `public/maui-assets/MAUI-BASE-PROMPT.md`, inspect the fixed reference,
then add only the new scene/action. Inspect the result for identity, anatomy, readable bandana,
complete edges, and actual image dimensions/background. Save the prompt and source reference.
Keep historical review material and backups out of live asset mappings. Do not replace an approved
reference based on a later generation without explicit owner approval.

## Required background-removal finish

The owner subsequently rejected the opaque backgrounds for site use and requested removal
from every scene. Appearance approval does not approve a background rectangle. Use the
existing opaque master as input to `scripts/maui-remove-background.py`; do not redraw Maui
just to remove his background. The extractor removes only border-connected cream and
explicitly reviewed enclosed background regions, preserving similarly colored fur.

Use `docs/maui/transparency-seeds.json` for reviewed gaps. Inspect all scenes on teal and
dark, including the spaces between limbs and props. Confirm full RGBA, empty canvas
corners, intact white/cream character interiors, and clean antialiased edges. Background
color matching must never be applied globally to the character. Update image cache versions
when replacing site derivatives. Green-screen regeneration is a fallback only when the
existing master cannot be separated cleanly without damaging the approved appearance.
