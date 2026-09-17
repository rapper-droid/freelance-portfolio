import app from "./entry";
export * from "./entry";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.hostname === "www.tsudowa.com") {
      url.protocol = "https:";
      url.hostname = "tsudowa.com";
      url.port = "";
      return Response.redirect(url.href, 308);
    }
    // Worker-first is required for www redirects, including asset URLs.
    // Vinext expects static files to be handled by the assets binding first.
    let response: Response;
    if (request.method === "GET" || request.method === "HEAD") {
      const asset = await env.ASSETS.fetch(request);
      response =
        asset.status === 404 ? await app.fetch(request, env, ctx) : asset;
    } else {
      response = await app.fetch(request, env, ctx);
    }
    // Keep the candidate URL out of search; the real apex stays indexable.
    if (url.hostname.endsWith(".workers.dev")) {
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    return response;
  },
} satisfies ExportedHandler<Env>;
