import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath } from "node:url";

// This build path is additive: next dev/build and the Netlify fallback stay intact.
// No durable cache or paid image service is provisioned for the owner preview.
export default defineConfig({
  plugins: [
    {
      name: "workers-native-state-provider",
      enforce: "pre",
      load(id) {
        if (id.replaceAll("\\", "/").endsWith("/src/lib/state-provider.ts"))
          return `export { stateCommand } from ${JSON.stringify(fileURLToPath(new URL("./src/workers/state-provider.ts", import.meta.url)).replaceAll("\\", "/"))};`;
      },
    },
    vinext(),
    cloudflare({
      configPath:
        process.env.TSUDOWA_WORKERS_TARGET === "production"
          ? "wrangler.production.jsonc"
          : "wrangler.jsonc",
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
