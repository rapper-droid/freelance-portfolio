import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  return origin
    ? ["/", "/demos/csv", "/demos/inbox", "/demos/admin"].map((path) => ({
        url: new URL(path, origin).href,
      }))
    : [];
}
