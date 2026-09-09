import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "WORKS | Web開発・業務自動化を、小さな改善から。",
    template: "%s | WORKS",
  },
  description:
    "Webサイトの修正、CSVデータ加工、問い合わせ整理、管理画面制作。実際に操作できる3つの自主制作デモで、小規模なWeb開発・業務自動化をご紹介します。",
  openGraph: {
    title: "WORKS | 小さな改善で、仕事はもっと軽くなる。",
    description: "Web開発・業務自動化。3つの実働デモをお試しください。",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "WORKS Web開発・業務自動化",
      },
    ],
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
      </body>
    </html>
  );
}
