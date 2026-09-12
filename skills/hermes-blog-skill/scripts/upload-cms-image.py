#!/usr/bin/env python3
"""Upload a local PNG to GroomLocal media; does not create or publish an article."""
import argparse
import hashlib
import json
import os
import secrets
import urllib.error
import urllib.request
from pathlib import Path


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # Never forward the bearer token to a redirect destination.


def upload(path, alt):
    token = os.environ.get("SNACKBOX_GROOMLOCAL_TOKEN")
    if not token:
        raise ValueError("Set SNACKBOX_GROOMLOCAL_TOKEN in the receiving PC's environment")
    if path.stat().st_size > 50 * 1024 * 1024:
        raise ValueError("Image exceeds the CMS 50 MB limit")
    data = path.read_bytes()
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("Expected the final PNG export")
    if not alt.strip():
        raise ValueError("Image description is required")
    boundary = "groomlocal-" + secrets.token_hex(16)
    filename = "maui-" + hashlib.sha256(data).hexdigest()[:16] + ".png"
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="alt"\r\n\r\n{alt}\r\n'
            f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            'Content-Type: image/png\r\n\r\n').encode() + data + f"\r\n--{boundary}--\r\n".encode()
    request = urllib.request.Request("https://snackboxcms.com/api/v1/groomlocal/assets", data=body,
                                    headers={"Authorization": "Bearer " + token,
                                             "Content-Type": "multipart/form-data; boundary=" + boundary}, method="POST")
    opener = urllib.request.build_opener(NoRedirect())
    with opener.open(request, timeout=180) as response:
        result = json.load(response)
    asset = result.get("result", {})
    if not asset.get("id") or not asset.get("originalUrl"):
        raise ValueError("CMS response did not contain an asset ID and original URL; inspect library before retry")
    return {"asset": asset, "ref": {"_ref": asset["id"]}, "sourceSha256": hashlib.sha256(data).hexdigest(),
            "publication": "not attempted", "next": "Download originalUrl and verify hash; inspect served variants before publication."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--alt", required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(upload(args.image, args.alt), indent=2))
        return 0
    except urllib.error.HTTPError as error:
        print(json.dumps({"ok": False, "error": "CMS upload HTTP " + str(error.code),
                          "next": "Inspect the response/library before retrying; do not expose credentials."}))
    except (OSError, ValueError, urllib.error.URLError):
        print(json.dumps({"ok": False, "error": "Upload failed. Check PNG, alt text, token environment and network; inspect the media library before retrying."}))
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
