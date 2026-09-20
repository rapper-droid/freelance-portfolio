import type { CategoryId } from "./portfolio";
import type { BriefQuestion } from "./brief";
export type { BriefQuestion } from "./brief";

/**
 * Fixed-scope offers: the small, clearly bounded jobs TETSU WORKS can be
 * asked for directly. Categories describe kinds of work; an offer describes
 * one job with its deliverables, exclusions, preparation and acceptance.
 *
 * Rules (docs/growth/OFFER_REVIEW.md):
 * - Only `verified` offers are rendered, listed in the sitemap or linked.
 * - A number is shown only when the owner approved it for this exact scope
 *   (`fixed`, tax included) or when the site already publishes it
 *   (`reference`); otherwise the offer promises a quote (`quote_required`).
 *   A price the owner has not approved stays in OFFER_REVIEW.md and never
 *   appears here, in structured data or in the client bundle.
 * - Every evidence line must be backed by a demo, a test or a dated record.
 */
export type OfferState = "draft" | "verified" | "paused";
export type OfferAudience = "business" | "partner";
export type EvidenceKind = "demo" | "self_project" | "test";
export type OfferEvidence = {
  kind: EvidenceKind;
  label: string;
  href?: string;
};
export type Offer = {
  id: string;
  slug: string;
  revision: number;
  title: string;
  shortTitle: string;
  audience: readonly OfferAudience[];
  category: CategoryId;
  problem: string;
  lead: string;
  result: string;
  deliverables: readonly string[];
  exclusions: readonly string[];
  prerequisites: readonly string[];
  acceptanceCriteria: readonly string[];
  revisionPolicy: string;
  schedulePolicy: string;
  price: {
    /**
     * `fixed` is a price the owner approved for this exact scope, shown as a
     * tax-included total (docs/growth/OFFER_REVIEW.md records the approval).
     * `reference` repeats a price the site already publishes; `quote_required`
     * promises a quote instead of a number.
     */
    status: "fixed" | "reference" | "quote_required";
    displayLabel: string;
    note: string;
    thirdPartyCosts: string;
  };
  demo: { slug: string; label: string; tryThis: string; cue: string };
  evidence: readonly OfferEvidence[];
  limits?: string;
  faqs: readonly (readonly [string, string])[];
  brief: readonly BriefQuestion[];
  state: OfferState;
  updatedAt: string;
};

export const offers: readonly Offer[] = [
  {
    id: "W01",
    slug: "web-fix",
    revision: 2,
    title: "Webページの表示崩れを、1か所直す。",
    shortTitle: "表示崩れの修正 1か所",
    audience: ["business", "partner"],
    category: "improvement",
    problem:
      "スマートフォンで文字がはみ出す、ボタンが押しにくい、画像がずれる。気になっているけれど、サイト全体を作り直すほどではない。",
    lead: "対象ページ1つ・表示の不具合1種類から。原因を確かめて修正し、修正前後の画面と確認手順をお渡しします。",
    result:
      "合意した画面幅とブラウザで、その不具合が起きない状態になります。修正したファイルと、自分で確かめられる手順が手元に残ります。",
    deliverables: [
      "対象1ページ・事前に合意した表示不具合1種類の修正",
      "修正したファイル、または変更点が分かる差分",
      "修正前・修正後のスクリーンショット（合意した画面幅）",
      "どの画面幅・ブラウザで何を見ればよいかの確認手順",
    ],
    exclusions: [
      "サイト全体の改修・デザインの作り直し",
      "原因が分からない本番障害の緊急対応・復旧のお約束",
      "ログイン・決済・会員機能の改修",
      "サーバー・ドメイン・メール設定の変更",
      "本番環境への反映作業（権限と手順を確認できる場合に別途相談）",
    ],
    prerequisites: [
      "対象ページのURL",
      "崩れている画面のスクリーンショットと、起きる端末・ブラウザ",
      "修正するソースコード（HTML / CSS など）、または編集できる環境の共有方法",
      "どう表示されれば完了かのイメージ（参考画面があれば）",
    ],
    acceptanceCriteria: [
      "合意した画面幅・ブラウザで、対象の不具合が再現しないこと",
      "修正前後のスクリーンショットで、対象以外の表示が変わっていないと確認できること",
    ],
    revisionPolicy:
      "合意した範囲内の軽微な調整を1回。別の箇所の修正や仕様の変更は、追加の範囲として先に相談します。",
    schedulePolicy:
      "ソースと再現情報を受け取り、作業範囲に合意した時点で納期をお伝えします。即日・24時間以内の対応はお約束していません。",
    price: {
      status: "fixed",
      displayLabel: "5,500円（税込）",
      note: "上の「お渡しするもの」の範囲（対象1ページ・事前に合意した表示不具合1種類）でのお値段です。範囲を超える場合や、直したい箇所が複数ある場合は、着手前に別途お見積りします。",
      thirdPartyCosts:
        "通常、有料素材や外部サービスの費用はかかりません。必要になる場合は着手前にお知らせします。",
    },
    demo: {
      slug: "improvement",
      label: "REFINE — Before / After",
      tryThis:
        "同じ原稿のBefore / Afterを切り替えて、読み順・余白・ボタンの違いを確かめられます。",
      cue: "自分のサイトの気になる1か所を、こんなふうに直したい",
    },
    evidence: [
      {
        kind: "demo",
        label: "Before / After比較デモ（自主制作）",
        href: "/demos/improvement",
      },
      {
        kind: "self_project",
        label:
          "このサイト自体を、公開前に53ページ×8つの画面幅（320〜1920px）で検査し、横はみ出し・文字の重なり0件を確認（2026年9月20日・自主運営サイト）",
      },
    ],
    faqs: [
      [
        "どんなサイトでも対応できますか？",
        "HTML / CSSで組まれたページや、Next.js / Reactのページを主に対応します。WordPressやShopifyは、テーマの編集方法を確認してからお答えします。対応できない場合は、その旨をお伝えします。",
      ],
      [
        "原因が分からなくても相談できますか？",
        "はい。まず再現情報をいただき、原因の見当がつくかを確認します。調べた結果1か所の修正に収まらない場合や、修正できない場合は、作業の前にお伝えします。",
      ],
      [
        "パスワードを渡す必要はありますか？",
        "最初のご相談では不要です。パスワード・秘密鍵・顧客情報は送らないでください。作業に必要なファイルの受け渡し方法は、合意後に相談します。",
      ],
      [
        "直したい箇所が複数あります。",
        "1か所ずつの範囲として一覧にし、まとめてお見積りします。優先度の高いものから小さく始めることもできます。",
      ],
    ],
    brief: [
      {
        id: "symptom",
        label: "困っている表示",
        hint: "例：スマホで見ると料金表が画面の右にはみ出す",
        required: true,
        multiline: true,
      },
      {
        id: "url",
        label: "対象ページのURL",
        hint: "公開前ならページ名だけでも大丈夫です",
        url: true,
      },
      {
        id: "device",
        label: "起きる端末・ブラウザ",
        options: [
          "iPhone",
          "Android",
          "PC",
          "タブレット",
          "複数の端末",
          "分からない",
        ],
      },
      {
        id: "source",
        label: "ソースの状況",
        options: [
          "ソースを共有できる",
          "管理画面から編集している",
          "制作会社に作ってもらった",
          "分からない",
        ],
      },
      {
        id: "goal",
        label: "どうなれば完了か",
        hint: "例：iPhoneで料金表が横にはみ出さず、横スクロールなしで読める",
        multiline: true,
      },
    ],
    state: "verified",
    updatedAt: "2026-09-21",
  },
  {
    id: "W02",
    slug: "csv-routine",
    revision: 2,
    title: "毎回のCSV整理を、1本の手順にまとめる。",
    shortTitle: "CSV整形ルーチン 1本",
    audience: ["business", "partner"],
    category: "automation",
    problem:
      "重複を消す、空白をそろえる、要らない行を落とす。同じCSVの整理を、毎回手作業でくり返している。",
    lead: "決まった入力から、決まった出力を。入力形式1種類・加工ルール最大3つ・出力形式1種類の処理にまとめ、誰が実行しても同じ結果になる形でお渡しします。",
    result:
      "サンプルで確かめた手順どおりに、同じ形式のCSVを何度でも同じように整えられます。元のファイルは上書きしません。",
    deliverables: [
      "入力形式1種類・加工ルール最大3つ・出力形式1種類の変換処理",
      "実行手順書（誰が・いつ・どう動かすか）",
      "サンプルデータでの変換前後の比較と、確認した項目の一覧",
    ],
    exclusions: [
      "Excelマクロ（VBA）・複雑な帳票レイアウトの作成",
      "UTF-8以外の文字コード（Shift_JISなど）への対応（事前確認のうえ別途）",
      "外部サービスへの自動アップロード・定期実行の設定（別途相談）",
      "個人情報を含む実データのお預かり・加工代行",
    ],
    prerequisites: [
      "加工前のCSVのサンプル（個人情報は架空の値に置き換えたもの）",
      "加工後にほしい形（残す列・並び順・重複とみなす条件など）",
      "使う頻度と、実行する人のパソコン環境（Windows / Macなど）",
    ],
    acceptanceCriteria: [
      "サンプルデータで、合意した加工ルールどおりの出力になること",
      "元のファイルが上書きされないこと",
      "=、+、-、@で始まる値が、表計算ソフトで数式として実行されない形で出力されること",
    ],
    revisionPolicy:
      "合意した加工ルールの範囲で、軽微な調整を1回。ルールの追加や入力形式の変更は、追加の範囲として先に相談します。",
    schedulePolicy:
      "サンプルと出力の形を受け取り、ルールに合意した時点で納期をお伝えします。即日・24時間以内の対応はお約束していません。",
    price: {
      status: "fixed",
      displayLabel: "16,500円（税込）",
      note: "入力形式1種類・加工ルール最大3つ・出力形式1種類の範囲でのお値段です。サンプルと必要なルールを確認したうえで着手し、この範囲を超える場合は着手前に別途お見積りします。",
      thirdPartyCosts:
        "基本はブラウザやパソコン上で動く形のため、利用料はかかりません。外部サービスを使う場合は、その費用を事前にお知らせします。",
    },
    demo: {
      slug: "csv",
      label: "CSV AUTOMATOR",
      tryThis:
        "125件の架空の注文データで、重複の除去・空白の整形・CSV出力まで試せます。読み込んだファイルはブラウザの外へ送信されません。",
      cue: "この処理を、毎回のCSVでそのまま使いたい",
    },
    evidence: [
      {
        kind: "demo",
        label: "CSV加工デモ（自主制作・ブラウザ内処理）",
        href: "/demos/csv",
      },
      {
        kind: "test",
        label:
          "読み込み・整形・出力を自動テストで確認：引用符・セル内改行・BOM・列数の上限・数式として解釈される値の無害化・負の数値の保持",
      },
    ],
    limits:
      "デモで確認している上限はUTF-8・2MB・10,000行・50列です。これを超えるデータは、事前に確認してからお答えします。",
    faqs: [
      [
        "Excelファイル（.xlsx）のままでも扱えますか？",
        "初期の対象はCSV（UTF-8）です。Excelから「CSV UTF-8」で保存したファイルを使う想定です。.xlsxのまま扱う必要がある場合は、別途相談します。",
      ],
      [
        "データをそちらへ送る必要がありますか？",
        "制作には、個人情報を架空の値に置き換えたサンプルで十分です。実データは、お客様の環境で処理する形を基本にします。",
      ],
      [
        "先頭の0（例：00123）は消えませんか？",
        "処理の中では文字として扱い、0を削除しません。ただしExcelでCSVを開くと先頭の0が表示されない場合があるため、確認手順でお伝えします。",
      ],
      [
        "毎日決まった時間に自動で動かしたいです。",
        "まずは手動で実行できる形を納品します。定期実行は、ご利用環境と費用を確認して別途相談します。",
      ],
    ],
    brief: [
      {
        id: "chore",
        label: "いま手作業でしていること",
        hint: "例：毎週、注文CSVから重複を消して、空欄の行を除いている",
        required: true,
        multiline: true,
      },
      {
        id: "input",
        label: "元のCSVの形",
        hint: "例：注文ID・顧客名・金額など5列、1回200行ほど",
        multiline: true,
      },
      {
        id: "output",
        label: "ほしい出力",
        hint: "例：重複を除いて、金額の列を数値にそろえたCSV",
        multiline: true,
      },
      {
        id: "frequency",
        label: "頻度",
        options: ["毎日", "毎週", "毎月", "不定期"],
      },
      {
        id: "tool",
        label: "今使っているもの",
        options: [
          "Excel",
          "Googleスプレッドシート",
          "業務システムから書き出し",
          "分からない",
        ],
      },
    ],
    state: "verified",
    updatedAt: "2026-09-21",
  },
];

/** Offers that may be rendered, linked and listed. */
export const publishedOffers = offers.filter((o) => o.state === "verified");
export const getOffer = (slug: string) =>
  publishedOffers.find((o) => o.slug === slug);
/** The published offer a demo is the evidence for, if any. */
export const offerForDemo = (demoSlug: string) =>
  publishedOffers.find((o) => o.demo.slug === demoSlug);

export const offerHeading = (offer: Pick<Offer, "id" | "shortTitle">) =>
  `${offer.shortTitle}（${offer.id}）`;
