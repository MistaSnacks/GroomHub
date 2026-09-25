import { test } from "node:test";
import assert from "node:assert/strict";
import { imageUrl, safeContentHref } from "@/lib/cms/content";

test("imageUrl only accepts https media.snackboxcms.com", () => {
  assert.equal(imageUrl({ url: "https://media.snackboxcms.com/groomlocal/a.png" }), "https://media.snackboxcms.com/groomlocal/a.png");
  assert.equal(imageUrl({ originalUrl: "https://media.snackboxcms.com/groomlocal/b.png" }), "https://media.snackboxcms.com/groomlocal/b.png");
  for (const bad of ["http://media.snackboxcms.com/x", "https://media.snackboxcms.com.evil.com/x", "https://evil.com/media.snackboxcms.com", "data:image/png;base64,AAAA", ""]) {
    assert.equal(imageUrl({ url: bad }), null, bad);
  }
  assert.equal(imageUrl(null), null);
});

test("safeContentHref allows relative, anchor, http(s), mailto and tel only", () => {
  assert.equal(safeContentHref("/blog"), "/blog");
  assert.equal(safeContentHref("#faq"), "#faq");
  assert.equal(safeContentHref("https://groomlocal.com/x"), "https://groomlocal.com/x");
  assert.equal(safeContentHref("mailto:hi@example.com"), "mailto:hi@example.com");
  assert.equal(safeContentHref("tel:+12065550100"), "tel:+12065550100");
  for (const bad of ["//evil.com", "javascript:alert(1)", "data:text/html,hi", "vbscript:x", "ftp://x", ""]) {
    assert.equal(safeContentHref(bad), undefined, bad);
  }
});
