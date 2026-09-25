#!/usr/bin/env python3
"""Fill pinhole transparency specks inside an RGBA Maui export.

The background extractor can leave one-to-few-pixel transparent holes inside cream fur
where the paper color matched. Those are export artifacts, not background. This fills
transparent components that are NOT connected to the canvas border and are at most
--max-area pixels, copying color from neighbouring opaque pixels. Larger enclosed
regions (real gaps such as the inside of a handle) are left alone and reported so
they can be handled with reviewed seeds.

Usage: maui-fill-specks.py <in.png> --out <out.png> [--max-area 40]
Prints a JSON report and exits 0. Pure Pillow, no numpy.
"""
from __future__ import annotations

import argparse
import collections
import json
from pathlib import Path

from PIL import Image


def enclosed_components(alpha_pixels, width: int, height: int) -> list[list[tuple[int, int]]]:
    seen = bytearray(width * height)
    queue: collections.deque = collections.deque()

    def push(x: int, y: int) -> None:
        index = y * width + x
        if alpha_pixels[x, y] == 0 and not seen[index]:
            seen[index] = 1
            queue.append((x, y))

    for x in range(width):
        push(x, 0)
        push(x, height - 1)
    for y in range(height):
        push(0, y)
        push(width - 1, y)
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height:
                push(nx, ny)
    components: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if alpha_pixels[x, y] == 0 and not seen[index]:
                seen[index] = 1
                component = [(x, y)]
                queue.append((x, y))
                while queue:
                    cx, cy = queue.popleft()
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < width and 0 <= ny < height and alpha_pixels[nx, ny] == 0 and not seen[ny * width + nx]:
                            seen[ny * width + nx] = 1
                            queue.append((nx, ny))
                            component.append((nx, ny))
                components.append(component)
    return components


def fill(source: Path, out: Path, max_area: int) -> dict:
    with Image.open(source) as image:
        rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    alpha = rgba.getchannel("A").load()
    components = enclosed_components(alpha, width, height)
    filled = 0
    left = []
    for component in components:
        if len(component) > max_area:
            xs = [p[0] for p in component]
            ys = [p[1] for p in component]
            left.append({"area": len(component), "bbox": [min(xs), min(ys), max(xs), max(ys)]})
            continue
        pending = set(component)
        # Grow color inward from opaque neighbours until every pixel is filled.
        while pending:
            progressed = False
            for x, y in list(pending):
                neighbours = [pixels[nx, ny] for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))
                              if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny][3] > 0 and (nx, ny) not in pending]
                if neighbours:
                    r = sum(n[0] for n in neighbours) // len(neighbours)
                    g = sum(n[1] for n in neighbours) // len(neighbours)
                    b = sum(n[2] for n in neighbours) // len(neighbours)
                    pixels[x, y] = (r, g, b, 255)
                    pending.discard((x, y))
                    progressed = True
            if not progressed:
                break
        filled += len(component) - len(pending)
    rgba.save(out, format="PNG", compress_level=6)
    return {"source": str(source), "out": str(out), "enclosed_components": len(components),
            "filled_pixels": filled, "remaining_gaps": left, "max_area": max_area}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("image", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--max-area", type=int, default=40)
    args = parser.parse_args()
    report = fill(args.image, args.out, args.max_area)
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
