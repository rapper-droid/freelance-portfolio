import { randomBytes, randomUUID } from "node:crypto";
import {
  validateContact,
  contactConfigured,
  contactPayload,
} from "@/lib/contact";
import { internalMail, receiptMail, type Receipt } from "@/lib/contact-mail";
import {
  clientBucket,
  fingerprint,
  limitedJson,
  quota,
  redis,
} from "@/lib/abuse";
import { reportFailure } from "@/lib/server-monitoring";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const TTL = 7 * 86400;
const reply = (status: number, code: string, receipt?: string) =>
  Response.json(
    {
      code,
      ...(receipt ? { receipt } : {}),
      ...(code === "accepted" ? { confirmation: "sent" } : {}),
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(code === "rate"
          ? { "Retry-After": "600" }
          : code === "pending"
            ? { "Retry-After": "90" }
            : {}),
      },
    },
  );
export async function GET() {
  const enabled = contactConfigured();
  return Response.json(
    {
      enabled,
      ...(enabled
        ? { siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY }
        : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  if (!contactConfigured()) return reply(503, "unavailable");
  let site: URL;
  try {
    site = new URL(process.env.NEXT_PUBLIC_SITE_URL!);
  } catch {
    return reply(503, "unavailable");
  }
  if (request.headers.get("origin") !== site.origin)
    return reply(403, "origin");
  let value;
  try {
    value = validateContact(await limitedJson(request, 16384));
  } catch {
    return reply(400, "invalid");
  }
  if (!value) return reply(400, "invalid");
  let lockKey = "",
    lockToken = "";
  let ownerAccepted = false;
  let receipt: Receipt | undefined;
  try {
    if (!(await quota("contact-ip:" + clientBucket(request), 5, 600)))
      return reply(429, "rate");
    const check = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET!,
          response: value.token,
        }),
        signal: AbortSignal.timeout(5000),
        redirect: "manual",
      },
    );
    if (!check.ok) throw new Error("dependency");
    const verification = await check.json();
    if (
      verification.success !== true ||
      verification.action !== "contact" ||
      verification.hostname !== site.hostname
    )
      return reply(403, "spam");
    const key = "portfolio:submission:" + value.id;
    const digest = fingerprint(JSON.stringify(contactPayload(value)));
    const existing = await redis("GET", key);
    if (existing && existing !== digest) return reply(409, "conflict");
    if (
      !existing &&
      (await redis("SET", key, digest, "NX", "EX", TTL)) !== "OK"
    )
      return reply(409, "pending");
    const token = randomUUID();
    if ((await redis("SET", key + ":lock", token, "NX", "EX", 90)) !== "OK")
      return reply(409, "pending");
    lockKey = key + ":lock";
    lockToken = token;
    const meta = await redis("GET", key + ":receipt");
    if (meta) {
      receipt = JSON.parse(String(meta));
      if (
        !receipt ||
        !/^TSW-\d{6}-[A-F0-9]{10}$/.test(receipt.receipt) ||
        !Number.isFinite(Date.parse(receipt.receivedAt))
      )
        throw new Error("state");
    } else {
      const receivedAt = new Date().toISOString();
      const day = receivedAt.slice(2, 10).replaceAll("-", "");
      for (let i = 0; i < 8; i++) {
        const candidate =
          "TSW-" + day + "-" + randomBytes(5).toString("hex").toUpperCase();
        // Atomic reservation prevents collisions for the entire dated receipt window.
        if (
          (await redis(
            "SET",
            "portfolio:receipt:" + candidate,
            value.id,
            "NX",
            "EX",
            TTL,
          )) === "OK"
        ) {
          receipt = { receipt: candidate, receivedAt };
          break;
        }
      }
      if (!receipt) throw new Error("receipt");
      if (
        (await redis(
          "SET",
          key + ":receipt",
          JSON.stringify(receipt),
          "EX",
          TTL,
        )) !== "OK"
      )
        throw new Error("state");
    }
    ownerAccepted = !!(await redis("GET", key + ":owner"));
    const confirmed = !!(await redis("GET", key + ":confirmation"));
    if (ownerAccepted && confirmed)
      return reply(200, "accepted", receipt.receipt);
    // Provider keys live for 24h. Never risk a fresh send after that window.
    if (Date.now() - Date.parse(receipt.receivedAt) > 23 * 3600000)
      return reply(409, "expired", receipt.receipt);
    for (const phase of ["owner", "confirmation"] as const) {
      if (phase === "owner" ? ownerAccepted : confirmed) continue;
      if (
        !(await quota("mail-day", 50, 86400)) ||
        !(await quota("mail-30days", 900, 2592000))
      )
        return reply(
          429,
          ownerAccepted ? "receipt_pending" : "capacity",
          receipt.receipt,
        );
      const mail =
        phase === "owner"
          ? internalMail(value, receipt)
          : receiptMail(value, receipt);
      const result = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": "tsudowa-" + value.id + "-" + phase,
        },
        body: JSON.stringify({
          from: "TSUDOWA <" + process.env.CONTACT_FROM_EMAIL + ">",
          to: [phase === "owner" ? process.env.CONTACT_TO_EMAIL : value.email],
          reply_to:
            phase === "owner" ? value.email : process.env.CONTACT_TO_EMAIL,
          ...mail,
        }),
        signal: AbortSignal.timeout(8000),
        redirect: "manual",
      });
      if (!result.ok || typeof (await result.json()).id !== "string")
        throw new Error("dependency");
      if (phase === "owner") ownerAccepted = true;
      if ((await redis("SET", key + ":" + phase, "1", "EX", TTL)) !== "OK")
        throw new Error("state");
    }
    console.info(JSON.stringify({ event: "contact_accepted" }));
    return reply(200, "accepted", receipt.receipt);
  } catch {
    await reportFailure("contact_dependency");
    return reply(
      503,
      ownerAccepted ? "receipt_pending" : "unavailable",
      receipt?.receipt,
    );
  } finally {
    if (lockKey) {
      try {
        await redis(
          "EVAL",
          "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",
          1,
          lockKey,
          lockToken,
        );
      } catch {
        /* 90s lease expires; never unlock someone else's attempt. */
      }
    }
  }
}
