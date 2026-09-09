import { DemoShell } from "@/components/site";
import { CsvDemo } from "@/components/csv-demo";
export const metadata = {
  title: "CSV AUTOMATOR | CSV加工デモ",
  description:
    "CSVを読み込み、重複除去・整形・検索・集計・ダウンロードをブラウザで体験できる自主制作デモ。",
};
export default function Page() {
  return (
    <DemoShell
      number="01"
      title="CSV AUTOMATOR"
      lead="面倒なデータ整理を、ワンクリックで。"
      description="毎週の売上一覧、注文データ、顧客リスト。繰り返しているコピー＆ペーストや重複チェックを、ブラウザ上のシンプルな操作に置き換えます。"
      features={[
        "CSV読込・出力",
        "重複除去・表記統一",
        "検索・並び替え",
        "数値集計",
      ]}
    >
      <CsvDemo />
    </DemoShell>
  );
}
