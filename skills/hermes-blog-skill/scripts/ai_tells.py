#!/usr/bin/env python3
"""Find AI-writing tells and weak human-value signals in a draft.

This is an editor's checklist, not an AI detector. It counts patterns that
make text read like unedited model output, measures rhythm and specificity,
and checks that a rewrite kept the facts (numbers, links, quotes).

Usage:
  ai_tells.py DRAFT [--json] [--fail-over N] [--gate]
  ai_tells.py --compare BEFORE AFTER [--json]

DRAFT can be .md/.mdx/.txt, .html, a Snackbox/Sanity Portable Text .json
export, or an http(s) URL (only the <article> or <main> text is read).
Python 3.9+, standard library only.
"""
from __future__ import annotations

import argparse
import json
import re
import statistics
import sys
import urllib.request
from html.parser import HTMLParser

# --------------------------------------------------------------- patterns

# (regex, plain replacement hint). Matched case-insensitively on prose.
VOCAB = [
    (r"\bdelv(?:e|es|ed|ing)\b", "look at, cover"),
    (r"\bleverag(?:e|es|ed|ing)\b", "use"),
    (r"\butili[sz](?:e|es|ed|ing|ation)\b", "use"),
    (r"\bfacilitat(?:e|es|ed|ing)\b", "help, make easier"),
    (r"\bstreamlin(?:e|es|ed|ing)\b", "simplify, speed up"),
    (r"\benhanc(?:e|es|ed|ing|ement)\b", "improve"),
    (r"\belevat(?:e|es|ed|ing)\b", "improve, raise"),
    (r"\brobust\b", "strong, solid, or cut"),
    (r"\bseamless(?:ly)?\b", "smooth, or cut"),
    (r"\bholistic\b", "whole, full, or cut"),
    (r"\bcomprehensive\b", "full, complete, or cut"),
    (r"\bcrucial\b", "important, or say why it matters"),
    (r"\bpivotal\b", "key, important"),
    (r"\bparamount\b", "most important"),
    (r"\bnuanced\b", "say the actual difference"),
    (r"\bmultifaceted\b", "name the parts"),
    (r"\bintricac(?:y|ies)\b|\bintricate\b", "detailed, complex"),
    (r"\bmeticulous(?:ly)?\b", "careful(ly)"),
    (r"\brealms?\b", "area, field"),
    (r"\blandscape\b", "market, field (if not literal)"),
    (r"\btapestry\b", "cut"),
    (r"\btestament\b", "proof, sign"),
    (r"\bunderscor(?:e|es|ed|ing)\b", "show"),
    (r"\bshowcas(?:e|es|ed|ing)\b", "show"),
    (r"\bboasts?\b", "has"),
    (r"\bvibrant\b", "be specific, or cut"),
    (r"\bnestled\b", "is in, sits in"),
    (r"\bbeacon\b", "cut"),
    (r"\bcornerstone\b", "basis, core"),
    (r"\bembark(?:s|ed|ing)?\b", "start"),
    (r"\bendeavou?rs?\b", "effort, try"),
    (r"\bplethora\b", "many"),
    (r"\bmyriad\b", "many"),
    (r"\bunlock(?:s|ed|ing)?\b", "get, open"),
    (r"\bunleash(?:es|ed|ing)?\b", "cut (pun)"),
    (r"\bunveil(?:s|ed|ing)?\b", "show, launch"),
    (r"\bempower(?:s|ed|ing)?\b", "let, help"),
    (r"\bharness(?:es|ed|ing)?\b", "use"),
    (r"\bbolster(?:s|ed|ing)?\b", "support"),
    (r"\bmitigat(?:e|es|ed|ing)\b", "reduce"),
    (r"\bgame[- ]chang(?:er|ers|ing)\b", "say what changed"),
    (r"\bcutting[- ]edge\b", "new, latest"),
    (r"\btransformative\b", "say what changed"),
    (r"\brevolutioni[sz](?:e|es|ed|ing)\b", "change"),
    (r"\bsupercharg(?:e|es|ed|ing)\b", "speed up, improve"),
    (r"\bresonat(?:e|es|ed|ing)\b", "matter to"),
    (r"\bcurated\b", "chosen, picked"),
    (r"\bactionable\b", "practical"),
    (r"\becosystem\b", "name the parts"),
    (r"\bsynergy\b", "cut"),
    (r"\bparadigm\b", "cut"),
    (r"\bcommenc(?:e|es|ed|ing)\b", "start"),
    (r"\bascertain\b", "find out"),
    (r"\binvaluable\b", "useful, say why"),
    (r"\bindispensable\b", "needed"),
    (r"\bunparalleled\b", "cut"),
    (r"\btop[- ]notch\b", "be specific"),
    (r"\bhassle[- ]free\b", "say what is easy"),
    (r"\bembrac(?:e|es|ed|ing)\b", "accept, use"),
    (r"\bgarner(?:s|ed|ing)?\b", "get, earn"),
    (r"\binterplay\b", "how X and Y affect each other"),
    (r"\benduring\b", "cut"),
    (r"\bdynamic\b", "be specific"),
    (r"\binnovative\b", "say what is new"),
    (r"\b(?:stunning|incredible|amazing|remarkable|exceptional)\b", "be specific"),
    (r"\bfoster(?:s|ed|ing)? (?:a|an|the|trust|growth|connection|community|sense)\b",
     "build, encourage"),
    (r"\b(?:furry|four[- ]legged) (?:friends?|companions?|family members?)\b|\bfur ?bab(?:y|ies)\b",
     "dog, dogs"),
    (r"\bpaw-?some\b", "cut"),
]

PHRASES = [
    (r"\bit(?:'|’)?s (?:worth noting|important to (?:note|remember|understand))\b|\bit is (?:worth noting|important to)\b",
     "cut; state the point"),
    (r"\bwhen it comes to\b", "for, with, or cut"),
    (r"\bin today(?:'|’)s\b", "cut"),
    (r"\bat the end of the day\b", "cut"),
    (r"\bhere(?:'|’)s (?:the (?:thing|deal|kicker|catch)|why|how|what)\b", "cut; start with the point"),
    (r"\blet(?:'|’)s (?:dive|explore|take a (?:closer )?look|break (?:it|this) down)\b", "cut"),
    (r"\b(?:dive|diving) (?:into|deeper)\b|\bdeep dive\b", "look at, or cut"),
    (r"\bwhether you(?:'|’)re\b", "address one reader; cut the either/or opener"),
    (r"\b(?:have you ever|ever wondered)\b", "cut the hook question"),
    (r"\bnavigat(?:e|es|ing) (?:the|this|these|your)\b", "handle, work through"),
    (r"\bin the (?:world|realm) of\b", "in"),
    (r"\bplays? an? (?:crucial|vital|key|pivotal|important|significant) role\b", "matters; say how"),
    (r"\b(?:serves|stands|acts|functions) as\b", "is"),
    (r"\bin order to\b", "to"),
    (r"\ba (?:wide|broad|diverse) (?:range|variety|array) of\b", "many, or name them"),
    (r"\b(?:needless to say|it goes without saying)\b", "cut"),
    (r"\b(?:in conclusion|in summary|to sum up|final thoughts|wrapping up|the bottom line|the short version|key takeaways)\b",
     "cut the recap; end on the last useful point"),
    (r"(?:^|[.!?]\s+)the (?:result|answer|catch|kicker|truth|reason)\?", "state it in one sentence"),
    (r"(?:^|[.!?]\s+)(?:absolutely|great question|certainly)[.!,]", "cut chatbot voice"),
    (r"\b(?:experts|studies|research|professionals|groomers|vets) (?:say|says|show|shows|suggest|suggests|agree|recommend)\b",
     "name and link the source, or cut"),
    (r"\bpeace of mind\b", "say what the reader stops worrying about"),
    (r"\blook and feel (?:their|your|its) best\b|\bfeel (?:their|your) best\b", "say the concrete result"),
    (r"\btailored to\b|\bunique needs\b", "name the actual need"),
    (r"\bjourney\b", "cut, or say process"),
    (r"\bvaluable insights?\b|\balign(?:s|ed)? with\b", "be specific"),
]

STRUCTURES = [
    (r"\bnot (?:just|only|merely|simply)\b[^.!?]{1,90}?\bbut\b",
     "negative parallelism ('not just X but Y'); state Y"),
    (r"\b(?:is|are|was|were)(?: not|n(?:'|’)t)\b[^.!?;]{1,80}?[;,—–]\s*(?:it|they|this|that)(?:(?:'|’)s|(?:'|’)re| is| are)\b",
     "negative parallelism ('X is not A; it is B'); state B"),
    (r"(?:^|[.!?]\s+)no [^.!?]{1,40}[.!?]\s+no [^.!?]{1,40}[.!?]\s+just\b",
     "'No X. No Y. Just Z.' formula"),
    (r",\s+(?:highlighting|underscoring|emphasizing|reflecting|showcasing|ensuring|making it|allowing|contributing to|fostering|creating|providing|leaving)\b[^.!?]*[.!?]",
     "'-ing' tail clause adds fake analysis; cut or make it its own claim"),
]

LEFTOVERS = [
    r"\bas an ai\b", r"\bas a (?:large )?language model\b", r"\bknowledge cut-?off\b",
    r"\bi hope this helps\b", r"\bi(?:'|’)d be happy to\b", r"\[citation needed\]",
    r"oaicite", r"contentreference", r"\[cite:\s*\d", r"utm_source=(?:chatgpt|openai|perplexity)",
    r"turn\d+search\d+", r"【\d", r"\[(?:insert|your|todo)[^\]]*\]",
]

TRANSITION_OPENERS = re.compile(
    r"^(?:additionally|furthermore|moreover|ultimately|overall|importantly|notably|"
    r"indeed|consequently|essentially|interestingly|crucially|in addition)\b[,]?",
    re.I)

TRICOLON = re.compile(
    r"\b[\w'’-]+(?: [\w'’-]+){0,3}, [\w'’-]+(?: [\w'’-]+){0,3}, and [\w'’-]+(?: [\w'’-]+){0,3}[.!?]$")

HEDGE = re.compile(
    r"\b(?:may|might|could|often|typically|generally|usually|some|varies|vary|"
    r"depends?|depending|likely|potentially|possibly|consider)\b", re.I)

FORMAL = re.compile(
    r"\b(?:do not|does not|did not|is not|are not|was not|were not|cannot|can not|"
    r"will not|would not|should not|could not|have not|has not|you are|we are|"
    r"they are|you will|it is|that is|there is|let us|you have|i am)\b", re.I)
CONTRACTED = re.compile(
    r"\b\w+(?:n(?:'|’)t|(?:'|’)(?:re|ll|ve|m|d|s))\b", re.I)

FIRST_PERSON = re.compile(r"\b(?:i|we|our|us|my|me)\b")
EXPERIENCE = re.compile(
    r"\b(?:i|we)(?:(?:'|’)ve| have)? (?:saw|seen|tested|tried|visited|asked|called|groomed|"
    r"watched|found|noticed|measured|counted|checked|spoke|talked|surveyed|reviewed|pulled)\b|"
    r"\bin our (?:shop|salon|directory|data|listings|experience)\b|\bwhen i\b",
    re.I)
NUMBER = re.compile(r"\$?\d[\d,]*(?:\.\d+)?%?")
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")

# --------------------------------------------------------------- loading


class Block:
    __slots__ = ("kind", "text", "line", "heading")

    def __init__(self, kind, text, line=None):
        self.kind = kind
        self.text = re.sub(r"\s+", " ", text).strip()
        self.line = line
        self.heading = ""

    @property
    def prose(self):
        return self.kind in ("p", "li", "quote")


class Doc:
    def __init__(self):
        self.blocks: list[Block] = []
        self.links: list[str] = []
        self.bold = 0

    def add(self, kind, text, line=None):
        if text and text.strip():
            self.blocks.append(Block(kind, text, line))


MD_LINK = re.compile(r"!?\[([^\]]*)\]\(([^)\s]+)[^)]*\)")


def _md_inline(text, doc):
    for m in MD_LINK.finditer(text):
        doc.links.append(m.group(2))
    text = MD_LINK.sub(r"\1", text)
    doc.bold += len(re.findall(r"\*\*[^*]+\*\*|__[^_]+__", text))
    text = re.sub(r"(\*\*|__|`)", "", text)
    text = re.sub(r"(?<!\w)[*_](\S[^*_]*?)[*_](?!\w)", r"\1", text)
    return re.sub(r"<[^>]+>", "", text)


def load_markdown(src):
    doc = Doc()
    lines = src.splitlines()
    start = 0
    if lines and lines[0].strip() == "---":
        for j in range(1, len(lines)):
            if lines[j].strip() == "---":
                start = j + 1
                break
            m = re.match(r"(title|excerpt|description|heroAlt):\s*(.+)", lines[j].strip())
            if m:  # meta fields count for vocab and fact checks
                doc.add("meta", m.group(2).strip().strip("\"'"), j + 1)
    para, para_line, fenced = [], None, False

    def flush():
        nonlocal para, para_line
        if para:
            doc.add("p", _md_inline(" ".join(para), doc), para_line)
        para, para_line = [], None

    for n in range(start, len(lines)):
        s, lineno = lines[n].strip(), n + 1
        if s.startswith("```"):
            flush()
            fenced = not fenced
            continue
        if fenced:
            continue
        if not s:
            flush()
            continue
        if re.match(r"(?:import|export) ", s) or (s.startswith("<") and s.endswith(">")):
            flush()
            continue
        m = re.match(r"(#{1,6})\s+(.*)", s)
        if m:
            flush()
            doc.add("h%d" % len(m.group(1)), _md_inline(m.group(2), doc), lineno)
            continue
        m = re.match(r"(?:[-*+]|\d+[.)])\s+(.*)", s)
        if m:
            flush()
            doc.add("li", _md_inline(m.group(1), doc), lineno)
            continue
        if s.startswith(">"):
            flush()
            doc.add("quote", _md_inline(s.lstrip("> "), doc), lineno)
            continue
        if s.startswith("|"):
            flush()
            if not re.fullmatch(r"[|:\-\s]+", s):
                cells = [c.strip() for c in s.strip("|").split("|")]
                doc.add("table", _md_inline(" | ".join(cells), doc), lineno)
            continue
        if para_line is None:
            para_line = lineno
        para.append(s)
    flush()
    return doc


class _HTMLText(HTMLParser):
    BLOCK = {"h1": "h1", "h2": "h2", "h3": "h3", "h4": "h4", "h5": "h5", "h6": "h6",
             "p": "p", "li": "li", "blockquote": "quote", "td": "table", "th": "table",
             "figcaption": "p", "dt": "p", "dd": "p"}
    SKIP = {"script", "style", "nav", "footer", "aside", "svg", "button", "form",
            "noscript", "template", "select"}

    def __init__(self, doc):
        super().__init__(convert_charrefs=True)
        self.doc, self.buf, self.kind, self.skip = doc, [], "p", 0

    def _flush(self):
        if self.buf:
            self.doc.add(self.kind, "".join(self.buf))
        self.buf = []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skip += 1
        elif tag in self.BLOCK:
            self._flush()
            self.kind = self.BLOCK[tag]
        elif tag == "br":
            self.buf.append(" ")
        elif tag in ("strong", "b") and not self.skip:
            self.doc.bold += 1
        if tag == "a" and not self.skip:
            href = dict(attrs).get("href")
            if href:
                self.doc.links.append(href)

    def handle_endtag(self, tag):
        if tag in self.SKIP:
            self.skip = max(0, self.skip - 1)
        elif tag in self.BLOCK or tag in ("div", "section", "ul", "ol", "table", "tr"):
            self._flush()
            self.kind = "p"

    def handle_data(self, data):
        if not self.skip:
            self.buf.append(data)

    def close(self):
        super().close()
        self._flush()


def load_html(src):
    for tag in ("article", "main"):
        i, j = src.find("<" + tag), src.rfind("</%s>" % tag)
        if i != -1 and j > i:
            src = src[i:j]
            break
    doc = Doc()
    p = _HTMLText(doc)
    p.feed(src)
    p.close()
    if sum(len(b.text.split()) for b in doc.blocks if b.prose) < 100:
        for b in doc.blocks:  # old table layouts keep the body text in <td>
            if b.kind == "table" and len(b.text.split()) > 20:
                b.kind = "p"
    return doc


PT_SKIP = {"artworkReview", "research", "sources", "relatedGuides", "heroImage", "author",
           "topic", "slug", "tags", "markDefs", "asset", "_id", "_key", "_ref", "_rev"}
PT_META = ("title", "excerpt", "description", "heroAlt")


def load_portable_text(obj):
    doc = Doc()

    def walk(node, top):
        if isinstance(node, list):
            for x in node:
                walk(x, top)
            return
        if not isinstance(node, dict):
            return
        if node.get("_type") == "block" and isinstance(node.get("children"), list):
            kids = [c for c in node["children"] if isinstance(c, dict)]
            doc.bold += sum(1 for c in kids if "strong" in (c.get("marks") or []))
            for md in node.get("markDefs") or []:
                if isinstance(md, dict) and md.get("href"):
                    doc.links.append(md["href"])
            style = node.get("style") or "normal"
            if re.fullmatch(r"h[1-6]", style):
                kind = style
            elif node.get("listItem"):
                kind = "li"
            elif style == "blockquote":
                kind = "quote"
            else:
                kind = "p"
            doc.add(kind, "".join(c.get("text", "") for c in kids))
            return
        if isinstance(node.get("rows"), list):
            if isinstance(node.get("caption"), str):
                doc.add("meta", node["caption"])
            for row in node["rows"]:
                cells = row.get("cells") if isinstance(row, dict) else row
                if isinstance(cells, list):
                    doc.add("table", " | ".join(str(c) for c in cells))
            return
        is_doc = node.get("_type") in ("blogPost", "post", "article") or (
            "body" in node and ("_id" in node or "slug" in node))
        if is_doc:
            for k in PT_META:
                if isinstance(node.get(k), str):
                    doc.add("meta", node[k])
            seo = node.get("seo")
            if isinstance(seo, dict):
                for k in PT_META:
                    if isinstance(seo.get(k), str):
                        doc.add("meta", seo[k])
        if isinstance(node.get("heading"), str) and not is_doc:
            doc.add("h2", node["heading"])  # Snackbox sections carry their own heading
        if isinstance(node.get("caption"), str):
            doc.add("meta", node["caption"])
        for k, v in node.items():
            if k in PT_SKIP or k in ("seo", "heading", "caption") or (is_doc and k in PT_META):
                continue
            walk(v, False)

    walk(obj, True)
    return doc


def load(path):
    if re.match(r"https?://", path):
        req = urllib.request.Request(path, headers={"User-Agent": "Mozilla/5.0 humanize-skill"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return load_html(r.read().decode("utf-8", "replace"))
    with open(path, encoding="utf-8") as f:
        src = f.read()
    low = path.lower()
    if low.endswith(".json"):
        return load_portable_text(json.loads(src))
    if low.endswith((".html", ".htm")) or src.lstrip().lower().startswith(("<!doctype", "<html")):
        return load_html(src)
    return load_markdown(src)


# --------------------------------------------------------------- analysis

_ABBR = re.compile(r"\b(?:e\.g|i\.e|etc|vs|approx|Dr|Mr|Mrs|Ms|St|Mt|No|U\.S|a\.m|p\.m)\.", re.I)
_SPLIT = re.compile(r"(?:(?<=[.!?])|(?<=[.!?][\"”’)]))\s+(?=[\"“(\[]?[A-Z0-9$])")
_WORD = re.compile(r"\$?\d[\d,]*(?:\.\d+)?%?|[A-Za-z]+(?:['’-][A-Za-z]+)*")


def sentences(text):
    t = _ABBR.sub(lambda m: m.group(0).replace(".", "§"), text)
    return [s.replace("§", ".").strip() for s in _SPLIT.split(t) if s.strip()]


def words(text):
    return _WORD.findall(text)


def cv(xs):
    if len(xs) < 2:
        return 0.0
    m = statistics.mean(xs)
    return statistics.pstdev(xs) / m if m else 0.0


def where(b, i):
    if b.line:
        return "line %d" % b.line
    h = b.heading[:40] + ("..." if len(b.heading) > 40 else "")
    return "block %d%s" % (i + 1, (" in '%s'" % h) if h else "")


def snippet(text, m, width=70):
    a, z = max(0, m.start() - 25), min(len(text), m.end() + 35)
    s = ("..." if a else "") + text[a:z] + ("..." if z < len(text) else "")
    return s if len(s) <= width + 10 else s[: width + 7] + "..."


def analyze(doc):
    heading = ""
    for b in doc.blocks:
        if b.kind.startswith("h"):
            heading = b.text
        b.heading = heading

    findings = []

    def add(cat, b, i, m, hint, weight=1.0):
        findings.append({"category": cat, "where": where(b, i), "text": snippet(b.text, m),
                         "fix": hint, "weight": weight})

    prose_sents, para_sent_counts = [], []
    tricolons, starts = [], []
    text_all = []
    for i, b in enumerate(doc.blocks):
        scan_lines = b.prose or b.kind == "meta" or b.kind.startswith("h")
        if not scan_lines:
            continue
        t = b.text
        text_all.append(t)
        for m in re.finditer("—|–(?= )| -- ", t):
            add("em-dash", b, i, m, "use a period, comma, colon or parentheses")
        for rx, hint in VOCAB:
            for m in re.finditer(rx, t, re.I):
                add("ai-vocab", b, i, m, hint)
        for rx, hint in PHRASES:
            for m in re.finditer(rx, t, re.I):
                add("stock-phrase", b, i, m, hint)
        for rx, hint in STRUCTURES:
            for m in re.finditer(rx, t, re.I):
                add("structure", b, i, m, hint, 1.5)
        for rx in LEFTOVERS:
            for m in re.finditer(rx, t, re.I):
                add("leftover", b, i, m, "remove model/tool artifact", 5.0)
        if not b.prose:
            continue
        ss = sentences(t)
        para_sent_counts.append(len(ss))
        for s in ss:
            n = len(words(s))
            if n:
                prose_sents.append(n)
            if TRANSITION_OPENERS.match(s):
                findings.append({"category": "transition", "where": where(b, i),
                                 "text": s[:80] + ("..." if len(s) > 80 else ""),
                                 "fix": "cut the transition; start with the point", "weight": 1.0})
            starts.append((s.split()[0].lower().strip("\"“'") if s.split() else "", b, i))
            m = TRICOLON.search(s)
            if m:
                tricolons.append((b, i, s))

    # three or more sentences in a row with the same first word
    run = 1
    for k in range(1, len(starts)):
        if starts[k][0] and starts[k][0] == starts[k - 1][0]:
            run += 1
            if run == 3:
                b, i = starts[k][1], starts[k][2]
                findings.append({"category": "structure", "where": where(b, i),
                                 "text": "3+ sentences in a row start with '%s'" % starts[k][0],
                                 "fix": "vary the openings", "weight": 1.0})
        else:
            run = 1

    prose = " ".join(b.text for b in doc.blocks if b.prose)
    wc = len(words(prose))
    per100 = (lambda n: round(100.0 * n / wc, 2)) if wc else (lambda n: 0.0)

    formal = len(FORMAL.findall(prose))
    contracted = len([m for m in CONTRACTED.findall(prose)
                      if not re.search(r"(?:'|’)s$", m, re.I)])  # skip possessive 's
    headings, in_faq = [], False
    for b in doc.blocks:
        if b.kind == "h2":
            in_faq = bool(re.search(r"\bfaqs?\b|frequently asked|common questions", b.text, re.I))
        if b.kind in ("h2", "h3") and not (in_faq and b.kind == "h3"):
            headings.append(b.text)
    title_case = [h for h in headings
                  if len(h.split()) >= 3 and
                  sum(1 for w in h.split()[1:] if w[:1].isupper()) >= 0.6 * (len(h.split()) - 1)]
    questions = [h for h in headings if h.endswith("?")]

    metrics = {
        "words": wc,
        "sentences": len(prose_sents),
        "avg_sentence_words": round(statistics.mean(prose_sents), 1) if prose_sents else 0,
        "sentence_length_cv": round(cv(prose_sents), 2),
        "short_sentences_pct": round(100.0 * sum(1 for n in prose_sents if n <= 7) / len(prose_sents), 1) if prose_sents else 0,
        "mid_length_pct": round(100.0 * sum(1 for n in prose_sents if 12 <= n <= 25) / len(prose_sents), 1) if prose_sents else 0,
        "paragraph_cv": round(cv(para_sent_counts), 2),
        "contraction_ratio": round(contracted / float(contracted + formal), 2) if (contracted + formal) else None,
        "hedges_per_100w": per100(len(HEDGE.findall(prose))),
        "numbers_per_100w": per100(len(NUMBER.findall(prose))),
        "first_person_per_100w": per100(len(FIRST_PERSON.findall(prose.lower()))),
        "experience_markers": len(EXPERIENCE.findall(prose)),
        "tricolon_sentences": len(tricolons),
        "bold_per_1000w": round(1000.0 * doc.bold / wc, 1) if wc else 0,
        "links": len(doc.links),
        "headings": len(headings),
        "title_case_headings": len(title_case),
        "question_headings": len(questions),
        "exclamations": prose.count("!"),
        "emoji": len(EMOJI.findall(" ".join(text_all))),
    }

    flags = []
    M = metrics
    if M["sentences"] >= 15 and M["sentence_length_cv"] < 0.40:
        flags.append(("rhythm", "Sentence lengths are too even (CV %.2f). Mix in short sentences "
                      "and the odd long one." % M["sentence_length_cv"]))
    if M["sentences"] >= 15 and M["short_sentences_pct"] < 8:
        flags.append(("rhythm", "Only %.0f%% of sentences have 7 words or fewer. Real writers "
                      "use short ones for emphasis." % M["short_sentences_pct"]))
    if M["sentences"] >= 15 and M["mid_length_pct"] > 65:
        flags.append(("rhythm", "%.0f%% of sentences are 12 to 25 words, the model comfort zone."
                      % M["mid_length_pct"]))
    if M["contraction_ratio"] is not None and (contracted + formal) >= 8 and M["contraction_ratio"] < 0.30:
        flags.append(("voice", "Few contractions (%.0f%%). Use don't, it's, you'll where you would "
                      "say them aloud." % (100 * M["contraction_ratio"])))
    if wc >= 300 and M["hedges_per_100w"] > 1.6:
        flags.append(("voice", "Hedge-heavy (%.1f per 100 words). Give the common answer plainly "
                      "and state the exception once." % M["hedges_per_100w"]))
    if wc >= 300 and M["numbers_per_100w"] < 0.5:
        flags.append(("value", "Few numbers (%.2f per 100 words). Add prices, times, counts or "
                      "dates the reader can act on." % M["numbers_per_100w"]))
    if wc >= 300 and M["experience_markers"] == 0:
        flags.append(("value", "No first-hand experience markers. See the value pass; do not "
                      "invent experience."))
    if wc and 1000.0 * len(tricolons) / wc > 4:
        flags.append(("structure", "%d sentences end in a list of three. Check for rule-of-three "
                      "padding." % len(tricolons)))
    if M["bold_per_1000w"] > 8:
        flags.append(("format", "Heavy bold (%.0f per 1,000 words)." % M["bold_per_1000w"]))
    if headings and len(questions) / float(len(headings)) > 0.6 and len(headings) >= 4:
        flags.append(("format", "%d of %d headings are questions. Keep questions for the FAQ."
                      % (len(questions), len(headings))))
    if M["emoji"]:
        flags.append(("format", "%d emoji in the text." % M["emoji"]))

    score_points = sum(f["weight"] for f in findings)
    return {
        "metrics": metrics,
        "flags": [{"area": a, "message": m} for a, m in flags],
        "findings": findings,
        "tricolon_examples": [{"where": where(b, i), "text": s[:140]} for b, i, s in tricolons[:6]],
        "tells_per_1000w": round(1000.0 * score_points / wc, 1) if wc else 0.0,
    }


# --------------------------------------------------------------- compare

QUOTE = re.compile(r"\"([^\"]{12,}?)\"|“([^”]{12,}?)”")


def facts(doc):
    text = " ".join(b.text for b in doc.blocks)
    nums = {n.rstrip(",.").replace(",", "") for n in NUMBER.findall(text)}
    nums = {n for n in nums if re.search(r"\d", n)}
    urls = {u.rstrip("/") for u in doc.links if not u.startswith("#")}
    urls |= {u.rstrip("/.,)") for u in re.findall(r"https?://\S+", text)}
    quotes = {(a or b).strip() for a, b in QUOTE.findall(text)}
    return {"numbers": nums, "links": urls, "quotes": quotes}


def compare(before, after):
    fb, fa = facts(before), facts(after)
    out = {}
    for k in fb:
        out[k] = {"missing": sorted(fb[k] - fa[k]), "new": sorted(fa[k] - fb[k])}
    ab, aa = analyze(before), analyze(after)
    keys = ["words", "sentence_length_cv", "short_sentences_pct", "contraction_ratio",
            "hedges_per_100w", "numbers_per_100w", "experience_markers"]
    out["metrics"] = {k: [ab["metrics"][k], aa["metrics"][k]] for k in keys}
    out["metrics"]["tells_per_1000w"] = [ab["tells_per_1000w"], aa["tells_per_1000w"]]
    out["ok"] = not any(out[k]["missing"] for k in ("numbers", "links", "quotes")) and not out["numbers"]["new"]
    return out


# --------------------------------------------------------------- output

def print_report(name, r):
    M = r["metrics"]
    print("humanize scan: %s" % name)
    print("=" * 60)
    print("Words %d | sentences %d | tells per 1,000 words: %.1f"
          % (M["words"], M["sentences"], r["tells_per_1000w"]))
    print("Sentence length: avg %.1f, CV %.2f, short %.0f%%, mid-length %.0f%%"
          % (M["avg_sentence_words"], M["sentence_length_cv"], M["short_sentences_pct"], M["mid_length_pct"]))
    cr = M["contraction_ratio"]
    print("Contractions %s | hedges %.1f/100w | numbers %.2f/100w | first person %.2f/100w | experience markers %d"
          % ("n/a" if cr is None else "%.0f%%" % (100 * cr), M["hedges_per_100w"], M["numbers_per_100w"],
             M["first_person_per_100w"], M["experience_markers"]))
    print("Headings %d (title case %d, questions %d) | links %d | bold %.1f/1000w"
          % (M["headings"], M["title_case_headings"], M["question_headings"], M["links"], M["bold_per_1000w"]))
    print()
    if r["flags"]:
        print("FLAGS")
        for f in r["flags"]:
            print("  [%s] %s" % (f["area"], f["message"]))
        print()
    if r["findings"]:
        print("LINE TELLS (%d)" % len(r["findings"]))
        order = ["leftover", "em-dash", "structure", "stock-phrase", "ai-vocab", "transition"]
        for cat in order:
            items = [f for f in r["findings"] if f["category"] == cat]
            if not items:
                continue
            print("  %s (%d)" % (cat, len(items)))
            for f in items[:25]:
                print("    %-28s %s" % (f["where"], f["text"]))
                print("    %-28s -> %s" % ("", f["fix"]))
            if len(items) > 25:
                print("    ... %d more" % (len(items) - 25))
        print()
    if r["tricolon_examples"]:
        print("LIST-OF-THREE SENTENCES (check for padding; concrete lists are fine)")
        for t in r["tricolon_examples"]:
            print("    %-28s %s" % (t["where"], t["text"]))
        print()
    print("This is an editing checklist, not an AI detector. Fix what reads badly; "
          "the value pass matters more than this score.")


def print_compare(out):
    print("humanize compare")
    print("=" * 60)
    for k in ("numbers", "links", "quotes"):
        miss, new = out[k]["missing"], out[k]["new"]
        print("%-8s missing %d%s | new %d%s" % (
            k, len(miss), (": " + ", ".join(miss[:12])) if miss else "",
            len(new), (": " + ", ".join(new[:12])) if new else ""))
    print()
    for k, (a, b) in out["metrics"].items():
        print("  %-22s %8s -> %s" % (k, a, b))
    print()
    if out["ok"]:
        print("OK: no numbers, links or quotes were lost, and no new numbers appeared.")
    else:
        print("CHECK: a fact was lost, or a new number appeared. Restore it, or confirm a "
              "source for every new number before you continue.")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("draft", nargs="?")
    ap.add_argument("--compare", nargs=2, metavar=("BEFORE", "AFTER"))
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--fail-over", type=float, default=None,
                    help="exit 1 when tells per 1,000 words is above this")
    ap.add_argument("--gate", action="store_true",
                    help="exit 1 on any em dash or model artifact, or above --fail-over (default 3)")
    a = ap.parse_args(argv)
    if a.compare:
        out = compare(load(a.compare[0]), load(a.compare[1]))
        if a.json:
            print(json.dumps(out, indent=2))
        else:
            print_compare(out)
        return 0 if out["ok"] else 1
    if not a.draft:
        ap.error("give a draft path or URL, or --compare BEFORE AFTER")
    r = analyze(load(a.draft))
    if a.json:
        print(json.dumps(r, indent=2, ensure_ascii=False))
    else:
        print_report(a.draft, r)
    limit = a.fail_over if a.fail_over is not None else (3.0 if a.gate else None)
    failed = []
    if limit is not None and r["tells_per_1000w"] > limit:
        failed.append("tells per 1,000 words %.1f > %.1f" % (r["tells_per_1000w"], limit))
    if a.gate:
        for cat in ("em-dash", "leftover"):
            n = sum(1 for f in r["findings"] if f["category"] == cat)
            if n:
                failed.append("%d %s finding(s)" % (n, cat))
    if failed:
        print("GATE FAILED: " + "; ".join(failed), file=sys.stderr)
        return 1
    if a.gate:
        print("GATE OK", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
