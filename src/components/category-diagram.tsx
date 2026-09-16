import { Pipeline, BeforeAfter, type Stage } from "./diagrams";
import type { CategoryId } from "@/lib/portfolio";

/**
 * Per-category explanation.
 *
 * Only categories where prose was genuinely doing the work get a diagram.
 * Adding one to every category would dilute them into decoration, and a
 * category whose scope is already obvious from one line does not need a
 * picture of that line.
 *
 * Everything stated here is already true elsewhere on the page — these
 * restate the scope and the process visually, they do not add new promises
 * about price, turnaround or what is included.
 */

const PIPELINES: Partial<
  Record<CategoryId, { stages: Stage[]; caption: string }>
> = {
  automation: {
    stages: [
      {
        label: "受け取る",
        note: "問い合わせ・依頼・データが届く",
        actor: "自動",
      },
      { label: "整理する", note: "内容で分類し、優先度をつける", actor: "AI" },
      { label: "下書きする", note: "返信や処理の案をつくる", actor: "AI" },
      { label: "確認する", note: "内容を見て、直して、決める", actor: "人" },
      { label: "実行する", note: "送信・登録・出力まで通す", actor: "自動" },
    ],
    caption:
      "自動化しても、送る前に人が確認する形を基本にしています。判断を人に残すかどうかは、対象の業務ごとにご相談のうえ決めます。",
  },
  api: {
    stages: [
      { label: "調べる", note: "相手サービスの仕様と制限を確認", actor: "人" },
      { label: "つなぐ", note: "認証と通信経路を設計する", actor: "人" },
      {
        label: "変換する",
        note: "受け取った形を使える形に直す",
        actor: "自動",
      },
      {
        label: "失敗に備える",
        note: "再試行と通知の条件を決める",
        actor: "人",
      },
      { label: "動かす", note: "定期実行または画面から実行", actor: "自動" },
    ],
    caption:
      "外部サービスは落ちることがあります。落ちたときにどうするかまで決めてから繋ぎます。",
  },
  qa: {
    stages: [
      { label: "決める", note: "確認する項目を先に一覧にする", actor: "人" },
      { label: "触る", note: "PC・スマホ・キーボードで操作", actor: "人" },
      { label: "直す", note: "見つかった不具合を修正する", actor: "人" },
      { label: "再確認", note: "直した箇所と周辺をもう一度", actor: "人" },
      { label: "残す", note: "確認結果と手順を文書で渡す", actor: "人" },
    ],
    caption:
      "「確認しました」ではなく、何をどう確認したかが残る形で納品します。",
  },
};

const COMPARISONS: Partial<
  Record<
    CategoryId,
    { rows: { before: string; after: string }[]; caption: string }
  >
> = {
  improvement: {
    rows: [
      {
        before: "どこから読めばいいか分からない",
        after: "見出しと順番が整理され、目的の情報に辿り着ける",
      },
      {
        before: "スマートフォンで文字が小さく、崩れる",
        after: "画面幅に合わせて読める大きさで並ぶ",
      },
      {
        before: "問い合わせボタンが見つからない",
        after: "各ページから相談へ進める導線がある",
      },
      {
        before: "直したい箇所があっても触れない",
        after: "変更手順が残っていて、次も直せる",
      },
    ],
    caption:
      "改善前の状態は、実際のサイトを見せていただいてから確認します。上は代表的な例です。",
  },
  responsive: {
    rows: [
      {
        before: "PCでは整っているがスマホで横にはみ出す",
        after: "どの幅でも横スクロールが出ない",
      },
      {
        before: "ボタンが小さく、指で押しにくい",
        after: "指で確実に押せる大きさを確保",
      },
      {
        before: "画像が切れて内容が分からない",
        after: "画面に合わせて見せる範囲が変わる",
      },
    ],
    caption: "対応する幅と端末は、アクセス状況を見てから決めます。",
  },
};

export function CategoryDiagram({ id }: { id: CategoryId }) {
  const pipeline = PIPELINES[id];
  const comparison = COMPARISONS[id];
  if (!pipeline && !comparison) return null;
  return (
    <section className="hub-section category-diagram" data-reveal="section">
      <span className="eyebrow">HOW IT WORKS</span>
      <h2>{pipeline ? "どう動くのか。" : "どう変わるのか。"}</h2>
      {pipeline ? (
        <Pipeline stages={pipeline.stages} caption={pipeline.caption} />
      ) : null}
      {comparison ? (
        <BeforeAfter rows={comparison.rows} caption={comparison.caption} />
      ) : null}
    </section>
  );
}
