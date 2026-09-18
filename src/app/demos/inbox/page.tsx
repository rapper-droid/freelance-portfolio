import "@/components/portfolio-styles.css";
import { pageMetadata } from "@/lib/seo";
import { DemoShell } from "@/components/demo-frame";
import "@/components/demo-identities.css";
import { InboxDemo } from "@/components/inbox-demo";
export const metadata = pageMetadata(
  "SMART INBOX | 問い合わせ整理デモ",
  "問い合わせのカテゴリ・緊急度をルールで分類。担当状況と返信案生成を試せる自主制作デモ。",
  "/demos/inbox",
);
export default function Page() {
  return (
    <DemoShell
      number="02"
      title="SMART INBOX"
      lead="読む前に整理。対応すべきことが、すぐわかる。"
      description="請求・不具合・契約などの問い合わせをキーワードで自動分類。優先度と担当を整理し、返信の下書きまで一画面で進められます。カスタマーサポートや社内窓口を想定したデモです。"
      features={[
        "ルールによる自動分類",
        "緊急度判定",
        "担当・対応状況管理",
        "返信案生成（API不使用）",
      ]}
    >
      <InboxDemo />
    </DemoShell>
  );
}
