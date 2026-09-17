import app from "vinext/server/fetch-handler";
import { responsivePath } from "./responsive-images";
export * from "vinext/server/fetch-handler";
export { ContactState } from "./contact-state";
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const asset = responsivePath(new URL(request.url));
    if (asset && (request.method === "GET" || request.method === "HEAD")) {
      const response = await env.ASSETS.fetch(
        new Request(new URL(asset, request.url), request),
      );
      if (!response.ok)
        return new Response("Image unavailable", { status: 503 });
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "public, max-age=3600");
      headers.set("X-Image-Strategy", "build-time-webp");
      return new Response(response.body, { status: response.status, headers });
    }
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
