#!/usr/bin/env python3
"""Prepare a run directory without modifying bot config, schedules or the site."""
import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


def collect(root):
    root = root.expanduser().resolve()
    policy_path = root / "docs/automation/weekly-guides-policy.json"
    policy = json.loads(policy_path.read_text())
    mode = policy.get("mode")
    if mode not in {"review", "publish"}:
        raise ValueError("Unknown editorial policy mode")
    if mode == "publish" and policy.get("publication_authorized") is not True:
        raise ValueError("Publication is not authorized in the receiving installation's policy")
    if policy.get("maximum_articles_per_run") != 1 or policy.get("content_mode") != "new_only":
        raise ValueError("This skill requires at most one new article per run")
    if policy.get("require_new_maui_image") is not True:
        raise ValueError("New Maui artwork is required")
    required = ["AGENTS.md", "docs/automation/content-inventory.json", "docs/maui/STYLE-STANDARD.md",
                "public/maui-assets/MAUI-BASE-PROMPT.md", "docs/maui/approved-reference/brushing-v2.png"]
    for relative in required:
        if not (root / relative).is_file():
            raise FileNotFoundError(relative)
    articles = []
    for path in sorted((root / "src/content/blog").glob("*.mdx")):
        content = path.read_text()
        match = re.match(r"\A---\r?\n(.*?)\r?\n---\r?\n", content, re.S)
        if not match:
            raise ValueError("Missing frontmatter: " + path.name)
        fields = {}
        for key in ["slug", "title", "date", "category"]:
            value = re.search(rf"^{key}:\s*(.+)$", match[1], re.M)
            fields[key] = value.group(1).strip().strip("\"'") if value else None
        articles.append({"file": str(path.relative_to(root)), **fields})
    now = datetime.now(ZoneInfo(policy.get("timezone", "America/Los_Angeles")))
    output = Path(policy["output_root"]).expanduser()
    if not output.is_absolute():
        output = root / output
    run = output.resolve() / now.strftime("%Y-%m-%d_%H%M%S-%f")
    run.mkdir(parents=True, exist_ok=False)
    (run / "drafts").mkdir()
    result = {"wakeAgent": True, "mode": mode, "backend": "snackbox", "cms_project": "groomlocal",
              "project_root": str(root), "run_directory": str(run), "checked_at": now.isoformat(),
              "articles": articles, "coverage_snapshot": "docs/automation/content-inventory.json",
              "connections_verified": False, "site_connection_verified": False,
              "instruction": "Query all CMS published/draft coverage and verify required tools. Draft-first; no legacy MDX publisher. SEO, visual image review and end-to-end site readiness are required before CMS publication."}
    (run / "inventory.json").write_text(json.dumps(result, indent=2) + "\n")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-root", required=True, type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(collect(args.project_root), indent=2))
    except (OSError, ValueError, KeyError) as error:
        print(json.dumps({"wakeAgent": False, "status": "blocked_preflight", "reason": str(error)}))
        raise SystemExit(1)
