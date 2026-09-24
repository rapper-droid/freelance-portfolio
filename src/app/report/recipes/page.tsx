import { RecipesPage } from "@/components/report/report-records";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "保存したルール — REPORT FLOW",
  "列の対応・通貨・重複条件・承認済みの税区分を保存したルールの一覧です。列名が一致すれば、順番が変わっても次のファイルに自動で当たります。",
  "/report/recipes",
);

export default function Page() {
  return <RecipesPage />;
}
