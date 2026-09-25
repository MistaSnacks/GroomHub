import { test } from "node:test";
import assert from "node:assert/strict";
import { extractFaqs, formatBlogDate } from "@/lib/blog";
import type { PortableBlock } from "@/lib/cms/content";

const b = (style: string, text: string, extra: Partial<PortableBlock> = {}): PortableBlock => ({ _type: "block", style, children: [{ _type: "span", text }], ...extra });

test("extractFaqs reads h3/h4 questions under the FAQ h2 until the next h2", () => {
  const body: PortableBlock[] = [
    b("h2", "Intro"), b("normal", "not a faq"),
    b("h2", "Frequently Asked Questions"),
    b("h3", "How often?"), b("normal", "Every 6 weeks."), b("normal", "Sometimes 8."),
    b("h4", "Cost?"), b("normal", "About $80."), b("normal", "ignored list item", { listItem: "bullet" }),
    b("h3", "Blank answer?"),
    b("h2", "Conclusion"), b("h3", "Not a question"), b("normal", "nope"),
  ];
  assert.deepEqual(extractFaqs({ body, sections: [] }), [
    { question: "How often?", answer: "Every 6 weeks. Sometimes 8." },
    { question: "Cost?", answer: "About $80." },
  ]);
});

test("extractFaqs also scans section bodies and accepts a bare FAQ heading", () => {
  const sections = [{ body: [b("h2", "FAQ"), b("h3", "Q?"), b("normal", "A.")] }];
  assert.deepEqual(extractFaqs({ body: [], sections }), [{ question: "Q?", answer: "A." }]);
});

test("formatBlogDate renders in UTC without an off-by-one day", () => {
  assert.equal(formatBlogDate("2026-09-01"), "September 1, 2026");
});
