# Maui Base Prompt — approved appearance standard

Appearance reference: `docs/maui/approved-reference/brushing-v2.png`.
The owner approved this look in September 2026. Read `docs/maui/STYLE-STANDARD.md`.
This is the sole prompt block consumed by `scripts/maui-blog-image.sh`.

MAUI BASE PROMPT:
---
CHARACTER: Maui, the exact fluffy cream-white dog in the approved reference. Lock the same rounded fluffy head, floppy ears, compact canine torso, short rounded paws, dark burgundy eyes and nose, friendly smile and pink tongue. Preserve identical face and head/body proportions across every pose.

FUR AND LINEWORK: Clean thick dark burgundy exterior outlines, thinner interior lines, solid cream/ivory fur and warm tan angular cel-shaded shapes. Clean sculpted tufts. Crisp vector-like raster illustration. Never sketchy, painterly, photorealistic, 3D or pixel art. Never add a white sticker border.

ANATOMY: Exactly four canine limbs total, two front and two rear, with natural occlusion where necessary. No extra limbs, no elongated human torso. If standing upright, keep short compact dog proportions.

ACCESSORY: Red bandana tied around neck with clearly readable white MAUI and small white paw emblem. It may be naturally partly hidden by a bath or towel, but never replaced with a different name.

COMPOSITION: Change only scene/action/props from the approved appearance reference. Keep complete character and all props comfortably inside canvas with 10–15 percent breathing room. Complete tails, ears, paws, tables, umbrellas, brushes and cuffs. A hand must end in a closed sleeve cuff within the image. No edge clipping, faded body parts, ghosted objects, or sprite-sheet extraction.

BACKGROUND AND OUTPUT: Uniform solid cream #FDF8F0 background matching approved masters, no checkerboard, white border, or fake transparency. Character and props fully opaque. Square high-resolution image at least 1024 pixels per side unless a landscape hero is explicitly requested. No captions or watermarks. Inspect actual output for dimensions, anatomy, identity and clear edges before use.
---

SITE EXPORT GATE: The cream image above is a generation master, not a deployable site asset.
Extract its background without changing Maui, save true RGBA PNG, and verify the cutout
on teal and dark surfaces before site use. See `docs/maui/STYLE-STANDARD.md`.
