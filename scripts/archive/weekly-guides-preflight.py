#!/usr/bin/env python3
"""Site inventory for the weekly Hermes editorial job; writes only its run directory."""
import json
import re
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]


def collect():
    policy = json.loads((ROOT / "docs/automation/weekly-guides-policy.json").read_text())
    if policy.get("mode") not in {"review", "publish"}:
        raise ValueError("Unknown editorial mode")
    if policy["mode"] == "publish" and (policy.get("publication_authorized") is not True or not (ROOT / policy["publisher"]).is_file()):
        raise ValueError("Publication needs authorization and the verified publisher")
    required = ["AGENTS.md", "src/lib/grooming-guides.ts", "docs/maui/STYLE-STANDARD.md",
                "public/maui-assets/MAUI-BASE-PROMPT.md", "docs/maui/approved-reference/brushing-v2.png"]
    for relative in required:
        if not (ROOT / relative).is_file():
            raise FileNotFoundError(relative)
    articles = []
    for path in sorted((ROOT / "src/content/blog").glob("*.mdx")):
        text = path.read_text()
        match = re.match(r"\A---\r?\n(.*?)\r?\n---\r?\n", text, re.S)
        if not match:
            raise ValueError(f"Missing frontmatter: {path.name}")
        frontmatter = match.group(1)
        def field(name):
            value = re.search(rf"^{re.escape(name)}:\s*(.+)$", frontmatter, re.M)
            return value.group(1).strip().strip('"\'') if value else None
        articles.append({"file": str(path.relative_to(ROOT)), "slug": field("slug"),
                         "title": field("title"), "date": field("date"),
                         "dateModified": field("dateModified"), "category": field("category"),
                         "headings": re.findall(r"^#{2,3} .+$", text[match.end():], re.M)})
    now = datetime.now(ZoneInfo(policy["timezone"]))
    output_root = Path(policy["output_root"]).expanduser()
    if not output_root.is_absolute():
        output_root = ROOT / output_root
    output_root = output_root.resolve()
    run_dir = output_root / now.strftime("%Y-%m-%d_%H%M%S-%f")
    run_dir.mkdir(parents=True, exist_ok=False)
    (run_dir / "drafts").mkdir()
    status = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, check=True,
                            capture_output=True, text=True).stdout.splitlines()
    result = {"wakeAgent": True, "mode": policy["mode"], "project_root": str(ROOT),
              "run_directory": str(run_dir), "checked_at": now.isoformat(),
              "maximum_articles_per_run": policy["maximum_articles_per_run"],
              "content_mode": policy.get("content_mode", "new_only"),
              "require_new_maui_image": policy.get("require_new_maui_image", True),
              "working_tree_changed_paths": len(status), "articles": articles,
              "latest_audits": [str(p.relative_to(ROOT)) for p in sorted(
                  (ROOT / "docs/content-audits").glob("*/report.md"))[-3:]],
              "gtm_project": policy.get("gtm_project", "groomlocal"),
              "coverage_snapshot": "docs/automation/content-inventory.json",
              "pending_board_updates": [str(p) for p in output_root.glob("*/publication.json") if p.parent.joinpath("gtm-task.json").exists() and not json.loads(p.parent.joinpath("gtm-task.json").read_text()).get("live_synced")],
              "instruction": "Create one genuinely NEW evidence-backed article with a newly generated topic-specific Maui illustration. Do not refresh an existing guide or reuse its image. Track this run on the GroomLocal GTM board and follow the skill for verified publication when mode is publish. Never deploy the working checkout."}
    (run_dir / "inventory.json").write_text(json.dumps(result, indent=2) + "\n")
    return result


if __name__ == "__main__":
    try:
        print(json.dumps(collect(), indent=2))
    except Exception as error:
        # The scheduler honors wakeAgent=false and records the blocker without spending tokens.
        print(json.dumps({"wakeAgent": False, "status": "blocked_preflight", "reason": str(error)}))
