import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderBrandedEmail } from "@/lib/email/template";
import { sendEmail, emailFrom } from "@/lib/email/send";

test("escapeHtml escapes the five HTML metacharacters", () => {
  assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
});

test("renderBrandedEmail escapes heading and preheader", () => {
  const html = renderBrandedEmail({ heading: "<b>hi</b>", preheader: "<i>pre</i>", body: "<p>ok</p>" });
  assert.ok(!html.includes("<b>hi</b>"));
  assert.ok(html.includes("&lt;b&gt;hi&lt;/b&gt;"));
  assert.ok(html.includes("<p>ok</p>"));
});

function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>) {
  const saved: Record<string, string | undefined> = {};
  for (const k of Object.keys(vars)) { saved[k] = process.env[k]; if (vars[k] === undefined) delete process.env[k]; else process.env[k] = vars[k]; }
  return fn().finally(() => { for (const k of Object.keys(vars)) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });
}

test("sendEmail refuses to send without a key or a production sender", async () => {
  const origFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (async () => { called = true; return new Response("{}", { status: 200 }); }) as typeof fetch;
  try {
    await withEnv({ RESEND_API_KEY: undefined, EMAIL_FROM: undefined, QUOTE_FROM_EMAIL: undefined }, async () => {
      const r = await sendEmail({ site: "test", to: "a@b.co", subject: "s", text: "t" });
      assert.deepEqual(r, { ok: false, error: "missing RESEND_API_KEY" });
    });
    await withEnv({ RESEND_API_KEY: "k", EMAIL_FROM: undefined, QUOTE_FROM_EMAIL: undefined, NODE_ENV: "production" }, async () => {
      assert.equal(emailFrom(), null);
      const r = await sendEmail({ site: "test", to: "a@b.co", subject: "s", text: "t" });
      assert.deepEqual(r, { ok: false, error: "missing EMAIL_FROM" });
    });
    assert.equal(called, false);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("sendEmail returns the Resend id on success and the error body on failure", async () => {
  const origFetch = globalThis.fetch;
  try {
    await withEnv({ RESEND_API_KEY: "k", EMAIL_FROM: "GroomLocal <hello@groomlocal.com>" }, async () => {
      globalThis.fetch = (async () => new Response(JSON.stringify({ id: "msg_1" }), { status: 200 })) as typeof fetch;
      assert.deepEqual(await sendEmail({ site: "test", to: "a@b.co", subject: "s", text: "t" }), { ok: true, id: "msg_1" });
      globalThis.fetch = (async () => new Response(JSON.stringify({ name: "validation_error", message: "domain not verified" }), { status: 403 })) as typeof fetch;
      const r = await sendEmail({ site: "test", to: "a@b.co", subject: "s", text: "t" });
      assert.equal(r.ok, false);
      if (!r.ok) { assert.equal(r.status, 403); assert.match(r.error, /domain not verified/); }
    });
  } finally {
    globalThis.fetch = origFetch;
  }
});
