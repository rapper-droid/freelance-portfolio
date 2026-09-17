// Next.js / Netlify fallback. Vite substitutes a Workers-native implementation.
export async function stateCommand(...command: (string | number)[]) {
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
    redirect: "manual",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("rate_unavailable");
  const data = await response.json();
  if (data.error || !("result" in data)) throw new Error("rate_unavailable");
  return data.result;
}
