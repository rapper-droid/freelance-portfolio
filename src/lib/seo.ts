import type { Metadata } from "next";
export function siteOrigin() {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) return "http://localhost:3000";
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin");
  return url.origin;
}
export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      locale: "ja_JP",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: "WORKS — BUILD. AUTOMATE. DELIVER.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}
