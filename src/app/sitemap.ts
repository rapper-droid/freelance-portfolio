import type { MetadataRoute } from "next";
import { categories, projects } from "@/lib/portfolio";
import { publishedOffers } from "@/lib/offers";
import { siteOrigin } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/privacy",
    "/works",
    "/services",
    ...publishedOffers.map((o) => `/services/${o.slug}`),
    "/partners",
    "/rescue",
    "/contact",
    "/contact/general",
    "/lab",
    "/history",
    ...categories.map((c) => `/works/${c.id}`),
    ...projects.flatMap((p) => [`/projects/${p.slug}`, `/demos/${p.slug}`]),
  ].map((path) => ({ url: new URL(path, siteOrigin()).href }));
}
