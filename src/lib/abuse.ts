import { createHmac } from "node:crypto";
export function fingerprint(value: string) {
  const secret = process.env.RATE_LIMIT_SALT;
  if (!secret || secret.length < 32) throw new Error("rate_configuration");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export async function redis(...command: (string | number)[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !/^https:\/\/[a-z0-9-]+\.upstash\.io$/.test(url) || !token)
    throw new Error("rate_configuration");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(3000),
    // Workers supports manual, not error. The !ok guard below rejects every 3xx.
    redirect: "manual",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("rate_unavailable");
  const data = await response.json();
  if (data.error || !("result" in data)) throw new Error("rate_unavailable");
  return data.result;
}
// Atomic fixed windows shared by every server instance; Redis contains no raw IP or form input.
export async function quota(key: string, maximum: number, seconds: number) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const result = await redis(
    "EVAL",
    "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",
    1,
    `portfolio:${key}:${bucket}`,
    seconds + 1,
  );
  if (!Number.isInteger(result) || result < 1)
    throw new Error("rate_unavailable");
  return result <= maximum;
}
export function clientBucket(request: Request) {
  // Only trust the header overwritten by the selected host. Unknown hosts share a conservative bucket.
  const ip =
    process.env.NETLIFY === "true"
      ? request.headers.get("x-nf-client-connection-ip")
      : process.env.HOSTING_PLATFORM === "cloudflare"
        ? request.headers.get("cf-connecting-ip")
        : null;
  return fingerprint(ip || "shared-untrusted-host");
}
export async function limitedJson(
  request: Request,
  max: number,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("invalid_json");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_json");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new Error("body_too_large");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    reader.releaseLock();
  }
}
