# Maui Mascot - Image Generation Prompt Guide

## Base Character Prompt (use this as the foundation for every Maui image)

```
MAUI BASE PROMPT:
---
Character: A small, fluffy cream/ivory-colored dog (Maltese/Bichon Frise mix) in the style of a modern children's book illustration.

Face: Large, round, dark brown eyes (not black) with two small white circular highlight dots in the upper area of each eye, giving a warm gentle expression. Small dark brown nose (not black) with a tiny shine highlight. Wide open smile with a soft pink tongue poking out to one side. No visible teeth.

Fur: Cream/ivory base color (#F5EBD8), NOT bright white. Visible individual fluffy tufts and scribbly textured strokes throughout the coat, especially on the head, chest, and tail. A distinct messy fluffy crown/poof of fur on top of the head. Warm beige/tan shading (#D4C4A8) in shadow areas (under ears, chest, between legs). The silhouette is irregular and organic because of the tufted fur, not smooth or clean-edged.

Body: Kawaii proportions. Head is roughly 40-45% of total character height. Compact, slightly chunky body. Short stubby legs. Simple round paws with no detailed toes. Fluffy tail curled upward. Floppy ears hang down at the sides and blend seamlessly into the head fur.

Signature accessory: Usually wearing a deep red bandana (#C1272D) tied around the neck with "MAUI" in white text and a small white paw print. The bandana is visible in the large majority of scenes (target ~85%+); it may be omitted in costume-driven scenes where the bandana would clash with or obscure the costume design (e.g. full hoodie costume, full-body wrap). When omitted, the costume itself anchors the brand.

Art style: Sticker mascot illustration. Dark brown outlines (#3D2B1F), NOT pure black. Outlines are clean and consistently dark, with subtle weight variation. Slightly thicker on the exterior silhouette, slightly thinner on interior details. NOT sketchy, NOT broken, NOT loose hand-drawn looseness. This is a sticker mascot, not a children's book illustration. Flat cel-shaded coloring with soft warm shading. Sticker-like presentation. NOT a mascot logo, NOT clip art, NOT 3D render, NOT pixel art.

Composition: Character centered in frame. Square format. Pure white (#FFFFFF) or transparent background with absolutely no color, gradients, or shadows behind the character.

Mood: Happy, friendly, cheerful.
---
```

## Style Anchors (priority order)

When generating a new Maui scene, use these as reference images in the order listed:

1. `maui-anxious-dog-grooming-blog.png`. Primary style anchor. Cleanest match to the desired aesthetic (clean uniform linework, two-tone cel shading on the towel, minimal interior fur detail).
2. `maui-rain-mud-blog.png`. Hind-legs and standing-pose anchor (torso covered by raincoat).
3. `maui-cat-grooming-blog.png`. Costume scene anchor.

## How to Use

1. Start with the full base prompt above
2. Add a SCENE line describing what Maui is doing and what props are around him
3. Add a BODY POSITION line to force a non-default pose
4. Add a MOOD line if the mood differs from the default cheerful tone
5. Keep props simple and iconic (one or two items, not complex scenes)

## Scene Prompt Template

```
[FULL BASE PROMPT FROM ABOVE]

Scene: Maui is [DOING WHAT] with [WHAT PROPS] around him.
Body position: [SPECIFIC POSE - important to avoid defaulting to sitting/waving]
Mood: [cheerful / curious / cozy / gentle / playful / etc.]
```

## Key Style Notes (what goes wrong and how to fix it)

| Common AI Mistake | What Maui Actually Looks Like | Prompt Fix |
|-------------------|------------------------------|------------|
| Pure black outlines | Dark brown outlines (#3D2B1F) | "Dark brown outlines, NOT black" |
| Smooth, clean fur | Scribbly tufted texture, messy fluffy crown | "Visible individual fur tufts with scribbly textured strokes" |
| Solid black eyes | Dark brown with white highlight dots | "Dark brown eyes with two small white circular highlights" |
| Bright white fur | Warm cream/ivory | "Cream/ivory (#F5EBD8), NOT bright white" |
| Mascot/logo feel | Children's book illustration feel | "Children's book illustration style, NOT a mascot logo" |
| Smooth symmetrical silhouette | Irregular organic edges from fur tufts | "Silhouette is irregular and organic because of tufted fur" |
| Generic cartoon dog | Specific Maltese/Bichon with personality | Include all face details (tongue to one side, highlight dots, etc.) |

## Hind-Legs Poses (important rule)

Every on-brand hind-legs Maui asset wraps the torso in a costume, coat, tank, or apron (raincoat in umbrella Maui, cardigan in senior Maui, apron in mobile-grooming-cost Maui). This is NOT decorative. It is the workaround that prevents bipedal-anatomical proportion drift. Without a torso wrap, both Gemini and OpenAI default to "realistic puppy standing" and elongate the body.

When writing a hind-legs scene, do one of:

- **Wrap the torso** with season-appropriate clothing (matches the umbrella and senior pattern). This is the established convention.
- **Anchor explicitly** in the scene line with a clause like: *"stand pose identical in proportion to the umbrella reference. Head dominates the silhouette, hind legs short and chunky, NOT elongated."*
- **Switch the pose** entirely (seated, four-legged trot, lying down).

If none of those apply, default to a seated pose to avoid the drift.

## Existing Blog Image Scenes (for reference)

| Blog Post | Scene Description |
|-----------|-------------------|
| Grooming cost guide | Maui sitting, waving one paw. A piggy bank and a few coins beside him. |
| Rain & mud guide | Maui standing upright wearing a yellow raincoat, holding a yellow umbrella. Rain drops falling around him. |
| Seasonal guide | Maui sitting happily. A fallen autumn leaf, a green leaf, and a snowflake around him. |
| Winter grooming | Maui sitting, wearing a teal knit beanie with a green pompom and a matching teal patterned scarf over his bandana. Teal snowflakes floating around him. |
| Cat grooming | Maui sitting, wearing a gray cat ear hoodie costume over his body. A pink ball of yarn beside him. |
| Choosing a groomer | Maui sitting at a small wooden table with grooming tools on it, holding a magnifying glass up to one eye. Curious expression. |
| Grooming frequency | Maui sitting happily next to a desk calendar showing "MARCH." |
| Goldendoodle guide | Maui mid-jump/running, holding a slicker brush in one paw. Playful, energetic pose. |
| Mobile grooming cost | Maui standing upright wearing a teal groomer's apron, holding scissors and a hair dryer. Grooming van behind him. |
| Anxious dog grooming | Maui snuggled wrapped up in a soft pastel sky-blue towel like a cozy burrito, only his fluffy face and one front paw peeking out, eyes peacefully closed in a soft smile. A tiny purple lavender sprig beside him. Communicates calm/supported, not just "happy dog." |
| Severely matted dog grooming | Maui standing tall and freshly fluffy, looking down at a small grayish-tan tangled fur clump on the ground beside him with a relieved proud smile. Two small sparkle stars above his back. NO brush — the story is "mat removed, Maui is fluffy now." |
| Puppy first grooming | Maui mid-trot toward viewer, gold star rosette ribbon clipped beside his red bandana. NO bow, NO head accessories — gold rosette is the only extra. Slightly puppier proportions (head ~50%, eyes a touch larger). Reads as masculine first-time energy. |

## Pipeline (Auto-Generation)

To generate paired Gemini + OpenAI variants for any new blog post, use the `/maui-image` slash command:

```
/maui-image <slug> "<scene description>"
```

This invokes `scripts/maui-blog-image.sh`, which writes both variants to `public/maui-assets/_compare/<slug>/{gemini,openai}.png` and updates the compare index. After review, promote the winner with the `mv` command printed at the end. The `/blog` workflow calls `/maui-image` automatically in Step 5.

## Rules

- The red "MAUI" bandana is visible in MOST scenes (target ~85%+). It MAY be omitted in costume-driven scenes (full hoodie, full-body wrap, themed outfit) where the bandana would visually clash or get obscured. When omitting, the costume itself should serve as the brand anchor.
- Keep backgrounds pure white or transparent, no color at all
- Props should be simple, iconic, and immediately recognizable at small sizes
- Maui should always look happy and friendly (exceptions: curious expression for investigative scenes)
- One or two props max per scene to keep the sticker-like quality
- No text in the image other than "MAUI" on the bandana
- Always specify BODY POSITION explicitly to avoid the default sitting/waving pose
- Outlines are DARK BROWN, never pure black
- Fur color is CREAM/IVORY, never bright white
