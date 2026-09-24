import { ReportTool } from "@/components/report/report-tool";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "REPORT FLOW — 毎週のCSVを、二回目から楽にする",
  "列の対応と加工ルールを一度決めて保存すると、次のファイルからは質問なしで集計し、前回との差と読み取れなかった行だけを表示します。ファイルは端末から出ません。",
  "/report",
);

export default function ReportPage() {
  return <ReportTool />;
}
