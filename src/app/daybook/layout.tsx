import Link from "next/link";
import { DaybookProvider } from "@/components/daybook/daybook-provider";
import { DaybookNav } from "@/components/daybook/daybook-nav";
import "./daybook.css";

/**
 * DAYBOOK's shell (指示書 §14).
 *
 * Both sides of the booking share one provider, because they share one set of
 * data. The point of the demo is that the customer's screen and the operator's
 * screen cannot disagree about who has agreed to what — putting them on
 * separate state would quietly undo that.
 */
export default function DaybookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DaybookProvider>
      <div className="daybook-page">
        <main id="main" className="daybook-main">
          <header className="daybook-hero">
            <p className="daybook-banner">
              <strong>架空のスタジオの予約体験です。</strong>{" "}
              {
                "実際の予約は入りません。メールも送られません。やりとりはこのブラウザの中だけに保存され、他の訪問者とは共有されません。"
              }
            </p>
            <h1>DAYBOOK</h1>
            <p>
              {
                "「その時間は埋まっています」で止まらない予約です。文章で受けた希望を営業時間・前後の準備時間・先約に照らして判定し、取れないときは実際に空いている時間を出します。確定するのは、予約者が合意し、お店が承認した時だけです。"
              }
            </p>
          </header>
          <DaybookNav />
          {children}
          <footer className="daybook-foot">
            <p className="daybook-fineprint">
              {
                "自主制作の体験です。空き判定・候補の並び・状態遷移はすべて決まった規則による処理で、AIは使っていません。読み取れなかった項目は、推測せずに読み取れなかったと表示します。"
              }{" "}
              <Link href="/demos/booking">この制作例について</Link>
            </p>
          </footer>
        </main>
      </div>
    </DaybookProvider>
  );
}
