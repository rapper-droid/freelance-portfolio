import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/site";
import { Contact } from "@/components/contact";
import { FlowExperience } from "@/components/flow/flow-experience";
import { notFound } from "next/navigation";
import { realUtilityEnabled } from "@/lib/runtime/feature";
import { modeNotice } from "@/lib/runtime/present";
import { pageMetadata } from "@/lib/seo";
import "@/components/portfolio-styles.css";
import "@/components/flow/flow.css";

/**
 * The sample experience (指示書 §05).
 *
 * The mode notice is built on the server from the environment, so what is and
 * is not connected is described by the deployment rather than by a paragraph
 * someone has to remember to update (指示書 A07, D02).
 */
export const metadata = pageMetadata(
  "仕事が進むところを見る｜問い合わせ・日程調整・定期報告",
  "架空スタジオのデータで、問い合わせ対応・日程調整・週次集計が実際に処理されるところを確認できます。登録も接続も不要。実AIや外部送信を使う工程は、使っていれば使っていると表示します。",
  "/flow",
);

export default function FlowPage() {
  // The rollback switch (指示書 D06): off removes the page entirely.
  if (!realUtilityEnabled()) notFound();
  const notice = modeNotice("sample");
  return (
    <>
      <Header />
      <main id="main" className="sales-ui">
        <div className="flow-stage">
          <div className="flow-inner">
            <div className="flow-head">
              <span className="eyebrow">TETSU WORKS / REAL UTILITY SAMPLE</span>
              <h1>
                入力する仕事を、減らす。
                <br />
                確かめるだけの仕事を、増やす。
              </h1>
              <p>
                {
                  "問い合わせ、日程調整、毎週の集計。いま使っている道具をつなぎ、繰り返す作業を先に進めます。下の3つから、いま困っている状況を選んでください。"
                }
              </p>
            </div>

            <FlowExperience notice={notice} />

            <div className="flow-controls">
              <Link href="/contact" className="flow-button">
                自分の作業に当てはめる{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/works#works" className="flow-button secondary">
                制作例のギャラリーを見る
              </Link>
            </div>

            <p className="flow-fineprint">
              {
                "ここで表示している時間・件数は、この架空データを処理した実測値です。導入後の削減時間や成果を示すものではありません。実際の業務での効果は、対象の業務・件数・例外の多さによって変わります。"
              }
            </p>
          </div>
        </div>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
