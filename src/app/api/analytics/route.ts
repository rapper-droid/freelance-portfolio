import { analyticsEndpoint, posthogPayload } from "@/lib/analytics";
export async function POST(request: Request) {
  const endpoint = analyticsEndpoint(),
    key = process.env.POSTHOG_PROJECT_KEY;
  if (!endpoint || !key || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true")
    return new Response(null, { status: 204 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length")) > 1024)
    return new Response(null, { status: 413 });
  try {
    const text = await request.text();
    if (text.length > 1024) return new Response(null, { status: 413 });
    const payload = posthogPayload(JSON.parse(text), key, crypto.randomUUID());
    if (!payload) return new Response(null, { status: 400 });
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2500),
      redirect: "error",
    });
    return new Response(null, { status: upstream.ok ? 204 : 502 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
