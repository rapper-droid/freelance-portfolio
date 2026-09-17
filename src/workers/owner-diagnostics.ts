import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { validateContact, contactPayload } from "../lib/contact";

// Temporary, preview-only. No mail provider, receipt allocation, or contact POST imports.
export const OWNER_HOST = "tsudowa-owner-preview.tetsuyasmile52l.workers.dev";
export const OWNER_RECEIPT = "TSW-260917-350B4FF8D9";
export const OWNER_REQUEST = "aad7daa5-7b9d-4ff8-acb4-97a199c4fc92";
export const OWNER_BASE = "portfolio:submission:" + OWNER_REQUEST;
export const OWNER_KEYS = [
  "portfolio:receipt:" + OWNER_RECEIPT,
  OWNER_BASE,
  OWNER_BASE + ":receipt",
  OWNER_BASE + ":owner",
  OWNER_BASE + ":confirmation",
  OWNER_BASE + ":lock",
] as const;
const PREFIX = "/__owner-diagnostics";
export function diagnosticsEnabled(env: Env) {
  return (
    env.OWNER_DIAGNOSTICS_ENABLED === "true" &&
    env.OWNER_REVIEW === "true" &&
    env.CONTACT_ORIGIN === "https://" + OWNER_HOST &&
    env.HOSTING_PLATFORM === "cloudflare"
  );
}
const respond = (status: number, body: object) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
async function boundedBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw Error("invalid");
  const reader = request.body?.getReader();
  if (!reader) throw Error("invalid");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw Error("invalid");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    reader.releaseLock();
  }
}
export async function inspectOwner(env: Env) {
  const rows = await Promise.all(
    OWNER_KEYS.map((key) => env.CONTACT_STATE.getByName(key).ownerInspect(key)),
  );
  const [mapping, digest, receipt, owner, confirmation, lock] = rows;
  const meta = receipt?.value ? JSON.parse(receipt.value) : null;
  const active = (row: typeof digest) => !!row && row.expires > Date.now();
  return {
    receiptId: OWNER_RECEIPT,
    requestId: OWNER_REQUEST,
    receiptMappingMatches: active(mapping) && mapping!.value === OWNER_REQUEST,
    receiptMatches: active(receipt) && meta?.receipt === OWNER_RECEIPT,
    createdAt: typeof meta?.receivedAt === "string" ? meta.receivedAt : null,
    fingerprint:
      active(digest) && /^[a-f0-9]{64}$/.test(digest!.value)
        ? digest!.value
        : null,
    idempotencyRecord: active(digest),
    adminMailSent: active(owner) && owner!.value === "1",
    autoReplySent: active(confirmation) && confirmation!.value === "1",
    lockActive: active(lock),
    // The production schema does not persist a historical duplicate counter.
    duplicateCount: null,
    duplicateCountReason: "not_recorded_by_application",
    records: rows.map((row, i) => ({
      key: OWNER_KEYS[i],
      exists: !!row,
      active: active(row),
      expiresAt: row ? new Date(row.expires).toISOString() : null,
      ttlSeconds: row
        ? Math.max(0, Math.floor((row.expires - Date.now()) / 1000))
        : null,
    })),
  };
}
export async function ownerDiagnostics(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!(url.pathname === PREFIX || url.pathname.startsWith(PREFIX + "/")))
    return null;
  if (
    url.protocol !== "https:" ||
    url.hostname !== OWNER_HOST ||
    url.port ||
    url.search ||
    !diagnosticsEnabled(env)
  )
    return respond(404, { code: "not_found" });
  try {
    const count = await env.CONTACT_STATE.getByName(
      "portfolio:owner-diagnostics:rate:" + Math.floor(Date.now() / 60000),
    ).execute({ kind: "increment", ttl: 61 });
    if (typeof count !== "number" || count < 1) throw Error("state");
    if (count > 30) return respond(429, { code: "rate" });
    const expected = process.env.OWNER_DIAGNOSTICS_SECRET;
    if (!expected || expected.length < 64)
      return respond(404, { code: "not_found" });
    const actual = request.headers.get("authorization") || "";
    if (
      !timingSafeEqual(
        createHash("sha256").update(actual).digest(),
        createHash("sha256")
          .update("Bearer " + expected)
          .digest(),
      )
    )
      return respond(404, { code: "not_found" });
    if (request.method === "GET" && url.pathname === PREFIX + "/inspect")
      return respond(200, await inspectOwner(env));
    if (request.method === "GET" && url.pathname === PREFIX) {
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (!siteKey) return respond(503, { code: "unavailable" });
      const nonce = crypto.randomUUID();
      return new Response(
        `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="robots" content="noindex"><title>OWNER duplicate verification</title><body><h1>既存受付の重複防止確認</h1><p>対象 ${OWNER_RECEIPT}。メールは送信しません。</p><div id="challenge"></div><pre id="result">本人確認待ち</pre><script nonce="${nonce}">window.ownerReady=()=>{turnstile.render('#challenge',{sitekey:${JSON.stringify(siteKey)},action:'contact',callback:async token=>{try{const r=await fetch('${PREFIX}/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...window.ownerDiagnosticPayload,token})});const result=await r.json();window.ownerDiagnosticResult={status:r.status(),...result};document.querySelector('#result').textContent=JSON.stringify(window.ownerDiagnosticResult,null,2);}catch{document.querySelector('#result').textContent='verification unavailable';}},'error-callback':()=>{document.querySelector('#result').textContent='Turnstile verification failed';}});};</script><script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=ownerReady&render=explicit" async defer></script></body></html>`,
        {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex, nofollow, noarchive",
            "Referrer-Policy": "no-referrer",
            "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'`,
          },
        },
      );
    }
    if (request.method !== "POST" || url.pathname !== PREFIX + "/replay")
      return respond(404, { code: "not_found" });
    if (request.headers.get("origin") !== "https://" + OWNER_HOST)
      return respond(403, { code: "origin" });
    let value;
    try {
      value = validateContact(await boundedBody(request));
    } catch {
      return respond(400, { code: "invalid" });
    }
    if (!value) return respond(400, { code: "invalid" });
    if (value.id !== OWNER_REQUEST)
      return respond(409, { code: "request_mismatch" });
    const salt = process.env.RATE_LIMIT_SALT,
      secret = process.env.TURNSTILE_SECRET;
    if (!salt || salt.length < 32 || !secret) throw Error("configuration");
    const before = await inspectOwner(env);
    const digest = createHmac("sha256", salt)
      .update(JSON.stringify(contactPayload(value)))
      .digest("hex");
    if (before.fingerprint !== digest)
      return respond(409, { code: "fingerprint_mismatch" });
    if (
      !before.receiptMappingMatches ||
      !before.receiptMatches ||
      !before.idempotencyRecord ||
      !before.adminMailSent ||
      !before.autoReplySent ||
      before.lockActive
    )
      return respond(409, { code: "not_completed" });
    const check = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({ secret, response: value.token }),
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!check.ok) throw Error("verification");
    const verified = await check.json<{
      success?: boolean;
      action?: string;
      hostname?: string;
      challenge_ts?: string;
    }>();
    const age = Date.now() - Date.parse(verified.challenge_ts || "");
    if (
      verified.success !== true ||
      verified.action !== "contact" ||
      verified.hostname !== OWNER_HOST ||
      !Number.isFinite(age) ||
      age < -30000 ||
      age > 300000
    )
      return respond(403, { code: "spam" });
    // Re-read after external I/O. No mutation/lock/receipt allocation/mail is possible here.
    const after = await inspectOwner(env);
    if (
      after.fingerprint !== digest ||
      !after.receiptMappingMatches ||
      !after.receiptMatches ||
      !after.adminMailSent ||
      !after.autoReplySent ||
      after.lockActive
    )
      return respond(409, { code: "state_changed" });
    return respond(200, {
      code: "accepted",
      duplicate: true,
      idempotent: true,
      receipt: OWNER_RECEIPT,
      requestId: OWNER_REQUEST,
      confirmation: "sent",
      fingerprint: digest,
      turnstile: {
        success: true,
        action: verified.action,
        hostname: verified.hostname,
        challengeAt: verified.challenge_ts,
      },
      newReceipts: 0,
      adminMailSends: 0,
      autoReplySends: 0,
    });
  } catch {
    return respond(503, { code: "unavailable" });
  }
}
