import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonLd } from "@/lib/json-ld";

test("jsonLd never emits a raw angle bracket or ampersand", () => {
  const out = jsonLd({ name: '</script><script>alert(1)</script>', note: "a & b" });
  assert.equal(out.includes("<"), false);
  assert.equal(out.includes(">"), false);
  assert.equal(out.includes("&"), false);
  assert.deepEqual(JSON.parse(out), { name: '</script><script>alert(1)</script>', note: "a & b" });
});
