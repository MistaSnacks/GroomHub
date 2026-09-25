import { test } from "node:test";
import assert from "node:assert/strict";
import { unsubscribeUrl, verifyUnsubscribeToken } from "@/lib/newsletter";

test("unsubscribe links are signed and verify only with the matching email", () => {
  const prev = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = "test-secret";
  try {
    const url = unsubscribeUrl("Pet@Example.com");
    assert.ok(url && url.startsWith("https://groomlocal.com/api/newsletter/unsubscribe?"));
    const params = new URL(url!).searchParams;
    assert.equal(params.get("email"), "pet@example.com");
    assert.equal(verifyUnsubscribeToken("pet@example.com", params.get("token")!), true);
    assert.equal(verifyUnsubscribeToken("other@example.com", params.get("token")!), false);
    assert.equal(verifyUnsubscribeToken("pet@example.com", "nope"), false);
  } finally {
    if (prev === undefined) delete process.env.NEWSLETTER_UNSUBSCRIBE_SECRET; else process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = prev;
  }
});
