import type { Metadata } from "next";
import { siteOrigin } from "@/lib/seo";
import { Analytics } from "@/components/analytics";
import { Monitoring } from "@/components/monitoring";
import "./globals.css";
import "./hub.css";
import "./showcase.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "WORKS | BUILD. AUTOMATE. DELIVER.",
    template: "%s | WORKS",
  },
  description:
    "Web制作からAI業務自動化まで。設計・実装・テスト・納品を紹介する自主制作ポートフォリオ。",
  openGraph: {
    title: "WORKS | BUILD. AUTOMATE. DELIVER.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ja_JP",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
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
