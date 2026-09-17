import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
const sourcePath = path.resolve("src/workers/contact-state.ts");
const source = await fs.readFile(sourcePath, "utf8");
const out = path.resolve("../../outputs/workers-performance-contact-20260917");
await fs.mkdir(out, { recursive: true });
const results = [];
const mutations = [
  ["baseline", (s) => s],
  [
    "nx-disabled",
    (s) =>
      s.replace(
        /op\.kind\s*===\s*["']set["']\s*&&\s*op\.nx\s*&&\s*row/,
        "false",
      ),
  ],
  [
    "expiry-extended",
    (s) => s.replace(/now\s*\+\s*op\.ttl\s*\*\s*1000/, "now+86400000"),
  ],
  [
    "unlock-unchecked",
    (s) =>
      s
        .replace(/row\.value\s*!==\s*op\.token/, "false")
        .replace("WHERE id=1 AND value=?", "WHERE id=1 AND ? IS NOT NULL"),
  ],
  [
    "counter-disabled",
    (s) => s.replace(/Number\(row\?\.value\s*\?\?\s*0\)\s*\+\s*1/, "1"),
  ],
];
for (const [name, mutate] of mutations) {
  const changed = mutate(source);
  if (name !== "baseline" && changed === source)
    throw Error("Mutation did not apply: " + name);
  const bundled = await build({
    stdin: {
      contents: `import {ContactState} from './contact-state';export {ContactState};export default {async fetch(request,env){try{const {key,op}=await request.json();return Response.json(await env.STATE.getByName(key).execute(op));}catch{return new Response('state unavailable',{status:503});}}};`,
      resolveDir: path.dirname(sourcePath),
      sourcefile: "state-qa-entry.ts",
      loader: "ts",
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "neutral",
    external: ["cloudflare:workers"],
    plugins: [
      {
        name: "qa-mutation",
        setup(b) {
          b.onLoad({ filter: /contact-state\.ts$/ }, () => ({
            contents: changed,
            loader: "ts",
          }));
        },
      },
    ],
  });
  const options = convertV4MiniflareOptions({
    name: "state-qa",
    modulesRoot: out,
    modules: [
      {
        type: "ESModule",
        path: path.join(out, "state-qa-entry.js"),
        contents: bundled.outputFiles[0].text,
      },
    ],
    compatibilityDate: "2026-09-17",
    compatibilityFlags: ["nodejs_compat"],
    durableObjects: { STATE: { className: "ContactState", useSQLite: true } },
  });
  const mf = new Miniflare(options);
  let failure = null;
  const tests = [];
  const call = async (key, op) => {
    const r = await mf.dispatchFetch("http://local.test/state", {
      method: "POST",
      body: JSON.stringify({ key, op }),
    });
    if (!r.ok) throw Error("State HTTP " + r.status);
    return r.json();
  };
  const check = async (label, fn) => {
    await fn();
    tests.push(label);
  };
  try {
    await check("concurrent NX grants one lease", async () => {
      const r = await Promise.all(
        Array.from({ length: 24 }, (_, i) =>
          call("lock", { kind: "set", value: "token-" + i, ttl: 90, nx: true }),
        ),
      );
      assert.equal(r.filter((x) => x === "OK").length, 1);
    });
    await check("wrong-token unlock cannot delete a lease", async () => {
      await call("owned", { kind: "set", value: "owner", ttl: 90, nx: true });
      assert.equal(
        await call("owned", { kind: "unlock", token: "intruder" }),
        0,
      );
      assert.equal(await call("owned", { kind: "get" }), "owner");
      assert.equal(await call("owned", { kind: "unlock", token: "owner" }), 1);
    });
    await check(
      "atomic quota increments preserve all concurrent requests",
      async () => {
        const values = await Promise.all(
          Array.from({ length: 40 }, () =>
            call("quota", { kind: "increment", ttl: 600 }),
          ),
        );
        assert.deepEqual(
          values.sort((a, b) => a - b),
          Array.from({ length: 40 }, (_, i) => i + 1),
        );
      },
    );
    await check(
      "expiry releases a lease and old token cannot delete replacement",
      async () => {
        await call("ttl", { kind: "set", value: "old", ttl: 1, nx: true });
        await new Promise((r) => setTimeout(r, 1200));
        assert.equal(await call("ttl", { kind: "get" }), null);
        assert.equal(
          await call("ttl", { kind: "set", value: "new", ttl: 90, nx: true }),
          "OK",
        );
        assert.equal(await call("ttl", { kind: "unlock", token: "old" }), 0);
        assert.equal(await call("ttl", { kind: "get" }), "new");
      },
    );
    await check("storage survives worker reload", async () => {
      await call("persistent", {
        kind: "set",
        value: "digest",
        ttl: 604800,
        nx: true,
      });
      await mf.setOptions({
        ...options,
        workers: options.workers.map((worker) => ({
          ...worker,
          config: {
            ...worker.config,
            env: {
              ...worker.config.env,
              QA_RELOAD: { type: "text", value: "changed" },
            },
          },
        })),
      });
      assert.equal(await call("persistent", { kind: "get" }), "digest");
    });
    await check("invalid TTL is rejected", async () => {
      await assert.rejects(() =>
        call("invalid", { kind: "set", value: "x", ttl: 0, nx: false }),
      );
    });
  } catch (e) {
    failure = e.message;
  } finally {
    await mf.dispose();
  }
  results.push({
    name,
    testsPassed: tests,
    failure,
    expected: name === "baseline" ? "PASS" : "REJECT",
  });
  console.log(
    JSON.stringify({ name, passed: tests.length, rejected: !!failure }),
  );
  if ((name === "baseline" && failure) || (name !== "baseline" && !failure))
    throw Error("Safety mutation result unexpected: " + name + " " + failure);
}
await fs.writeFile(
  path.join(out, "native-state-qa.json"),
  JSON.stringify(
    {
      kind: "real SQLite Durable Objects in workerd; no external network",
      results,
    },
    null,
    2,
  ) + "\n",
);
