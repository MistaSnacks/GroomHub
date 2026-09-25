import { test } from "node:test";
import assert from "node:assert/strict";
import { decideClaim, emailMatchesWebsite, websiteHost } from "@/lib/claims";

test("email domain must match the listing website's registrable domain", () => {
  assert.equal(emailMatchesWebsite("owner@happypaws.com", "https://www.happypaws.com/"), true);
  assert.equal(emailMatchesWebsite("owner@happypaws.com", "http://book.happypaws.com/appointments"), true);
  assert.equal(emailMatchesWebsite("owner@HappyPaws.COM", "https://happypaws.com"), true);
  assert.equal(emailMatchesWebsite("owner@gmail.com", "https://gmail.com"), false);
  assert.equal(emailMatchesWebsite("owner@other.com", "https://happypaws.com"), false);
  assert.equal(emailMatchesWebsite("owner@happypaws.com", null), false);
  assert.equal(emailMatchesWebsite("owner@happypaws.com", "not a url"), false);
  assert.equal(emailMatchesWebsite("bad-email", "https://happypaws.com"), false);
});

test("decideClaim routes everything that is not a domain match to admin review", () => {
  assert.equal(decideClaim("a@happypaws.com", "https://happypaws.com"), "domain_match");
  assert.equal(decideClaim("a@gmail.com", "https://happypaws.com"), "admin_review");
  assert.equal(websiteHost("https://WWW.Example.org/x"), "example.org");
});
