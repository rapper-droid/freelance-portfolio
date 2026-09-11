import type { MetadataRoute } from "next";
import { categories, projects } from "@/lib/portfolio";
import { siteOrigin } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    ...categories.map((c) => `/works/${c.id}`),
    ...projects.flatMap((p) => [`/projects/${p.slug}`, `/demos/${p.slug}`]),
  ].map((path) => ({ url: new URL(path, siteOrigin()).href }));
}
