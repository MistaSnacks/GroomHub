import { test } from "node:test";
import assert from "node:assert/strict";
import { decideClaim, emailMatchesWebsite, resemblesBusinessName, websiteHost } from "@/lib/claims";

test("email domain must match the listing website's registrable domain", () => {
  assert.equal(emailMatchesWebsite("owner@happypaws.com", "https://www.happypaws.com/"), true);
  assert.equal(emailMatchesWebsite("owner@happypaws.com", "http://book.happypaws.com/appointments"), true);
  assert.equal(emailMatchesWebsite("owner@HappyPaws.COM", "https://happypaws.com"), true);
  assert.equal(emailMatchesWebsite("owner@gmail.com", "https://gmail.com"), false);
  assert.equal(emailMatchesWebsite("owner@other.com", "https://happypaws.com"), false);
  assert.equal(emailMatchesWebsite("owner@happypaws.com", null), false);
  assert.equal(emailMatchesWebsite("owner@happypaws.com", "not a url"), false);
  assert.equal(emailMatchesWebsite("bad-email", "https://happypaws.com"), false);
  assert.equal(websiteHost("https://WWW.Example.org/x"), "example.org");
});

test("an email at the listing's website domain is a domain match", () => {
  const d = decideClaim("a@happypaws.com", { website: "https://happypaws.com", name: "Happy Paws" });
  assert.deepEqual([d.verification, d.rule], ["domain_match", "domain_match"]);
});

test("a company name at a webmail address is approved, not queued", () => {
  const cases: Array<[string, string]> = [
    ["bellasspa@gmail.com", "Bella's Spa Experience"],
    ["fluffytails@gmail.com", "Fluffy Tails"],
    ["cityhound.kirkland@gmail.com", "City Hound Kirkland"],
    ["janes.groomerama@yahoo.com", "Jane's Groomerama Pet Salon"],
    ["BellasSpa2024@Gmail.com", "Bella’s Spa Experience"],
  ];
  for (const [email, name] of cases) {
    const d = decideClaim(email, { website: "https://example.com", name });
    assert.deepEqual([email, d.verification, d.rule], [email, "auto_approved", "name_match"]);
  }
});

test("a personal webmail address with no link to the name is still approved, but marked as weak", () => {
  const d = decideClaim("jsmith1987@gmail.com", { website: "https://pawshpaws.com", name: "Pawsh Paws" });
  assert.deepEqual([d.verification, d.rule], ["auto_approved", "webmail"]);
  // No website on file does not push it to review either.
  assert.equal(decideClaim("jsmith1987@gmail.com", { website: null, name: "Pawsh Paws" }).verification, "auto_approved");
  assert.equal(decideClaim("jsmith1987@comcast.net", { name: "Pawsh Paws" }).verification, "auto_approved");
});

test("generic grooming words do not count as a name match", () => {
  assert.equal(resemblesBusinessName("petgrooming", "Seattle Pet Grooming"), false);
  assert.equal(resemblesBusinessName("dogspa", "Dog Spa"), false);
  assert.equal(resemblesBusinessName("seattlefurs", "Seattle Pet Grooming"), true);
  assert.equal(resemblesBusinessName("abc", "Abc Dogs"), false, "too short to mean anything");
  assert.equal(resemblesBusinessName("anything", null), false);
});

test("the business email already on the listing counts, ignoring case", () => {
  const d = decideClaim("Owner.Random@Gmail.com", { website: null, name: "Pawsh Paws", email: "owner.random@gmail.com" });
  assert.deepEqual([d.verification, d.rule], ["auto_approved", "listing_email"]);
});

test("a company domain that resembles the business is approved even if it is not the website", () => {
  const d = decideClaim("hello@pawshpaws.net", { website: "https://pawshpaws.com", name: "Pawsh Paws" });
  assert.deepEqual([d.verification, d.rule], ["auto_approved", "name_match"]);
  const social = decideClaim("hello@urbandoggie.co", { website: "https://facebook.com/urbandoggie", name: "Urban Doggie" });
  assert.equal(social.verification, "auto_approved");
});

test("only clearly unrelated claims go to review", () => {
  const unrelated = decideClaim("jim@acmeplumbing.com", { website: "https://pawshpaws.com", name: "Pawsh Paws" });
  assert.deepEqual([unrelated.verification, unrelated.rule], ["admin_review", "unrelated_domain"]);
  assert.match(unrelated.reason, /acmeplumbing\.com/);

  const burner = decideClaim("x@mailinator.com", { website: "https://pawshpaws.com", name: "Pawsh Paws" });
  assert.deepEqual([burner.verification, burner.rule], ["admin_review", "disposable"]);
  // Even a name match does not rescue a throwaway address.
  assert.equal(decideClaim("pawshpaws@mailinator.com", { name: "Pawsh Paws" }).verification, "admin_review");

  for (const bad of ["bad-email", "@gmail.com", "a@nodot"]) {
    assert.equal(decideClaim(bad, { name: "Pawsh Paws" }).rule, "invalid_email", bad);
  }
});
