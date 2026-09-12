import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PortableContent, CmsSections } from "../src/components/cms-content";
import type { PortableBlock } from "../src/lib/cms/content";

const block = (text: string, extras: Partial<PortableBlock> = {}): PortableBlock => ({
  _type:"block", _key:text, style:"normal", children:[{_type:"span",_key:text,text,marks:[]}], ...extras,
});

test("mixed paragraphs and nested lists preserve order through the final block", () => {
  const html = renderToStaticMarkup(<PortableContent blocks={[
    block("Introduction"), block("First",{listItem:"number",level:1}),
    block("Nested",{listItem:"bullet",level:2}), block("Second",{listItem:"number",level:1}), block("Conclusion"),
  ]} />);
  assert.match(html, /Introduction.*<ol.*First.*<ul.*Nested.*<\/ul>.*Second.*<\/ol>.*Conclusion/);
});

test("CMS links and table cells render formatting without executing HTML or script URLs", () => {
  const html = renderToStaticMarkup(<>
    <PortableContent blocks={[block("",{children:[{_type:"span",_key:"unsafe",text:"Unsafe link",marks:["url"]}],markDefs:[{_key:"url",_type:"link",href:"javascript:alert(1)"}]})]} />
    <CmsSections sections={[{kind:"table",table:{headings:["Service"],rows:[{cells:["**Bath** and [quote](/get-quotes)"]},{cells:["<script>alert(1)</script>"]}]}}]} />
  </>);
  assert.match(html, /<strong[^>]*>Bath<\/strong>/);
  assert.match(html, /href="\/get-quotes"/);
  assert.doesNotMatch(html, /href="javascript:|<script>/);
  assert.match(html, /&lt;script&gt;/);
});
