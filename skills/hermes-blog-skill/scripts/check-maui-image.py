#!/usr/bin/env python3
"""Check image bytes and a separately performed visual review; never infer anatomy."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def inspect(path, review_path=None, reference_path=None):
    errors = []
    with Image.open(path) as image:
        image.load()
        width, height = image.size
        if image.format != "PNG" or image.mode != "RGBA":
            errors.append("Final asset must be an RGBA PNG")
        if min(width, height) < 1024:
            errors.append("Both dimensions must be at least 1024 pixels")
        alpha = image.getchannel("A") if image.mode == "RGBA" else None
        alpha_range = alpha.getextrema() if alpha else None
        bounds = alpha.point(lambda value: 255 if value > 8 else 0).getbbox() if alpha else None
        if alpha_range != (0, 255):
            errors.append("Image needs real transparent background and opaque subject pixels")
        margins = None
        if bounds:
            x0, y0, x1, y1 = bounds
            margins = [x0 / width, y0 / height, (width - x1) / width, (height - y1) / height]
            if min(margins) < 0.02:
                errors.append("Subject is too close to an edge; inspect composition before approval")
        else:
            errors.append("No visible subject")
        if alpha and any(alpha.getpixel(point) != 0 for point in [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]):
            errors.append("Canvas corners are not fully transparent")
    file_pass = not errors
    review_pass = False
    if review_path:
        review = json.loads(Path(review_path).read_text())
        if review.get("sha256") != digest(path):
            errors.append("Visual review does not match these image bytes")
        if not reference_path or review.get("referenceSha256") != digest(reference_path):
            errors.append("Approved appearance reference is missing or changed")
        if review.get("decision") != "approved":
            errors.append("Visual review is not approved")
        for key in ["identity", "anatomy", "bandana", "completeEdges", "transparency", "sceneSafety"]:
            if review.get("checks", {}).get(key) is not True:
                errors.append("Visual check missing or failed: " + key)
        if not str(review.get("reviewer", "")).strip() or not str(review.get("evidence", "")).strip():
            errors.append("Actual reviewer and observation evidence are required")
        try:
            reviewed = datetime.fromisoformat(review["reviewedAt"].replace("Z", "+00:00"))
            if reviewed.tzinfo is None or reviewed > datetime.now(timezone.utc):
                raise ValueError("Invalid review time")
        except (KeyError, TypeError, ValueError):
            errors.append("Review needs a valid past ISO timestamp with timezone")
        review_pass = not errors
    return {"file": str(path), "sha256": digest(path), "width": width, "height": height,
            "alphaRange": alpha_range, "subjectBounds": bounds, "marginFractions": margins,
            "fileChecksPass": file_pass, "visualReviewRecorded": bool(review_path),
            "approved": file_pass and review_pass, "errors": errors,
            "limitation": "File checks cannot verify anatomy or the truth of a visual review."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--review", type=Path)
    parser.add_argument("--reference", type=Path)
    args = parser.parse_args()
    try:
        result = inspect(args.image, args.review, args.reference)
        print(json.dumps(result, indent=2))
        return 0 if (result["approved"] if args.review else result["fileChecksPass"]) else 1
    except (OSError, ValueError, TypeError) as error:
        print(json.dumps({"approved": False, "error": str(error)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
