import Link from "next/link";
import { ReportProvider } from "@/components/report/report-provider";
import { ReportNav } from "@/components/report/report-nav";
import "./report.css";

/**
 * REPORT FLOW's shell (指示書 §15).
 *
 * Unlike KISSA and FORME this is not a fictional business — it is a tool, and
 * the file it processes is the visitor's own. So the banner says the thing
 * that actually matters here: nothing leaves the browser. That is a promise
 * about where data goes, not a disclaimer about a pretend shop.
 */
export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReportProvider>
      <div className="report-page">
        <main id="main" className="report-main">
          <header className="report-hero">
            <p className="report-notice">
              <strong>読み込んだファイルは、この端末から出ません。</strong>{" "}
              {
                "サーバーへの送信も、外部サービスへの連携もありません。作ったルールと処理履歴は、このブラウザの中だけに保存されます。"
              }
            </p>
            <h1>REPORT FLOW</h1>
            <p>
              {
                "毎週のCSVを、毎週ゼロから説明し直さないための道具です。1回目に列の意味を決めて保存すると、2回目からは同じファイル形式なら質問なしで集計し、前回との差と、読み取れなかった行だけを見せます。"
              }
            </p>
          </header>
          <ReportNav />
          {children}
          <footer className="report-foot">
            <p className="report-fineprint">
              {
                "自主制作のツールです。計算・並び替え・集計は決定的な処理で、AIは使っていません。増減の理由を断定することもしません。"
              }{" "}
              <Link href="/demos/csv">この制作例について</Link>
            </p>
          </footer>
        </main>
      </div>
    </ReportProvider>
  );
}
