import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
const out = path.resolve("../../outputs/workers-final-blockers-20260917");
await fs.mkdir(out, { recursive: true });
const root = path.resolve("dist/server"),
  modules = [];
async function scan(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await scan(p);
    else if (e.name.endsWith(".js"))
      modules.push({ type: "ESModule", path: p });
  }
}
await scan(root);
modules.unshift({
  type: "ESModule",
  path: path.join(root, "native-qa-probe.js"),
  contents: `import app,{ContactState as Base} from './index.js';export class ContactState extends Base {async execute(op){if(this.env.STATE_FAILURE==='true')throw Error('fixture unavailable');return super.execute(op);}}export default {async fetch(request,env,ctx){if(new URL(request.url).pathname==='/__qa_state'){const {key,op}=await request.json();return Response.json(await env.CONTACT_STATE.getByName(key).execute(op));}return app.fetch(request,env,ctx);}};`,
});
const deliveries = new Map(),
  mailAttempts = [],
  calls = [],
  usedTokens = new Set();
let confirmationDown = false;
let resendFailure = "";
const bindings = {
  NEXT_PUBLIC_SITE_URL: "https://tsudowa.com",
  CONTACT_ENABLED: "true",
  HOSTING_PLATFORM: "cloudflare",
  STATE_BACKEND: "durable-objects",
  OWNER_REVIEW: "false",
  NEXT_PUBLIC_ANALYTICS_ENABLED: "false",
  CONTACT_FROM_EMAIL: "no-reply@tsudowa.com",
  CONTACT_TO_EMAIL: "contact@tsudowa.com",
  RESEND_API_KEY: "fixture-only",
  TURNSTILE_SECRET: "fixture-only",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "fixture-only",
  RATE_LIMIT_SALT: "fixture-only-never-production-123456789",
};
function create(failure = false, overrides = {}) {
  return new Miniflare(
    convertV4MiniflareOptions({
      modules,
      modulesRoot: root,
      compatibilityDate: "2026-09-17",
      compatibilityFlags: ["nodejs_compat"],
      bindings: { ...bindings, ...overrides, STATE_FAILURE: String(failure) },
      durableObjects: {
        CONTACT_STATE: { className: "ContactState", useSQLite: true },
      },
      outboundService: async (request) => {
        const url = new URL(request.url);
        calls.push(url.hostname);
        if (url.hostname === "challenges.cloudflare.com") {
          const params = new URLSearchParams(await request.text()),
            token = params.get("response");
          const success = token !== "invalid" && !usedTokens.has(token);
          usedTokens.add(token);
          return Response.json({
            success,
            action: token === "wrong-action" ? "login" : "contact",
            hostname:
              token === "wrong-hostname"
                ? "evil.invalid"
                : new URL(
                    overrides.CONTACT_ORIGIN || bindings.NEXT_PUBLIC_SITE_URL,
                  ).hostname,
          });
        }
        if (url.hostname === "api.resend.com" && url.pathname === "/emails") {
          const key = request.headers.get("Idempotency-Key"),
            body = await request.json();
          mailAttempts.push(key);
          if (resendFailure === "timeout")
            throw new DOMException("fixture timeout", "TimeoutError");
          if (resendFailure === "5xx")
            return new Response("fixture 5xx", { status: 503 });
          if (resendFailure === "rejection")
            return new Response("fixture rejection", { status: 422 });
          if (confirmationDown && key.endsWith("-confirmation"))
            return new Response("unavailable", { status: 503 });
          if (deliveries.has(key)) assert.deepEqual(deliveries.get(key), body);
          deliveries.set(key, body);
          return Response.json({ id: "fixture-" + key });
        }
        throw Error("Unexpected outbound host: " + url.hostname);
      },
    }),
  );
}
const mf = create(),
  results = [];
const base = {
  name: "Fixture",
  email: "fixture@example.test",
  detail: "Workers native isolated fixture, never delivered.",
  page: "/contact",
  id: randomUUID(),
  consent: true,
  website: "",
};
let ipIndex = 1;
async function send(
  body = base,
  {
    origin = "https://tsudowa.com",
    ip = `192.0.2.${ipIndex++}`,
    token = randomUUID(),
    instance = mf,
  } = {},
) {
  const r = await instance.dispatchFetch("https://tsudowa.com/api/contact", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify({ ...body, token }),
  });
  return { status: r.status, body: await r.json() };
}
async function check(name, fn) {
  await fn();
  results.push({ name, status: "PASS" });
  console.log("PASS " + name);
}
try {
  let receipt;
  await check(
    "native contact accepts owner and receipt with matching request ID",
    async () => {
      const r = await send();
      assert.equal(r.status, 200);
      receipt = r.body.receipt;
      assert.match(receipt, /^TSW-/);
      assert.equal(deliveries.size, 2);
      for (const mail of deliveries.values())
        assert.ok(JSON.stringify(mail).includes(receipt));
    },
  );
  await check("Reply-To remains correct", async () => {
    assert.equal(
      deliveries.get("tsudowa-" + base.id + "-owner").reply_to,
      base.email,
    );
    assert.equal(
      deliveries.get("tsudowa-" + base.id + "-confirmation").reply_to,
      "contact@tsudowa.com",
    );
  });
  await check(
    "fresh-token retry has same receipt and no duplicate send",
    async () => {
      const r = await send();
      assert.equal(r.status, 200);
      assert.equal(r.body.receipt, receipt);
      assert.equal(deliveries.size, 2);
    },
  );
  await check("changed payload conflicts", async () =>
    assert.equal(
      (await send({ ...base, detail: base.detail + " changed" })).status,
      409,
    ),
  );
  await check(
    "origin and invalid body reject before external calls",
    async () => {
      const n = calls.length;
      assert.equal(
        (await send(base, { origin: "https://evil.invalid" })).status,
        403,
      );
      assert.equal((await send({ ...base, website: "bot" })).status, 400);
      assert.equal(
        (await send({ ...base, detail: "x".repeat(20000) })).status,
        400,
      );
      assert.equal(calls.length, n);
    },
  );
  await check("invalid and replayed Turnstile tokens rejected", async () => {
    assert.equal((await send(base, { token: "invalid" })).status, 403);
    const token = randomUUID();
    assert.equal((await send(base, { token })).status, 200);
    assert.equal((await send(base, { token })).status, 403);
  });
  await check(
    "per-IP sixth request blocked; independent IP accepted",
    async () => {
      for (let i = 0; i < 5; i++)
        assert.equal((await send(base, { ip: "198.51.100.7" })).status, 200);
      assert.equal((await send(base, { ip: "198.51.100.7" })).status, 429);
      assert.equal((await send(base, { ip: "198.51.100.8" })).status, 200);
    },
  );
  await check(
    "native state outage fails closed without provider call",
    async () => {
      const failed = create(true),
        n = calls.length;
      try {
        assert.equal((await send(base, { instance: failed })).status, 503);
        assert.equal(calls.length, n);
      } finally {
        await failed.dispose();
      }
    },
  );
  await check(
    "concurrent submission produces only two unique provider sends",
    async () => {
      const value = { ...base, id: randomUUID() },
        n = deliveries.size;
      const r = await Promise.all(
        Array.from({ length: 12 }, () => send(value)),
      );
      assert.ok(r.some((x) => x.status === 200));
      assert.ok(r.every((x) => [200, 409].includes(x.status)));
      assert.equal(deliveries.size - n, 2);
      assert.equal(
        mailAttempts.filter((k) => k === "tsudowa-" + value.id + "-owner")
          .length,
        1,
      );
      assert.equal(
        mailAttempts.filter(
          (k) => k === "tsudowa-" + value.id + "-confirmation",
        ).length,
        1,
      );
    },
  );
  await check("partial send retry never duplicates owner", async () => {
    const value = { ...base, id: randomUUID() },
      n = deliveries.size;
    confirmationDown = true;
    const r = await send(value);
    assert.equal(r.status, 503);
    assert.equal(r.body.code, "receipt_pending");
    assert.equal(deliveries.size - n, 1);
    confirmationDown = false;
    const retry = await send(value);
    assert.equal(retry.status, 200);
    assert.equal(retry.body.receipt, r.body.receipt);
    assert.equal(deliveries.size - n, 2);
  });
  await check(
    "missing token, wrong action and wrong hostname never send mail",
    async () => {
      const n = deliveries.size;
      assert.equal(
        (await send({ ...base, id: randomUUID() }, { token: "" })).status,
        400,
      );
      for (const token of ["wrong-action", "wrong-hostname"])
        assert.equal(
          (await send({ ...base, id: randomUUID() }, { token })).status,
          403,
        );
      assert.equal(deliveries.size, n);
    },
  );
  for (const failure of ["timeout", "5xx", "rejection"]) {
    await check(
      "Resend " + failure + " fails closed and stable retry delivers once",
      async () => {
        const payload = { ...base, id: randomUUID() },
          n = deliveries.size;
        resendFailure = failure;
        const failed = await send(payload);
        assert.equal(failed.status, 503);
        assert.equal(failed.body.code, "unavailable");
        assert.equal(deliveries.size, n);
        resendFailure = "";
        const retry = await send(payload);
        assert.equal(retry.status, 200);
        assert.equal(retry.body.receipt, failed.body.receipt);
        assert.equal(deliveries.size, n + 2);
      },
    );
  }
  await check(
    "approved preview origin works without changing canonical; production origin rejected",
    async () => {
      const origin =
        "https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev";
      const preview = create(false, {
        OWNER_REVIEW: "true",
        CONTACT_ORIGIN: origin,
      });
      try {
        const value = { ...base, id: randomUUID() };
        const n = deliveries.size;
        assert.equal((await send(value, { instance: preview })).status, 403);
        assert.equal(
          (await send(value, { origin, instance: preview })).status,
          200,
        );
        assert.equal(deliveries.size - n, 2);
      } finally {
        await preview.dispose();
      }
    },
  );
  await check("global daily and monthly send caps block new mail", async () => {
    const set = async (key, value, ttl) => {
      const r = await mf.dispatchFetch("http://local.test/__qa_state", {
        method: "POST",
        body: JSON.stringify({
          key,
          op: { kind: "set", value: String(value), ttl, nx: false },
        }),
      });
      assert.equal(r.status, 200);
    };
    const day = "portfolio:mail-day:" + Math.floor(Date.now() / 86400000),
      month = "portfolio:mail-30days:" + Math.floor(Date.now() / 2592000000),
      n = deliveries.size;
    await set(day, 50, 86401);
    assert.equal((await send({ ...base, id: randomUUID() })).status, 429);
    assert.equal(deliveries.size, n);
    await set(day, 0, 86401);
    await set(month, 900, 2592001);
    assert.equal((await send({ ...base, id: randomUUID() })).status, 429);
    assert.equal(deliveries.size, n);
  });
} finally {
  await mf.dispose();
  await fs.writeFile(
    path.join(out, "native-contact-qa.json"),
    JSON.stringify(
      {
        kind: "built Worker and real SQLite Durable Objects; Turnstile/Resend intercepted; NOT live delivery",
        results,
        uniqueFixtureMails: deliveries.size,
        externalHosts: [...new Set(calls)],
      },
      null,
      2,
    ) + "\n",
  );
}
