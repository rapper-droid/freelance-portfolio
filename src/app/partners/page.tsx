import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Header, Footer } from "@/components/site";
import { OfferBrief } from "@/components/offer-brief";
import { contactKinds } from "@/lib/contact-options";
import { publishedOffers } from "@/lib/offers";
import { pageMetadata } from "@/lib/seo";
import type { BriefQuestion } from "@/lib/brief";
import "@/components/portfolio-styles.css";
import "@/components/offers.css";

export const metadata = pageMetadata(
  "制作会社・デザイナーの方へ｜実装パートナー窓口",
  "デザインの先にある実装を、必要な範囲だけ。表示崩れの修正、支給デザインのページ実装、フォーム、CSVなどのデータ処理を、文章で条件を整理して進めます。",
  "/partners",
);

const work = [
  "既存サイトの修正・レスポンシブ対応",
  "支給デザインからのページ実装",
  "フォームの実装",
  "CSVなどのデータ処理",
  "まだ決まっていない",
] as const;
const questions: readonly BriefQuestion[] = [
  { id: "work", label: "お願いしたい作業", options: work },
  {
    id: "scope",
    label: "作業の範囲",
    hint: "例：支給のFigmaデザイン1ページ（5セクション）をHTML / CSSで実装",
    required: true,
    multiline: true,
  },
  {
    id: "handoff",
    label: "受け渡しの方法",
    options: ["Gitリポジトリ", "ZIP", "差分ファイル", "相談して決めたい"],
  },
  {
    id: "check",
    label: "確認する画面幅・ブラウザ",
    hint: "例：375px / 768px / 1440px、Chrome・Safari",
  },
  {
    id: "conditions",
    label: "守秘・名義・再委託の条件",
    hint: "例：貴社名義での納品、実績公開不可",
    multiline: true,
  },
];
const kindMap = {
  question: "work",
  map: {
    [work[0]]: contactKinds[4],
    [work[1]]: contactKinds[0],
    [work[2]]: contactKinds[1],
    [work[3]]: contactKinds[2],
  },
};

export default function PartnersPage() {
  return (
    <>
      <Header />
      <main id="main" className="sales-hub sales-ui offer-page partner-page">
        <section className="hub-section offer-index-intro">
          <span className="works-byline">
            TETSU WORKS / FOR STUDIOS & DESIGNERS
          </span>
          <span className="eyebrow">IMPLEMENTATION PARTNER</span>
          <h1>
            デザインの先にある実装を、
            <br />
            必要な範囲だけ。
          </h1>
          <p className="section-lead">
            小規模なWeb実装・フォーム・データ処理を、文章で条件を整理して進めます。制作の一部だけを切り出して任せたいときの窓口です。
          </p>
          <div className="offer-actions">
            <Link href="#brief" className="button primary">
              依頼の条件を整理する <ArrowUpRight size={16} />
            </Link>
            <Link href="/services" className="text-link">
              範囲の決まったメニューを見る <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>

        <section className="hub-section offer-result" aria-labelledby="scope">
          <span className="eyebrow">WHAT I CAN TAKE ON</span>
          <h2 id="scope">お引き受けできる範囲。</h2>
          <div className="offer-columns">
            <article>
              <h3>範囲が決まっているもの</h3>
              <ul className="offer-list">
                {publishedOffers.map((o) => (
                  <li key={o.id}>
                    <Link href={`/services/${o.slug}`}>{o.title}</Link>
                  </li>
                ))}
              </ul>
            </article>
            <article>
              <h3>範囲を確認してお見積りするもの</h3>
              <ul className="offer-list">
                <li>支給デザイン（Figmaなど）からのページ実装</li>
                <li>
                  問い合わせフォームの実装（通知先・送信サービスは貴社またはご依頼元のご契約）
                </li>
                <li>表示確認・アクセシビリティ確認と、確認結果の整理</li>
              </ul>
            </article>
            <article>
              <h3>お引き受けしていないもの</h3>
              <ul className="offer-list">
                <li>常駐・長時間の即時対応が必要な体制</li>
                <li>ログイン・決済・会員機能の大規模な改修</li>
                <li>原因が分からない本番障害の緊急復旧のお約束</li>
                <li>デザイン全体の新規制作（実装が中心です）</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="hub-section offer-terms" aria-labelledby="how">
          <span className="eyebrow">HOW WE WORK TOGETHER</span>
          <h2 id="how">進め方と条件。</h2>
          <div className="sales-grid">
            {[
              [
                "連絡の方法",
                "メッセージ中心で進めます。打ち合わせは必須ではありません。仕様・素材・確認項目を文章で整理します。",
              ],
              [
                "受け渡し",
                "Gitリポジトリ（GitHubなど）、ZIP、差分ファイルなど、貴社の運用に合わせます。",
              ],
              [
                "ご支給いただくもの",
                "デザインデータ、対象の範囲、確認する画面幅とブラウザ、素材（画像・フォント・文章）と、その利用条件。",
              ],
              [
                "完了の確認（検収）",
                "着手前に合意した画面幅・ブラウザ・確認項目で、表示と操作を確認していただきます。",
              ],
              [
                "守秘・名義",
                "案件の内容は第三者に開示しません。守秘契約や貴社名義での納品は、条件を確認して相談します。成果物を実績として公開するのは、別途ご承諾をいただいた場合だけです。",
              ],
              [
                "再委託とご依頼元",
                "ご依頼元との契約で再委託が認められていることを前提にお受けします。ご依頼元へ直接営業することはありません。",
              ],
              [
                "はじめ方",
                "最初は1ページ・1か所など小さな有償の作業から、進め方と品質を確かめていただけます。",
              ],
              [
                "料金と納期",
                "範囲・素材・確認項目を確認し、着手前に確定額と納期をお伝えします。相談を送った時点で、契約や発注にはなりません。",
              ],
            ].map(([label, text]) => (
              <div key={label}>
                <span>{label}</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="hub-section offer-evidence" aria-labelledby="proof">
          <span className="eyebrow">SEE THE WORK FIRST</span>
          <h2 id="proof">実装の品質を、先に確かめる。</h2>
          <ul className="offer-evidence-list">
            {[
              ["表示の修正", "Before / After比較デモ", "/demos/improvement"],
              // Implementation quality shows best in the shops: they carry
              // real state, the failure cases, and the operator's side.
              ["ページ実装", "注文と予約まで動く店舗サイト", "/kissa"],
              ["EC・在庫", "在庫と注文が動くショップ", "/forme"],
              ["データ処理", "CSV加工デモ", "/demos/csv"],
              ["確認と納品", "QA・納品工程のデモ", "/demos/qa"],
            ].map(([kind, label, href]) => (
              <li key={href}>
                <span>{kind}</span>
                <Link href={href}>
                  {label} <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="honesty-note">
            掲載しているデモはすべて自主制作で、企業・商品・データは架空です。
          </p>
        </section>

        <OfferBrief
          heading="制作パートナーとしてのご依頼"
          page="/partners"
          questions={questions}
          kind={contactKinds[7]}
          kindMap={kindMap}
          title="依頼の条件を、先に整理する。"
          lead="作業の範囲と受け渡しの方法が分かれば、対応できるかどうかを早くお返事できます。分かるところだけで大丈夫です。"
        />
      </main>
      <Footer />
    </>
  );
}
