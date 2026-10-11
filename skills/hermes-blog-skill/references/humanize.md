# Humanize pass for the weekly guide

Added 2026-10-04 at the owner's request. This is the unattended version of
Claude Code's `humanize` skill. It runs once on every new guide, after the
text is drafted and before `request_review`.

## Why

- Semrush (April 2026, 42,000 blog posts): position 1 was human-written about
  80% of the time and AI-written about 9% of the time.
- Ahrefs (July 2025, 600,000 pages): content that mixes AI and human input
  ranks normally. Pure, unedited AI content is the problem.
- Google: "Using AI doesn't give content any special gains." Raters give the
  lowest rating to main content that is AI-generated with little effort,
  originality or added value. Fabricated authors, experience or credentials
  are "a form of deception." Google asks for "non-commodity content", not a
  restatement of what other pages already say.

So the pass adds real value first, fixes style second, and never fakes a
person's experience.

## Hard rules

1. Never write first-person experience, anecdotes, quotes, testimonials,
   opinions or credentials for Camren, Sarah or any groomer. Never imply that
   someone tested, visited or saw something.
2. Never use a paraphrase or "AI humanizer" tool. Never add typos or slang.
3. Keep every number, link, quote and source name unless you remove a whole
   commodity section. Record each removal in the report.
4. No em dashes anywhere: title, excerpt, SEO fields, alt text, captions, body.
5. Never name Sarah's Groomingdale's or imply a tie between that shop and
   GroomLocal.

## Files

Put everything in `<run-dir>/humanize/`:

| File | Content |
|---|---|
| `before.json` | The complete draft document as you will save it (`_id`, `slug`, `title`, `excerpt`, `seo`, `heroAlt`, `body`, `sections`) |
| `scan-before.txt` | The scanner output for `before.json` |
| `value-pass.md` | The baseline, the section tags, the gains, the cuts and the questions |
| `after.json` | The rewritten document |
| `compare.txt` | The fact gate output |
| `scan-after.txt` | The scanner output for `after.json` |

`S="<skill-folder>/scripts/ai_tells.py"`. Run it with the Hermes venv Python
or `python3`. It is stdlib only.

## Step 1. Scan

```bash
python3 "$S" "<run-dir>/humanize/before.json" > "<run-dir>/humanize/scan-before.txt"
```

## Step 2. Value pass

1. **Baseline:** list 5 to 8 points that the top 3 organic results and the
   People Also Ask answers from this run's SERP research already make.
2. **Tags:** tag each section GAIN (it adds something that the baseline does
   not, with evidence) or COMMODITY (it restates the baseline).
3. **Gains that an unattended run can add:**
   - GroomLocal harvested price data (`docs/price-harvest/` from the
     `price-harvest` skill), with sample size and month
   - a comparison table, built from cited sources, that no top result has
   - a sourced Pacific Northwest detail (climate, seasons, local rules)
   - current primary data with its date (a published dataset, an official
     policy page)
   Aim for 2 or more gains. If fewer are possible, say so in the report and in
   the review note. Fewer gains do not block review.
4. **Compress commodity sections** to the short answer that a searcher needs.
   Keep a point that answers a People Also Ask question, but cut it to 1 to 3
   sentences.
5. **Questions for Camren:** write 3 to 5 short interview questions that
   would add first-hand value for this topic. Examples: the most common owner
   mistake with one real example, one real number from experience, where the
   usual advice is wrong, what is different in the Pacific Northwest. Camren
   answers them in the Studio, so keep placeholders out of the body.

## Step 3. Style pass

Rewrite with [humanize-rewrite-rules.md](humanize-rewrite-rules.md). The main fixes:

- Put the answer first in the article and in each section.
- Use contractions in normal prose (don't, it's, you'll). Keep "do not" only
  for a safety warning.
- Use one hedge for each claim. Give the common case, then the exception once.
- Vary sentence length. Add short sentences. Don't write a run of
  12-to-25-word sentences.
- Cut "X is not A; it is B", "not just X but Y", abstract lists of three,
  "-ing" tail clauses, transition stacks and recap endings ("The short
  version", "Final thoughts").
- Replace each scanner "ai-vocab" or "stock-phrase" line with the plain
  word that the scanner suggests.

## Step 4. Fact gate

```bash
python3 "$S" --compare "<run-dir>/humanize/before.json" "<run-dir>/humanize/after.json" > "<run-dir>/humanize/compare.txt"
python3 "$S" "<run-dir>/humanize/after.json" --gate > "<run-dir>/humanize/scan-after.txt"
```

- `--compare` must exit 0. If a number, link or quote is missing, restore it
  or record the removed commodity section. Each new number needs a cited
  source in the article. List it in the report.
- `--gate` must exit 0: no em dash, no model artifact, and 3 or fewer tells
  per 1,000 words. Fix the text and run it again.
- Value flags ("few numbers", "no first-hand experience markers") are
  expected in unattended runs. Report them. They do not block review.

## Step 5. Save and report

1. Save `after.json` content to the CMS draft (create the draft, or use
   `save_draft` with `expectedRevision`).
2. Run the normal verification gates.
3. Call `request_review` with a `note` of 2,000 characters or fewer. The note
   contains:
   - one line of humanize results (tells per 1,000 words before and after,
     gains count)
   - the gains, one line each
   - "Questions for Camren", with the numbered questions
4. In the run report, give a before/after table: tells per 1,000 words,
   sentence-length CV, short sentences %, contractions, hedges per 100 words,
   numbers per 100 words, gains. Also list the gains with sources, the
   compressed or removed sections, and the questions.
