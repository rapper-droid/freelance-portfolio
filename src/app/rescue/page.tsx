import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Header, Footer } from "@/components/site";
import { OfferBrief } from "@/components/offer-brief";
import { contactKinds } from "@/lib/contact-options";
import { getOffer } from "@/lib/offers";
import { pageMetadata } from "@/lib/seo";
import type { BriefQuestion } from "@/lib/brief";
import "@/components/portfolio-styles.css";
import "@/components/offers.css";

export const metadata = pageMetadata(
  "何を頼めばいいか分からないときの、相談の整理",
  "困っていることを選ぶだけで、相談に必要な項目が文章になります。そのままコピーして、ご利用中のサービスのメッセージにも貼れます。",
  "/rescue",
);

const troubles = [
  "見た目を直したい",
  "データ整理を減らしたい",
  "問い合わせの対応を整理したい",
  "何を頼むべきか分からない",
] as const;

const webFix = getOffer("web-fix")!;
const csvRoutine = getOffer("csv-routine")!;
const suggest = {
  question: "trouble",
  map: {
    [troubles[0]]: [
      {
        slug: webFix.slug,
        title: webFix.shortTitle,
        note: "対象1ページ・不具合1種類から。修正前後の画面と確認手順つき。",
      },
    ],
    [troubles[1]]: [
      {
        slug: csvRoutine.slug,
        title: csvRoutine.shortTitle,
        note: "入力1形式・ルール最大3つ・出力1形式の処理にまとめます。",
      },
    ],
    [troubles[2]]: [],
    [troubles[3]]: [],
  },
  empty:
    "今のメニューには当てはまらないかもしれません。内容を確認してから、対応できるかどうかをお返事します。対応できない場合も、必要な情報の整理まではお手伝いします。",
};
const kindMap = {
  question: "trouble",
  map: {
    [troubles[0]]: contactKinds[4],
    [troubles[1]]: contactKinds[2],
    [troubles[2]]: contactKinds[1],
    [troubles[3]]: contactKinds[7],
  },
};
const questions: readonly BriefQuestion[] = [
  { id: "trouble", label: "いちばん困っていること", options: troubles },
  {
    id: "detail",
    label: "どんな場面で困っているか",
    hint: "例：毎週の売上CSVを手で並べ替えていて、月末はほぼ半日かかる",
    required: true,
    multiline: true,
  },
  {
    id: "now",
    label: "いま使っているもの・今の状態",
    hint: "例：Excelと自社サイト（制作会社に作ってもらった）",
    multiline: true,
  },
  {
    id: "want",
    label: "どうなったら嬉しいか",
    hint: "例：ボタンひとつで整った表が出てくる",
    multiline: true,
  },
  {
    id: "ready",
    label: "用意できるもの",
    options: [
      "サンプルデータ（架空の値に置き換えたもの）",
      "対象ページのURL",
      "画面のスクリーンショット",
      "まだ何もない",
    ],
  },
];

export default function RescuePage() {
  return (
    <>
      <Header />
      <main id="main" className="sales-hub sales-ui offer-page rescue-page">
        <section className="hub-section offer-index-intro">
          <span className="works-byline">
            TETSU WORKS / CLIENT SERVICES BY TSUDOWA
          </span>
          <span className="eyebrow">START FROM THE TROUBLE</span>
          <h1>
            何を頼めばいいか、
            <br />
            まだ決まっていなくても。
          </h1>
          <p className="section-lead">
            困っていることを選んで、思いつくままに書いてください。相談に必要な項目が文章に整います。そのまま相談しても、コピーしてご利用中のサービスのメッセージに貼ってもかまいません。
          </p>
          <p className="honesty-note">
            ここは緊急対応の窓口ではありません。24時間の監視や、サイトが止まったときの復旧をお約束するものではありません。不具合の原因調査と修正作業は分けて考え、調べた結果お受けできない場合はその旨をお伝えします。
          </p>
        </section>

        <section className="hub-section offer-result" aria-labelledby="how">
          <span className="eyebrow">HOW IT WORKS</span>
          <h2 id="how">整理すると、話が早くなる。</h2>
          <div className="offer-columns">
            <article>
              <h3>この画面でできること</h3>
              <ul className="offer-list">
                <li>困っていること・今の状態・欲しい結果を、順番に整理する</li>
                <li>近いメニューがあれば、その場で候補を出す（最大2つ）</li>
                <li>相談文をコピーして、どこへでも持ち帰れる</li>
              </ul>
            </article>
            <article>
              <h3>入力しないでほしいもの</h3>
              <ul className="offer-list offer-list-no">
                <li>パスワード・APIキー・秘密鍵</li>
                <li>顧客名簿や個人情報を含む実データ</li>
                <li>取引先との契約内容など、公開できない情報</li>
              </ul>
            </article>
          </div>
          <p className="honesty-note">
            入力内容はこのブラウザの中だけで処理され、送信ボタンを押すまでどこにも送られません。
          </p>
        </section>

        <OfferBrief
          heading="何を頼めばよいかの整理"
          page="/rescue"
          questions={questions}
          kind={contactKinds[7]}
          kindMap={kindMap}
          suggest={suggest}
          title="困っていることから、相談文をつくる。"
          lead="専門用語はいりません。分かるところだけ選んで、あとは普段の言葉で書いてください。"
        />

        <section className="hub-section offer-evidence" aria-labelledby="next">
          <span className="eyebrow">IF YOU WANT TO LOOK FIRST</span>
          <h2 id="next">先に、動くものを見たい方へ。</h2>
          <ul className="offer-evidence-list">
            {[
              ["範囲の決まったメニュー", "小さく頼めるメニュー", "/services"],
              ["データ整理", "CSV加工デモを触る", "/demos/csv"],
              ["問い合わせ対応", "問い合わせ管理デモを触る", "/demos/inbox"],
              ["制作会社・デザイナー", "実装パートナー窓口", "/partners"],
            ].map(([kind, label, href]) => (
              <li key={href}>
                <span>{kind}</span>
                <Link href={href}>
                  {label} <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
