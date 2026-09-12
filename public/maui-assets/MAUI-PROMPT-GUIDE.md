# Maui generation guide — approved September 2026

The owner approved the six recreations in `docs/maui/approved-reference/` and explicitly
requested this appearance for every Maui image. This guide replaces the older conflicting
sticker / sketch / black-outline instructions.

Read `docs/maui/STYLE-STANDARD.md` for the complete appearance and QA rules.
Use `MAUI-BASE-PROMPT.md` as the only base prompt. Always supply
`docs/maui/approved-reference/brushing-v2.png` as the primary appearance reference.

Add a specific scene and body position; preserve the approved face, proportions, cream/tan
cel shading, clean burgundy outlines, and red MAUI bandana. Old scene artwork is a subject
reference only. Do not use older anxious-dog, chibi, or comparison outputs as style anchors.

The six approved reference masters are immutable. The site library may contain derivatives
and additional scenes, but those must not silently redefine the approved appearance.

The historical `scripts/maui-blog-image.sh` generates review candidates using the same fixed
reference and base prompt. Built-in OpenAI image generation is also supported. Never silently
promote candidates: inspect identity, four-limb anatomy, clipping, resolution and background.
The owner authorized the September 2026 library rollout; future unrelated redesigns need their
own direction. Opaque cream masters must never be described as transparent.

## Site output requirement

Every delivered site illustration must be a verified transparent RGBA PNG. Opaque cream
is permitted only for the preserved generation master, followed by background extraction
and visual checks on teal and dark. The owner explicitly requested removal of all
background rectangles. Read the removal procedure in `docs/maui/STYLE-STANDARD.md`.
