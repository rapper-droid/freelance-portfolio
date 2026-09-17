import "@/components/portfolio-styles.css";
import { pageMetadata } from "@/lib/seo";
import { DemoShell } from "@/components/site";
import "@/components/demo-identities.css";
import { AdminDemo } from "@/components/admin-demo";
export const metadata = pageMetadata(
  "ADMIN DASHBOARD | 顧客管理デモ",
  "顧客の追加・編集・削除、ステータス管理、売上集計と履歴を備えた自主制作の管理画面。",
  "/demos/admin",
);
export default function Page() {
  return (
    <DemoShell
      number="03"
      title="ADMIN DASHBOARD"
      lead="顧客も売上も、ひと目でわかる管理画面。"
      description="散らばっている顧客情報や取引状況をひとつの画面へ。小規模チームの顧客台帳や案件管理を想定し、情報の更新と集計をスムーズにするデモです。"
      features={[
        "顧客の追加・編集・削除",
        "検索・ステータス絞り込み",
        "KPI・操作履歴",
        "localStorage保存",
      ]}
    >
      <AdminDemo />
    </DemoShell>
  );
}
