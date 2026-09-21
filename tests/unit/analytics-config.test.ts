import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "jsonc-parser";

const read = (name: string) =>
  parse(fs.readFileSync(name, "utf8"), [], { allowTrailingComma: true });
const source = (name: string) => fs.readFileSync(name, "utf8");

describe("analytics configuration (A-03)", () => {
  it("keeps the browser switch and the Worker switch in step", () => {
    const production = read("wrangler.production.jsonc");
    const preview = read("wrangler.jsonc");
    expect(production.vars.ANALYTICS_ENABLED).toBe("true");
    expect(production.vars.NEXT_PUBLIC_ANALYTICS_ENABLED).toBe("true");
    expect(production.vars.POSTHOG_HOST).toBe("https://us.i.posthog.com");
    expect(preview.vars.ANALYTICS_ENABLED).toBe("false");
    expect(preview.vars.NEXT_PUBLIC_ANALYTICS_ENABLED).toBe("false");
    expect(preview.vars.POSTHOG_HOST).toBeUndefined();
    // The key is a Worker secret, never a var in this public repository.
    expect(production.vars.POSTHOG_PROJECT_KEY).toBeUndefined();
    expect(preview.vars.POSTHOG_PROJECT_KEY).toBeUndefined();
  });
  it("never gates the server's forwarding branch on a build-time constant", () => {
    const route = source("src/app/api/analytics/route.ts");
    // NEXT_PUBLIC_* is inlined into the bundle at build time: if the forwarding
    // branch depended on one, the deployed Worker would obey the build machine
    // and the bundler could delete the branch. This is how A-03 first failed.
    expect(route).not.toContain("NEXT_PUBLIC_ANALYTICS_ENABLED");
    expect(route).toContain("analyticsAllowed()");
    const lib = source("src/lib/analytics.ts");
    expect(lib).toContain('process.env.ANALYTICS_ENABLED === "true"');
    expect(lib).not.toContain("NEXT_PUBLIC_ANALYTICS_ENABLED");
  });
  it("leaves no diagnostic that could describe a secret", () => {
    const route = source("src/app/api/analytics/route.ts");
    for (const marker of [
      "x-diag",
      "key-present",
      "key-empty",
      "key-length",
      "POSTHOG_PROJECT_KEY.length",
      "POSTHOG_PROJECT_KEY.slice",
    ])
      expect(route).not.toContain(marker);
  });
  it("carries the forwarding branch into the built Worker when one exists", () => {
    const dist = "dist/server";
    if (!fs.existsSync(dist)) return; // only meaningful after a production build
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".js")) files.push(full);
      }
    };
    walk(dist);
    const chunk = files.find((f) =>
      fs.readFileSync(f, "utf8").includes("i/v0/e/"),
    );
    expect(
      chunk,
      "the built Worker has no analytics forwarding chunk",
    ).toBeDefined();
    const built = fs.readFileSync(chunk!, "utf8");
    // The three runtime lookups and the ingest allowlist must survive bundling.
    expect(built).toContain("process.env.POSTHOG_PROJECT_KEY");
    expect(built).toContain("process.env.POSTHOG_HOST");
    expect(built).toContain("process.env.ANALYTICS_ENABLED");
    expect(built).toContain("https://us.i.posthog.com");
    // Minified, the tail reads `{status:x.ok?202:502}`; assert the shape, not
    // a literal, so the test tracks the behaviour rather than the minifier.
    expect(built).toMatch(/status:[^}]*\?202:502/);
  });
});
