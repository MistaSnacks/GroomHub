#!/usr/bin/env python3
"""Submit groomlocal.com URLs to IndexNow (Bing, Yandex, Seznam, Naver; feeds ChatGPT search via Bing).

The key is public by design: it is served at https://groomlocal.com/<key>.txt (public/<key>.txt).
Usage:
  python3 scripts/indexnow-submit.py                 # every URL in the live sitemaps
  python3 scripts/indexnow-submit.py URL [URL ...]   # specific URLs (e.g. a new blog post)
  --dry-run prints what would be sent.
Run after a deploy or a CMS publish. Re-submitting unchanged URLs is harmless but pointless.
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

HOST = "groomlocal.com"
ROOT = Path(__file__).resolve().parents[1]


def key():
    for p in (ROOT / "public").glob("*.txt"):
        if re.fullmatch(r"[0-9a-f]{32}", p.stem) and p.read_text().strip() == p.stem:
            return p.stem
    sys.exit("No IndexNow key file found in public/ (expected <32 hex>.txt containing its own name).")


def sitemap_urls():
    with urllib.request.urlopen(f"https://{HOST}/sitemap.xml", timeout=30) as r:
        index = r.read().decode()
    maps = re.findall(r"<loc>([^<]+)</loc>", index)
    urls = []
    for m in maps:
        if m.endswith(".xml"):
            with urllib.request.urlopen(m, timeout=30) as r:
                urls += re.findall(r"<loc>([^<]+)</loc>", r.read().decode())
        else:
            urls.append(m)
    return urls


def main():
    args = [a for a in sys.argv[1:] if a != "--dry-run"]
    dry = "--dry-run" in sys.argv
    k = key()
    urls = args or sitemap_urls()
    urls = [u for u in urls if u.startswith(f"https://{HOST}/") or u == f"https://{HOST}"]
    print(f"{len(urls)} URLs, key file https://{HOST}/{k}.txt")
    for i in range(0, len(urls), 10000):
        body = {"host": HOST, "key": k, "keyLocation": f"https://{HOST}/{k}.txt", "urlList": urls[i:i + 10000]}
        if dry:
            print(json.dumps({**body, "urlList": body["urlList"][:3] + ["..."]}, indent=2))
            continue
        req = urllib.request.Request("https://api.indexnow.org/indexnow", data=json.dumps(body).encode(),
                                     headers={"Content-Type": "application/json; charset=utf-8"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                print(f"batch {i // 10000 + 1}: HTTP {r.status}")
        except urllib.error.HTTPError as e:
            print(f"batch {i // 10000 + 1}: HTTP {e.code} {e.read().decode()[:200]}")
            sys.exit(1)


if __name__ == "__main__":
    main()
