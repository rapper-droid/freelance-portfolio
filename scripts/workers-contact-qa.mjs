import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

// Executes the built Worker. EVERY external fetch is intercepted; no real keys or mail.
const root = path.resolve(import.meta.dirname, "../dist/server");
const modules = [];
async function scan(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await scan(p);
    else if (e.name.endsWith(".js"))
      modules.push({ type: "ESModule", path: p });
  }
}
await scan(root);
modules.sort(
  (a, b) =>
    Number(b.path === path.join(root, "index.js")) -
    Number(a.path === path.join(root, "index.js")),
);
const abuseModule = modules.find((m) =>
  path.basename(m.path).startsWith("abuse-"),
);
modules.unshift({
  type: "ESModule",
  path: path.join(root, "qa-probe.js"),
  contents: `import app from './index.js'; import * as abuse from './${path.relative(root, abuseModule.path).replaceAll("\\", "/")}'; export default { async fetch(request,env,ctx) { if(new URL(request.url).pathname==='/__qa_probe') { const results={}; for(const [key,fn] of Object.entries(abuse)) { try { if(fn.toString().includes('RATE_LIMIT_SALT')) results[key]=fn('fixture').length; else if(fn.toString().includes('UPSTASH_REDIS_REST_URL')) results[key]=await fn('GET','fixture'); } catch(error) { results[key]=error.message; } } return Response.json(results); } return app.fetch(request,env,ctx); } };`,
});
const store = new Map(),
  deliveries = new Map(),
  calls = [];
let spam = false,
  redisDown = false,
  confirmationDown = false;
const bindings = {
  NEXT_PUBLIC_SITE_URL: "https://tsudowa.com",
  CONTACT_ENABLED: "true",
  NEXT_PUBLIC_ANALYTICS_ENABLED: "false",
  HOSTING_PLATFORM: "cloudflare",
  OWNER_REVIEW: "true",
  CONTACT_FROM_EMAIL: "no-reply@tsudowa.com",
  CONTACT_TO_EMAIL: "contact@tsudowa.com",
  RESEND_API_KEY: "fixture-never-a-real-key",
  TURNSTILE_SECRET: "fixture-only",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "fixture-only",
  UPSTASH_REDIS_REST_URL: "https://fixture.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "fixture-only",
  RATE_LIMIT_SALT: "fixture-salt-not-a-production-secret-123456789",
};
const mf = new Miniflare(
  convertV4MiniflareOptions({
    modules,
    modulesRoot: root,
    compatibilityDate: "2026-09-17",
    compatibilityFlags: ["nodejs_compat"],
    bindings,
    outboundService: async (request) => {
      const url = new URL(request.url);
      calls.push(url.hostname);
      if (url.hostname === "challenges.cloudflare.com")
        return Response.json({
          success: !spam,
          action: "contact",
          hostname: "tsudowa.com",
        });
      if (url.hostname === "fixture.upstash.io") {
        if (redisDown)
          return Response.json({ error: "fixture-down" }, { status: 503 });
        const args = await request.json();
        const [cmd, key, value] = args;
        let result = null;
        if (cmd === "GET") result = store.get(key) ?? null;
        else if (cmd === "SET") {
          if (!args.includes("NX") || !store.has(key)) {
            store.set(key, value);
            result = "OK";
          }
        } else if (cmd === "EVAL" && String(key).includes("INCR")) {
          result = Number(store.get(args[3]) ?? 0) + 1;
          store.set(args[3], result);
        } else if (cmd === "EVAL" && String(key).includes("DEL")) {
          result = store.get(args[3]) === args[4] ? 1 : 0;
          if (result) store.delete(args[3]);
        } else throw Error("Unexpected fixture Redis command");
        return Response.json({ result });
      }
      if (url.hostname === "api.resend.com" && url.pathname === "/emails") {
        const key = request.headers.get("Idempotency-Key"),
          body = await request.json();
        if (confirmationDown && key.endsWith("-confirmation"))
          return Response.json({ error: "fixture-down" }, { status: 503 });
        if (deliveries.has(key)) assert.deepEqual(deliveries.get(key), body);
        deliveries.set(key, body);
        return Response.json({ id: "fixture-" + key });
      }
      throw Error("BLOCKED unexpected outbound host: " + url.hostname);
    },
  }),
);
const results = [];
const body = {
  name: "Fixture User",
  email: "fixture@example.test",
  detail: "Workers migration fixture; never delivered.",
  page: "/contact",
  token: "fixture-only",
  id: "b37ae8a2-411a-4f03-963b-00e6ae6f8fca",
  consent: true,
  website: "",
};
async function send(
  value = body,
  origin = "https://tsudowa.com",
  ip = "192.0.2.10",
) {
  const r = await mf.dispatchFetch("https://tsudowa.com/api/contact", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify(value),
  });
  return { status: r.status, body: await r.json() };
}
async function check(name, run) {
  await run();
  results.push({ name, status: "PASS" });
  console.log("PASS " + name);
}
try {
  console.log(
    "Fixture primitive probe",
    await (await mf.dispatchFetch("https://tsudowa.com/__qa_probe")).text(),
  );
  await check(
    "built Worker accepts owner and auto-reply exactly once",
    async () => {
      const r = await send();
      assert.equal(r.status, 200);
      assert.equal(r.body.confirmation, "sent");
      assert.equal(deliveries.size, 2);
    },
  );
  await check(
    "Reply-To points to visitor for owner and contact for receipt",
    async () => {
      const owner = deliveries.get("tsudowa-" + body.id + "-owner"),
        receipt = deliveries.get("tsudowa-" + body.id + "-confirmation");
      assert.equal(owner.reply_to, body.email);
      assert.equal(receipt.reply_to, "contact@tsudowa.com");
      assert.deepEqual(owner.to, ["contact@tsudowa.com"]);
    },
  );
  await check(
    "retry returns same receipt without duplicate provider sends",
    async () => {
      const before = deliveries.size;
      assert.equal((await send()).status, 200);
      assert.equal(deliveries.size, before);
    },
  );
  await check("same ID with changed content conflicts", async () =>
    assert.equal(
      (await send({ ...body, detail: body.detail + " changed" })).status,
      409,
    ),
  );
  await check("wrong origin blocked without provider calls", async () => {
    const n = calls.length;
    assert.equal((await send(body, "https://evil.invalid")).status, 403);
    assert.equal(calls.length, n);
  });
  await check("honeypot and oversized payload blocked", async () => {
    assert.equal((await send({ ...body, website: "bot" })).status, 400);
    assert.equal(
      (await send({ ...body, detail: "x".repeat(20000) })).status,
      400,
    );
  });
  await check("Turnstile failure blocked", async () => {
    spam = true;
    assert.equal((await send()).status, 403);
    spam = false;
  });
  await check("per-IP quota blocked on sixth request", async () => {
    await send();
    assert.equal((await send()).status, 429);
  });
  await check("different IP is not pooled into the same bucket", async () =>
    assert.equal(
      (await send(body, "https://tsudowa.com", "192.0.2.11")).status,
      200,
    ),
  );
  await check("Redis outage fails closed", async () => {
    redisDown = true;
    assert.equal(
      (await send(body, "https://tsudowa.com", "192.0.2.12")).status,
      503,
    );
    redisDown = false;
  });
  await check(
    "partial send retry does not duplicate owner message",
    async () => {
      const value = { ...body, id: "a37ae8a2-411a-4f03-963b-00e6ae6f8fca" };
      confirmationDown = true;
      const r = await send(value, "https://tsudowa.com", "192.0.2.13");
      assert.equal(r.status, 503);
      assert.equal(r.body.code, "receipt_pending");
      assert.equal(deliveries.size, 3);
      confirmationDown = false;
      const retry = await send(value, "https://tsudowa.com", "192.0.2.13");
      assert.equal(retry.status, 200);
      assert.equal(retry.body.receipt, r.body.receipt);
      assert.equal(deliveries.size, 4);
    },
  );
} finally {
  await mf.dispose();
  await fs.writeFile(
    path.resolve(
      import.meta.dirname,
      "../../../outputs/cloudflare-migration-20260917/contact-workerd.json",
    ),
    JSON.stringify(
      {
        kind: "built Worker with intercepted external providers; NOT live delivery",
        results,
        fixtureProviderDeliveries: deliveries.size,
        externalHosts: [...new Set(calls)],
      },
      null,
      2,
    ),
  );
}
