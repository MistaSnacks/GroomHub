#!/usr/bin/env python3
"""Release one verified MDX guide from current Vercel production, preserving other source."""
import argparse, base64, concurrent.futures, hashlib, html, json, re, shutil, subprocess
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, parse_qs
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
PROJECT = {'projectId': 'prj_Kl0iAYXLI7j9DbMHpJtE2EtSdyrX', 'orgId': 'team_AWgF6XhmCZFJHy9c7KE1fTIg', 'projectName': 'groom-hub'}
DOMAIN = 'https://groomlocal.com'


def command(args, cwd=ROOT):
    result = subprocess.run(args, cwd=cwd, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f'{args[0]} {args[1]} failed: {result.stderr[-1800:]} {result.stdout[-1200:]}')
    return result.stdout


def inspect(target):
    return json.loads(command(['vercel', 'inspect', target, '--json']))


def source_files(deployment):
    tree = json.loads(command(['vercel', 'api', f'/v6/deployments/{deployment}/files', '--raw']))
    files = {}
    def walk(nodes, prefix=''):
        for node in nodes:
            name = prefix + node['name']
            if node['type'] == 'directory':
                walk(node.get('children', []), name + '/')
            else:
                if Path(name).is_absolute() or '..' in Path(name).parts:
                    raise ValueError('Unsafe source path')
                files[name] = node['uid']
    walk(next(n['children'] for n in tree if n['name'] == 'src'))
    if 'package.json' not in files or 'src/lib/grooming-guides.ts' not in files:
        raise ValueError('Unexpected production source layout')
    return files


def reconstruct(deployment, files, stage, cache):
    def copy_file(item):
        rel, digest = item
        dest = stage / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        for directory in [ROOT, *cache]:
            src = directory / rel
            if src.is_file():
                data = src.read_bytes()
                if hashlib.sha1(data).hexdigest() == digest:
                    dest.write_bytes(data)
                    return
        result = json.loads(command(['vercel', 'api', f'/v7/deployments/{deployment}/files/{digest}', '--raw']))
        data = base64.b64decode(result['data'])
        if hashlib.sha1(data).hexdigest() != digest:
            raise ValueError(f'Production hash mismatch: {rel}')
        dest.write_bytes(data)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        list(pool.map(copy_file, files.items()))


class RenderedImages(HTMLParser):
    def __init__(self, image_path):
        super().__init__()
        self.image_path = image_path
        self.found = False
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        if tag != 'img':
            return
        attrs = dict(attrs)
        src = attrs.get('src', '')
        candidates = [src] + [item.strip().split()[0] for item in attrs.get('srcset', '').split(',') if item.strip()]
        for candidate in candidates:
            parsed = urlsplit(candidate)
            if candidate == self.image_path:
                self.found = True
            if parsed.path != '/_next/image' or parsed.netloc:
                continue
            params = parse_qs(parsed.query)
            if params.get('url') != [self.image_path]:
                continue
            self.found = True
            # Exercise actual browser URLs at mobile/desktop sizes plus the src fallback.
            if candidate == src or params.get('w') in [['384'], ['750']]:
                self.paths.add(candidate)


def check_optimized_images(url, paths, stage, protected=False):
    results = []
    for path in sorted(paths):
        output = stage.parent / ('optimized-' + hashlib.sha256(path.encode()).hexdigest()[:16] + '.img')
        try:
            if protected:
                mime = command(['vercel', 'curl', path, '--deployment', url, '--', '--fail', '--silent', '--show-error', '--output', str(output), '--write-out', '%{content_type}'], cwd=stage).strip()
                data = output.read_bytes()
            else:
                with urlopen(url + path, timeout=60) as response:
                    mime = response.headers.get_content_type()
                    data = response.read()
                output.write_bytes(data)
        except Exception as error:
            raise ValueError(f'Rendered image failed: {path}: {error}') from error
        recognized = (data.startswith(b'\x89PNG\r\n\x1a\n') or data.startswith(b'\xff\xd8\xff')
                      or (data.startswith(b'RIFF') and data[8:12] == b'WEBP')
                      or (data[4:8] == b'ftyp' and b'avif' in data[:32]))
        if not mime.startswith('image/') or not recognized:
            raise ValueError(f'Rendered image is not a supported image: {path}: {mime}')
        results.append({'path': path, 'content_type': mime, 'bytes': len(data), 'status': 'passed'})
    return results


def check_pages(url, slug, title, image_path, stage, protected=False):
    pages = [f'/blog/{slug}', '/blog', '/blog/feed.xml', '/sitemap/0.xml']
    optimized = set()
    for path in pages:
        if protected:
            body = command(['vercel', 'curl', path, '--deployment', url, '--', '--fail', '--silent', '--show-error'], cwd=stage)
        else:
            with urlopen(url + path, timeout=60) as response:
                body = response.read().decode()
        if slug not in body:
            raise ValueError(f'Guide missing from {path}')
        if path == f'/blog/{slug}' and (title not in html.unescape(body) or '<h1' not in body or 'application/ld+json' not in body or 'rel="canonical"' not in body):
            raise ValueError('Article metadata missing')
        if path in [f'/blog/{slug}', '/blog']:
            rendered = RenderedImages(image_path)
            rendered.feed(body)
            if not rendered.found:
                raise ValueError(f'Expected article image is missing from rendered {path}')
            optimized.update(rendered.paths)
    image_checks = check_optimized_images(url, optimized, stage, protected)
    (stage.parent / f'optimized-checks-{slug}-{"preview" if protected else "live"}.json').write_text(json.dumps(image_checks, indent=2) + '\n')
    image_url_path = image_path.split('?')[0]
    expected_image = (stage / 'public' / image_url_path.lstrip('/')).read_bytes()
    if protected:
        output = stage.parent / 'verified-preview-image.png'
        command(['vercel', 'curl', image_path, '--deployment', url, '--', '--fail', '--silent', '--show-error', '--output', str(output)], cwd=stage)
        actual_image = output.read_bytes()
    else:
        with urlopen(url + image_path, timeout=60) as response:
            actual_image = response.read()
    if hashlib.sha256(expected_image).digest() != hashlib.sha256(actual_image).digest():
        raise ValueError('Served article artwork differs from validated image')
    return True


def publish(args):
    policy = json.loads((ROOT / 'docs/automation/weekly-guides-policy.json').read_text())
    if policy.get('mode') != 'publish' or policy.get('publication_authorized') is not True:
        raise ValueError('Publication is not enabled in policy')
    if policy.get('content_mode') == 'new_only' and not args.new:
        raise ValueError('Weekly runs must create a new article; existing-guide refreshes are not allowed')
    if policy.get('require_new_maui_image') and not args.asset:
        raise ValueError('Weekly runs require a newly generated Maui PNG via --asset')
    run = args.run.resolve()
    output_root = Path(policy['output_root']).expanduser()
    if not output_root.is_absolute():
        output_root = ROOT / output_root
    output_root = output_root.resolve()
    if not run.is_relative_to(output_root):
        raise ValueError('Run directory must be inside configured output root')
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', args.slug):
        raise ValueError('Invalid slug')
    approval = json.loads((run / 'release-checks.json').read_text())
    for key in ['sources_verified', 'editorial_reviewed', 'image_verified', 'internal_links_verified']:
        if approval.get(key) is not True:
            raise ValueError(f'Incomplete release check: {key}')
    task = json.loads((run / 'gtm-task.json').read_text())
    card_id = task.get('card_id') or task.get('task', {}).get('id')
    if not isinstance(card_id, str) or not card_id.strip():
        raise ValueError('GTM task must exist before publication')
    draft = run / 'drafts' / (args.slug + '.mdx')
    if approval.get('draft_sha256') != hashlib.sha256(draft.read_bytes()).hexdigest():
        raise ValueError('Release checks do not match the current draft')
    existing = run / 'publication.json'
    if existing.exists():
        published = json.loads(existing.read_text())
        if published.get('status') == 'live':
            print(json.dumps(published, indent=2)); return
    baseline = inspect(DOMAIN)
    files = source_files(baseline['id'])
    stage = run / 'release'
    if stage.exists():
        if not args.resume:
            raise ValueError('Release staging exists; inspect it before using --resume')
        prior = json.loads((run / 'release-manifest.json').read_text())
        if prior['baseline'] != baseline['id']:
            raise ValueError('Cannot resume: production baseline changed')
    else:
        if args.resume:
            raise ValueError('No staged release to resume')
        stage.mkdir()
        reconstruct(baseline['id'], files, stage, [Path(p) for p in args.cache])
    rel = f'src/content/blog/{args.slug}.mdx'
    if rel in files and args.new:
        raise ValueError('New article slug already exists in production')
    if rel in files:
        old = re.search(r'^date: (.+)$', (stage / rel).read_text(), re.M)
        new = re.search(r'^date: (.+)$', draft.read_text(), re.M)
        if not old or not new or old[1] != new[1]:
            raise ValueError('Existing article publication date must be preserved')
    shutil.copyfile(draft, stage / rel)
    allowed = {rel, 'src/lib/grooming-guides.ts'}
    topic_file = stage / 'src/lib/grooming-guides.ts'
    topics = topic_file.read_text()
    block = re.search(r'(id: "' + re.escape(args.topic) + r'",.*?slugs: \[)(.*?)(\])', topics, re.S)
    if not block:
        raise ValueError('Topic group not found')
    occurrences = re.findall(r'"' + re.escape(args.slug) + r'"', topics)
    if occurrences and f'"{args.slug}"' not in block[2]:
        raise ValueError('Existing slug belongs to another topic')
    if not occurrences:
        topics = topics[:block.end(1)] + f'\n      "{args.slug}",' + topics[block.end(1):]
        topic_file.write_text(topics)
    if args.asset:
        asset = args.asset.resolve()
        if not asset.is_relative_to(run) or asset.suffix.lower() != '.png':
            raise ValueError('New asset must be a run-local PNG')
        asset_rel = f'public/maui-assets/{args.slug}.png'
        if asset_rel in files:
            raise ValueError('Use a new asset filename; do not replace unrelated artwork')
        if policy.get('require_new_maui_image'):
            if hashlib.sha1(asset.read_bytes()).hexdigest() in files.values():
                raise ValueError('Artwork reuses an existing production file; generate a new Maui scene')
            image = re.search(r'^image:\s*[\"\']?([^\"\'\n]+)', draft.read_text(), re.M)
            if not image or image[1].split('?')[0].strip() != f'/maui-assets/{args.slug}.png':
                raise ValueError('The article must reference its newly generated Maui asset')
        shutil.copyfile(asset, stage / asset_rel)
        allowed.add(asset_rel)
    changed = set()
    for f in stage.rglob('*'):
        if f.is_file():
            name = f.relative_to(stage).as_posix()
            if name.startswith('.vercel/'):
                continue
            if files.get(name) != hashlib.sha1(f.read_bytes()).hexdigest():
                changed.add(name)
    if not changed.issubset(allowed) or rel not in changed:
        raise ValueError(f'Unexpected or empty release diff: {sorted(changed)}')
    validation = json.loads(command(['node', str(ROOT / 'scripts/verify-weekly-guide.mjs'), str(stage), args.slug]))
    (stage / '.vercel').mkdir(exist_ok=True)
    (stage / '.vercel/project.json').write_text(json.dumps(PROJECT))
    record = {'status': 'validated', 'slug': args.slug, 'baseline': baseline['id'], 'changed_files': sorted(changed), 'validation': validation}
    (run / 'release-manifest.json').write_text(json.dumps(record, indent=2) + '\n')
    if args.stage_only:
        print(json.dumps(record, indent=2)); return
    if args.resume:
        result = (run / 'deployment-result.json').read_text()
    else:
        result = command(['vercel', 'deploy', '--prod', '--skip-domain', '--yes', '--format', 'json'], cwd=stage)
        (run / 'deployment-result.json').write_text(result)
    deployment = json.loads(result)
    url = deployment.get('url') or deployment.get('deployment', {}).get('url')
    if not url:
        raise ValueError('Deployment returned no URL')
    url = url if url.startswith('https://') else 'https://' + url
    ready = inspect(url)
    if ready.get('readyState') != 'READY':
        raise ValueError('Vercel build is not READY')
    deployed_files = source_files(ready['id'])
    expected = {name: hashlib.sha1((stage / name).read_bytes()).hexdigest() for name in set(files) | changed}
    if deployed_files != expected:
        mismatch = sorted(name for name in set(expected) | set(deployed_files) if expected.get(name) != deployed_files.get(name))
        raise ValueError(f'Deployed source differs from validated stage: {mismatch[:12]}')
    check_pages(url, args.slug, validation['title'], validation['image'], stage, protected=True)
    if inspect(DOMAIN)['id'] != baseline['id']:
        raise ValueError('Production changed during verification; do not promote stale baseline')
    command(['vercel', 'promote', ready['id'], '--scope', 'camrens-projects-24b42280', '--yes'], cwd=stage)
    if inspect(DOMAIN)['id'] != ready['id']:
        raise ValueError('Production alias does not match verified release')
    check_pages(DOMAIN, args.slug, validation['title'], validation['image'], stage)
    record.update(status='live', deployment=ready['id'], url=DOMAIN + '/blog/' + args.slug, deployed_url=url)
    (run / 'publication.json').write_text(json.dumps(record, indent=2) + '\n')
    # Keep the working content inventory current without replacing unrelated local edits.
    local = ROOT / rel
    old_hash = files.get(rel)
    if not local.exists() or hashlib.sha1(local.read_bytes()).hexdigest() == old_hash:
        shutil.copyfile(stage / rel, local)
    local_topic = ROOT / 'src/lib/grooming-guides.ts'
    if hashlib.sha1(local_topic.read_bytes()).hexdigest() == files['src/lib/grooming-guides.ts']:
        shutil.copyfile(topic_file, local_topic)
    if args.asset:
        shutil.copyfile(stage / asset_rel, ROOT / asset_rel)
    print(json.dumps(record, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--run', type=Path, required=True)
    parser.add_argument('--slug', required=True)
    parser.add_argument('--topic', required=True)
    parser.add_argument('--new', action='store_true')
    parser.add_argument('--asset', type=Path)
    parser.add_argument('--cache', action='append', default=[])
    parser.add_argument('--stage-only', action='store_true')
    parser.add_argument('--resume', action='store_true', help='Reverify an existing staged deployment without creating another')
    try:
        publish(parser.parse_args())
    except Exception as error:
        raise SystemExit(f'Publication stopped: {error}')
