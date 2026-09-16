import {
  validateContact,
  contactConfigured,
  contactEmailText,
  headerSafe,
} from "@/lib/contact";
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
const reply = (status: number, code: string) =>
  Response.json(
    { code },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(status === 429 || status === 409 ? { "Retry-After": "60" } : {}),
      },
    },
  );
export async function GET() {
  return Response.json(
    {
      enabled: contactConfigured(),
      ...(contactConfigured()
        ? { siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY }
        : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  if (!contactConfigured()) return reply(503, "unavailable");
  if (
    request.headers.get("origin") !==
    new URL(process.env.NEXT_PUBLIC_SITE_URL!).origin
  )
    return reply(403, "origin");
  let value;
  try {
    value = validateContact(await limitedJson(request, 16384));
  } catch {
    return reply(400, "invalid");
  }
  if (!value) return reply(400, "invalid");
  try {
    if (!(await quota(`contact-ip:${clientBucket(request)}`, 5, 600)))
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
        redirect: "error",
      },
    );
    if (!check.ok) throw new Error("dependency");
    const verification = await check.json();
    if (
      verification.success !== true ||
      verification.action !== "contact" ||
      verification.hostname !==
        new URL(process.env.NEXT_PUBLIC_SITE_URL!).hostname
    )
      return reply(403, "spam");
    const { email, detail, kind, budget, name, company, page, id } = value;
    // Name and company are part of the submission, so a resend with a
    // different name under the same id is a changed payload, not a duplicate.
    const digest = fingerprint(
      JSON.stringify({ email, detail, kind, budget, name, company }),
    );
    const key = `portfolio:submission:${id}`;
    const existing = await redis("GET", key);
    if (existing && existing !== digest) return reply(409, "conflict");
    if (existing === digest && (await redis("GET", `${key}:done`)))
      return reply(200, "accepted");
    if (
      !existing &&
      (await redis("SET", key, digest, "NX", "EX", 86400)) !== "OK"
    )
      return reply(409, "pending");
    if ((await redis("SET", `${key}:lock`, "1", "NX", "EX", 60)) !== "OK")
      return reply(409, "pending");
    // Hard caps are below Resend Free. Retries also consume quota: fail conservatively.
    if (
      !(await quota("mail-day", 50, 86400)) ||
      !(await quota("mail-30days", 900, 2592000))
    )
      return reply(429, "capacity");
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `portfolio-${id}`,
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM,
        to: [process.env.CONTACT_TO],
        // Replying to the notification reaches the person who wrote in.
        reply_to: email,
        // headerSafe: kind is user input and a subject line is a header.
        subject: `TANEBI WORKS: ${headerSafe(kind)}のご相談（${headerSafe(name)}様）`,
        text: contactEmailText({
          name,
          email,
          company,
          kind,
          budget,
          detail,
          page,
          id,
          receivedAt: new Date().toISOString(),
        }),
      }),
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (!result.ok || typeof (await result.json()).id !== "string")
      throw new Error("dependency");
    await redis("SET", `${key}:done`, "1", "EX", 86400);
    console.info(JSON.stringify({ event: "contact_accepted" }));
    return reply(200, "accepted");
  } catch {
    await reportFailure("contact_dependency");
    return reply(503, "unavailable");
  }
}
