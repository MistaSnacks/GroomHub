import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { Resolver } from "node:dns/promises";
import { checkMailDns } from "@/lib/admin-console/checks";

let clock = Date.now();

beforeEach(() => {
  clock += 11 * 60_000;
  mock.method(Date, "now", () => clock);
  mock.method(Resolver.prototype, "resolveTxt", async () => {
    throw Object.assign(new Error("DNS resolver refused the query"), { code: "EREFUSED" });
  });
  mock.method(console, "warn", () => {});
});

afterEach(() => {
  mock.restoreAll();
});

test("unavailable DNS does not report missing mail records", async () => {
  mock.method(globalThis, "fetch", async () => {
    throw new Error("DNS service unavailable");
  });

  const report = await checkMailDns();
  assert.deepEqual(report.checks.map((check) => check.level), ["unknown", "unknown", "unknown", "unknown"]);
  for (const check of report.checks) {
    assert.match(check.detail, /unknown/i);
    assert.doesNotMatch(check.detail, /no (SPF|DMARC) record|no key published/i);
  }
});

function publishedResponse(input: Parameters<typeof fetch>[0]): Response {
  const url = input instanceof Request ? new URL(input.url) : new URL(input);
  const host = url.searchParams.get("name") ?? "";
  const data = host.startsWith("_dmarc.")
    ? "v=DMARC1; p=none; rua=mailto:reports@example.com;"
    : host.includes("._domainkey.")
      ? "v=DKIM1; k=rsa; p=published-key"
      : "v=spf1 include:_spf.google.com ~all";
  return Response.json({ Status: 0, Answer: [{ type: 16, data }] });
}

test("HTTPS lookup recovers published records when the native resolver fails", async () => {
  mock.method(globalThis, "fetch", async (input: Parameters<typeof fetch>[0]) => publishedResponse(input));
  const report = await checkMailDns();

  assert.deepEqual(report.checks.map((check) => check.level), ["ok", "ok", "ok", "warn"]);
  assert.match(report.checks[0].detail, /include:_spf.google.com/);
  assert.match(report.checks[3].detail, /Monitoring only/);
});

test("confirmed absent DNS records still fail", async () => {
  for (const response of [{ Status: 3 }, { Status: 0 }]) {
    clock += 11 * 60_000;
    mock.method(globalThis, "fetch", async () => Response.json(response));
    const report = await checkMailDns();
    assert.deepEqual(report.checks.map((check) => check.level), ["fail", "fail", "fail", "fail"]);
  }
});

test("DNS service errors and invalid answers remain unknown", async () => {
  const responses = [
    { Status: 2 },
    { Status: 0, TC: true },
    { message: "upstream failure" },
    { Status: 0, Answer: [{ type: 16, data: null }] },
  ];
  for (const response of responses) {
    mock.method(globalThis, "fetch", async () => Response.json(response));
    const report = await checkMailDns();
    assert.deepEqual(report.checks.map((check) => check.level), ["unknown", "unknown", "unknown", "unknown"]);
  }
  mock.method(globalThis, "fetch", async () => new Response("Service unavailable", { status: 503 }));
  const report = await checkMailDns();
  assert.ok(report.checks.every((check) => check.level === "unknown"));
});

test("a failed check recovers immediately without waiting for the success cache", async () => {
  mock.method(globalThis, "fetch", async () => { throw new Error("offline"); });
  const unavailable = await checkMailDns();
  assert.ok(unavailable.checks.every((check) => check.level === "unknown"));

  mock.method(globalThis, "fetch", async (input: Parameters<typeof fetch>[0]) => publishedResponse(input));
  const recovered = await checkMailDns();
  assert.deepEqual(recovered.checks.map((check) => check.level), ["ok", "ok", "ok", "warn"]);
});

test("native TXT chunks stay joined as a single SPF record", async () => {
  mock.method(Resolver.prototype, "resolveTxt", async (host: string) => {
    if (host.startsWith("_dmarc.")) return [["v=DMARC1; p=none;"]];
    if (host.includes("._domainkey.")) return [["v=DKIM1; k=rsa; p=", "published-key"]];
    return [["v=spf1 include:_spf.", "google.com ~all"]];
  });
  mock.method(globalThis, "fetch", async () => { throw new Error("HTTPS unavailable"); });
  const report = await checkMailDns();
  assert.deepEqual(report.checks.map((check) => check.level), ["ok", "ok", "ok", "warn"]);
});
