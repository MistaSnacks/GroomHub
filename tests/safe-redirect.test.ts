import { test } from "node:test";
import assert from "node:assert/strict";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { isAdminEmail, getAdminEmails } from "@/lib/admin";

test("safeRedirectPath rejects every off-site shape", () => {
  for (const bad of ["//evil.com", "/\\evil.com", "/x@evil.com", "https://evil.com", "", 42, null, undefined, "evil"]) {
    assert.equal(safeRedirectPath(bad), "/dashboard", String(bad));
  }
  assert.equal(safeRedirectPath("/dashboard/listing/foo?x=1"), "/dashboard/listing/foo?x=1");
  for (const loop of ["/login", "/login?redirect=/login", "/signup", "/auth/callback"]) {
    assert.equal(safeRedirectPath(loop), "/dashboard", loop);
  }
  assert.equal(safeRedirectPath(undefined, "/login"), "/login");
});

test("isAdminEmail fails closed with no allowlist and matches case-insensitively", () => {
  const prev = process.env.ADMIN_EMAILS;
  try {
    delete process.env.ADMIN_EMAILS;
    assert.deepEqual(getAdminEmails(), []);
    assert.equal(isAdminEmail("anyone@example.com"), false);
    process.env.ADMIN_EMAILS = " Owner@Example.com , second@example.com ";
    assert.equal(isAdminEmail("owner@example.com"), true);
    assert.equal(isAdminEmail("OWNER@EXAMPLE.COM"), true);
    assert.equal(isAdminEmail("second@example.com"), true);
    assert.equal(isAdminEmail("third@example.com"), false);
    assert.equal(isAdminEmail(null), false);
    assert.equal(isAdminEmail(undefined), false);
  } finally {
    if (prev === undefined) delete process.env.ADMIN_EMAILS; else process.env.ADMIN_EMAILS = prev;
  }
});
