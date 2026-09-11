#!/usr/bin/env python3
"""Extract the background without regenerating or globally color-keying Maui's fur.

Requires numpy, scipy, Pillow (the project's .venv_rembg provides them).
Only background-colored regions connected to the border or reviewed seeds are removed.
Approved masters are inputs only. Antialiased outer edges are unmatted from cream.
"""
from pathlib import Path
import argparse
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi


def extract(source, seeds=(), tolerance=38, lower_tolerance=None):
    rgb = np.asarray(Image.open(source).convert('RGB')).astype(np.float32)
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3),
                             rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)])
    paper = np.median(border, axis=0)
    compatible = np.max(np.abs(rgb - paper), axis=2) <= tolerance
    if lower_tolerance:
        start = round(lower_tolerance['y'] * h)
        compatible[start:] = np.max(np.abs(rgb[start:] - paper), axis=2) <= lower_tolerance['tolerance']
    # Tiny raster gaps in an otherwise closed outline must not leak the background
    # selection into cream fur. Close the selection barrier, never the artwork.
    compatible = ~ndi.binary_closing(~compatible, iterations=2)
    labels, count = ndi.label(compatible)
    exterior = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    exterior = exterior[exterior != 0]
    selected = list(exterior)
    for x, y in seeds:
        label = int(labels[round(y * (h - 1)), round(x * (w - 1))])
        if not label:
            raise ValueError(f'Background seed is not background-colored: {source}: {(x, y)}')
        selected.append(label)
    background = np.isin(labels, selected)
    foreground = ~background
    # Only a two-pixel band around the cut edge may change RGB. All interior pixels stay exact.
    core = ndi.binary_erosion(foreground, iterations=2)
    _, indices = ndi.distance_transform_edt(~core, return_indices=True)
    estimate = rgb[indices[0], indices[1]]
    delta = paper - estimate
    alpha = np.clip(np.sum((paper - rgb) * delta, axis=2) /
                    np.maximum(np.sum(delta * delta, axis=2), 1), 0, 1)
    band = ndi.binary_dilation(foreground, iterations=2) & ~core
    alpha = np.where(core, 1, np.where(band, alpha, 0))
    alpha[alpha < 0.04] = 0
    alpha[alpha > 0.98] = 1
    # Discard only tiny isolated pale fragments from the removed paper/shadow.
    # Dark linework and colored accents are explicitly excluded from this cleanup.
    specks, _ = ndi.label(alpha > 0)
    sizes = np.bincount(specks.ravel())
    for label in np.flatnonzero((sizes > 0) & (sizes <= 40)):
        if label == 0:
            continue
        pixels = specks == label
        if np.max(np.abs(rgb[pixels] - paper)) < 90:
            alpha[pixels] = 0
    recovered = np.clip((rgb - (1 - alpha[:, :, None]) * paper) /
                        np.maximum(alpha[:, :, None], 0.001), 0, 255)
    output_rgb = np.where(((alpha > 0) & (alpha < 1))[:, :, None], recovered, rgb)
    output_rgb[alpha == 0] = 0
    output = np.dstack([output_rgb.round().astype(np.uint8), (alpha * 255).round().astype(np.uint8)])
    # Candidate enclosed regions are reported for human visual review, never automatically removed.
    objects = ndi.find_objects(labels)
    candidates = []
    for label, region in enumerate(objects, 1):
        if region is None or label in selected:
            continue
        local = labels[region] == label
        area = int(local.sum())
        if area < 100:
            continue
        yy, xx = np.nonzero(local)
        yy += region[0].start
        xx += region[1].start
        color = np.median(rgb[yy, xx], axis=0)
        center = np.argmin((xx - xx.mean()) ** 2 + (yy - yy.mean()) ** 2)
        candidates.append({'id': label, 'area': area,
                           'seed': [round(float(xx[center] / (w - 1)), 5), round(float(yy[center] / (h - 1)), 5)],
                           'paperDistance': round(float(np.max(np.abs(color - paper))), 1)})
    return Image.fromarray(output, 'RGBA'), candidates, paper.tolist(), int(core.sum())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--seeds', type=Path)
    parser.add_argument('--only', nargs='+')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    rows = json.loads(args.sources.read_text())
    if args.only:
        rows = [row for row in rows if row['scene'] in args.only]
    seeds = json.loads(args.seeds.read_text()) if args.seeds else {}
    args.output.mkdir(parents=True, exist_ok=True)
    reports = []
    for row in rows:
        scene = row['scene']
        settings = seeds.get(scene, {})
        if isinstance(settings, list):
            settings = {'seeds': settings}
        result, candidates, paper, core = extract(root / row['source'], **settings)
        temporary = args.output / f'{scene}.pending.png'
        result.save(temporary, compress_level=6)
        temporary.replace(args.output / f'{scene}.png')
        diagnostic = Image.new('RGB', result.size, '#26314c')
        diagnostic.paste(result, mask=result.getchannel('A'))
        draw = ImageDraw.Draw(diagnostic)
        for c in candidates:
            if c['paperDistance'] > 14:
                continue
            x, y = [c['seed'][i] * (result.size[i] - 1) for i in range(2)]
            draw.ellipse((x-13, y-13, x+13, y+13), fill='#ff2070')
            draw.text((x-9, y-6), str(c['id']), fill='white')
        diagnostic.save(args.output / f'{scene}-regions.jpg')
        reports.append({**row, 'paper': paper, 'protectedInteriorPixels': core, 'candidates': candidates})
        print(scene, 'done', flush=True)
    report_path = args.output / 'regions.json'
    if args.only and report_path.exists():
        merged = {row['scene']: row for row in json.loads(report_path.read_text())}
        merged.update({row['scene']: row for row in reports})
        reports = list(merged.values())
    report_path.write_text(json.dumps(reports, indent=2))


if __name__ == '__main__':
    main()
