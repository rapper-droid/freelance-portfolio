/**
 * Which marketplace, if any, sent this visitor. Visitors who arrive from a
 * marketplace link (utm_source) are asked to keep the conversation and any
 * contract on that marketplace; the site then leads with "copy the brief"
 * instead of its own form. Only the marketplace id is stored, in session
 * storage, never a person, job or message.
 */
export const platformNames = {
  crowdworks: "CrowdWorks",
  lancers: "ランサーズ",
  coconala: "ココナラ",
} as const;
export type Platform = keyof typeof platformNames;
const KEY = "tsudowa-platform";
const TTL = 12 * 3600000;

export function platformFromSearch(search: string): Platform | null {
  const source = new URLSearchParams(search).get("utm_source");
  return source && Object.hasOwn(platformNames, source)
    ? (source as Platform)
    : null;
}

/** Store the marketplace named in the current URL; returns the active one. */
export function rememberPlatform(now = Date.now()): Platform | null {
  const found = platformFromSearch(location.search);
  if (found) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ platform: found, at: now }));
    } catch {
      /* Storage is optional. */
    }
    return found;
  }
  return currentPlatform(now);
}

export function currentPlatform(now = Date.now()): Platform | null {
  const here = platformFromSearch(location.search);
  if (here) return here;
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
    if (
      saved &&
      typeof saved.at === "number" &&
      now - saved.at < TTL &&
      Object.hasOwn(platformNames, saved.platform)
    )
      return saved.platform as Platform;
  } catch {
    /* Storage is optional. */
  }
  return null;
}
