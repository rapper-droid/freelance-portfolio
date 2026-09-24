import Link from "next/link";
import { AutomationConsole } from "@/components/automation/automation-console";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Automation / API の技術画面 — 計画・承認・冪等性・失敗",
  "RELAY と同じ実行基盤を、実行計画・payloadHash・idempotencyKey・承認の紐づけ・失敗と結果不明・再実行の粒度で確認できる技術入口です。任意コードの実行も任意URLの取得もありません。",
  "/automation",
);

/**
 * The technical entry (指示書 §17).
 *
 * It sits at its own address rather than inside the RELAY demo because the
 * audience is different: somebody deciding whether the execution model is
 * sound, not somebody seeing what the product feels like. The two screens run
 * the same workflow and say so to each other.
 */
export default function AutomationPage() {
  return (
    <div className="auto-page">
      <main id="main" className="auto-main">
        <header className="auto-hero">
          <p className="auto-banner">
            <strong>
              実行はこの端末の中の模擬アダプターに対して行います。
            </strong>{" "}
            {
              "メール送信・予約確定など外へ出る操作は、計画と承認までで実行されません。任意のコード実行も、任意のURL取得もありません。"
            }
          </p>
          <h1>Automation / API</h1>
          <p>
            {
              "RELAY が動くときに何が起きているかを、業務の言葉ではなく契約で見る画面です。入力から、抽出の根拠、実行計画、承認の紐づけ、失敗と「結果が分からない」の違い、再実行の扱い、記録まで、同じ 1 回の実行を追えます。"
            }
          </p>
          <p className="auto-note">
            {"業務側の見え方は "}
            <Link href="/demos/automation">RELAY のデモ</Link>
            {" に、日々の運用画面は "}
            <Link href="/demos/inbox">SMART INBOX</Link>
            {" にあります。"}
          </p>
        </header>
        <AutomationConsole />
      </main>
    </div>
  );
}
