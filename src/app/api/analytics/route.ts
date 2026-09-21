import { limitedJson, quota, clientBucket } from "@/lib/abuse";
import { reportFailure } from "@/lib/server-monitoring";
import {
  analyticsAllowed,
  analyticsEndpoint,
  posthogPayload,
  sessionId,
} from "@/lib/analytics";
export async function POST(request: Request) {
  // The server decides on its own runtime variable. NEXT_PUBLIC_* values are
  // inlined into the bundle at build time, so gating the forwarding branch on
  // one lets a build-time constant decide what the deployed Worker does — and
  // lets the bundler delete the branch entirely.
  const endpoint = analyticsEndpoint(),
    key = process.env.POSTHOG_PROJECT_KEY;
  if (!endpoint || !key || !analyticsAllowed())
    return new Response(null, { status: 204 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length")) > 1024)
    return new Response(null, { status: 413 });
  try {
    const value = await limitedJson(request, 1024);
    const payload = posthogPayload(
      value,
      key,
      sessionId(value) || crypto.randomUUID(),
    );
    if (!payload) return new Response(null, { status: 400 });
    if (
      !(await quota(`analytics-ip:${clientBucket(request)}`, 120, 600)) ||
      !(await quota("analytics-30days", 20000, 2592000))
    )
      return new Response(null, { status: 429 });
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2500),
      redirect: "manual",
    });
    if (!upstream.ok) await reportFailure("analytics_dependency");
    // 202: the event was forwarded and accepted. 204 (above) means nothing was
    // measured. The two were indistinguishable before, which hid a
    // misconfigured key behind an apparently healthy response.
    return new Response(null, { status: upstream.ok ? 202 : 502 });
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large")
      return new Response(null, { status: 413 });
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && error.message === "invalid_json")
    )
      return new Response(null, { status: 400 });
    await reportFailure("analytics_dependency");
    return new Response(null, { status: 503 });
  }
}
