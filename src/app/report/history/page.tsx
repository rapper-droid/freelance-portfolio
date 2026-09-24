import { HistoryPage } from "@/components/report/report-records";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "処理の履歴 — REPORT FLOW",
  "過去に処理したファイルの合計・集計件数・読み取れなかった行数と、使ったルールの版の記録です。次回の前回比はこの記録から計算されます。",
  "/report/history",
);

export default function Page() {
  return <HistoryPage />;
}
