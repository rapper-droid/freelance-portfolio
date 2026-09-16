import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteOrigin } from "@/lib/seo";
import { BRAND_NAME, BRAND_READING, BRAND_TAGLINE } from "@/lib/brand";
import { Analytics } from "@/components/analytics";
import { Monitoring } from "@/components/monitoring";
import { Effects } from "@/components/effects";
import "./globals.css";
import "./hub.css";
import "./showcase.css";
import "./sales-ui.css";
import "./project-visuals.css";
import "./art-direction.css";
import "./works-diagrams.css";
import "./cafe-demo.css";
import "./tsudowa-effects.css";
import "./tsudowa-brand.css";
import "./premium.css";

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-sales",
  display: "swap",
  adjustFontFallback: false,
  weight: "100 900",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

const description =
  "TSUDOWAは、人・技術・作品・事業が集まり、つくり、次へ広がる親ブランドです。TETSU WORKSの制作・自動化サービスと制作デモを紹介します。";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description,
  openGraph: {
    title: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    description:
      "人・技術・作品・事業が集まり、つくり、次へ広がる。TETSU WORKSとTSUKUTTA LABをつなぐ親ブランド。",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ja_JP",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  manifest: "/site.webmanifest",
  applicationName: BRAND_NAME,
};

export const viewport: Viewport = { themeColor: "#090300" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const origin = siteOrigin();
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: BRAND_NAME,
    alternateName: BRAND_READING,
    description,
    inLanguage: "ja-JP",
  };

  return (
    <html lang="ja">
      <body className={inter.variable}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData).replace(
              /</g,
              "\\u003c",
            ),
          }}
        />
        <a href="#main" className="skip-link">
          本文へスキップ
        </a>
        {children}
        <Effects />
        <Analytics />
        <Monitoring />
      </body>
    </html>
  );
}
