import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
const out = path.resolve("../../outputs/master-hq/verify");
await fs.mkdir(out, { recursive: true });
const results = [];
for (const step of ["lint", "typecheck", "test", "build"]) {
  const started = Date.now();
  let output = "",
    status = 0;
  try {
    output = execFileSync(
      process.env.ComSpec || "cmd.exe",
      ["/d", "/c", "npm.cmd run " + step],
      {
        encoding: "utf8",
        maxBuffer: 20e6,
        windowsHide: true,
        env: {
          ...process.env,
          CONTACT_ENABLED: "false",
          ANALYTICS_ENABLED: "false",
          NEXT_PUBLIC_SITE_URL: "https://tsudowa.com",
        },
      },
    );
  } catch (error) {
    output = String(error.stdout || "") + "\n" + String(error.stderr || "");
    status = error.status ?? 1;
  }
  await fs.writeFile(path.join(out, step + ".log"), output);
  results.push({ step, status, durationMs: Date.now() - started });
  console.log(JSON.stringify(results.at(-1)));
  await fs.writeFile(
    path.join(out, "summary.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        head: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        results,
      },
      null,
      2,
    ),
  );
  if (status) process.exit(status);
}
