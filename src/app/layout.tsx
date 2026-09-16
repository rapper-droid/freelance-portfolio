import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteOrigin } from "@/lib/seo";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { Analytics } from "@/components/analytics";
import { Monitoring } from "@/components/monitoring";
import "./globals.css";
import "./hub.css";
import "./showcase.css";
import "./sales-ui.css";
import "./project-visuals.css";
import "./art-direction.css";
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
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "Web制作からAI業務自動化まで。設計・実装・テスト・納品を紹介する自主制作ポートフォリオ。",
  openGraph: {
    title: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ja_JP",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  // favicon.ico and apple-icon.png sit next to this file and are wired up by
  // Next's file convention; the manifest carries the 192/512/maskable sizes.
  manifest: "/site.webmanifest",
  applicationName: BRAND_NAME,
};

/**
 * The master icon's own field colour, measured from the image rather than
 * picked by eye, so the browser chrome meets the page without a seam.
 */
export const viewport: Viewport = {
  themeColor: "#0e0906",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.variable}>
        <a href="#main" className="skip-link">
          本文へスキップ
        </a>
        {children}
        <Analytics />
        <Monitoring />
      </body>
    </html>
  );
}
