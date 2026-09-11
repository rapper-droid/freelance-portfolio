import { Plus } from "lucide-react";

const questions = [
  [
    "Zoomなしでも、メッセージ中心で依頼できますか？",
    "はい。要件整理から進捗共有・修正確認・納品まで、メッセージ中心で進められます。記録を残しながら、ご都合のよい時間に確認できます。オンライン会議は必須ではありません。",
  ],
  [
    "原稿がまだありません。何から用意すればよいですか？",
    "目的・伝えたい内容・参考サイトがあれば、構成の整理から相談できます。原稿作成が必要な範囲と費用は、着手前に確認します。",
  ],
  [
    "写真や画像素材が揃っていなくても大丈夫ですか？",
    "必要な素材を整理し、支給・撮影・利用許諾のある素材などから方法を提案します。有料素材やAI生成画像の使用は事前に相談し、権利と用途を確認します。",
  ],
  [
    "修正はどこまで対応できますか？",
    "修正回数・対象範囲・確認日を着手前に合意します。途中でページや機能が増える場合は、追加費用と納期を先にお伝えします。",
  ],
  [
    "納品形式は？ ソースコードも受け取れますか？",
    "完成した制作物に加え、合意したソースコード・画像・設定・READMEを整理して納品します。ZIPやGitリポジトリなど、運用しやすい形式を相談できます。外部素材のライセンス条件も共有します。",
  ],
  [
    "スマートフォンにも対応していますか？",
    "はい。PC・タブレット・スマートフォンで、読み順・画像・タップ領域を調整します。対象の画面幅やブラウザは事前に決め、表示と操作を確認します。",
  ],
  [
    "WordPress / Next.js / Shopifyは相談できますか？",
    "はい。更新方法や既存環境を伺い、適した構成と対応範囲を提案します。テーマ・プラグイン・外部連携が必要な場合は、仕様と費用を確認してから見積もります。",
  ],
  [
    "短納期の案件も相談できますか？",
    "希望公開日と必要なページ・機能をお知らせください。素材の準備状況と作業量を確認し、優先範囲を絞るなど、実現できる進め方を相談します。",
  ],
  [
    "AIを使う場合、品質はどう確認しますか？",
    "生成結果をそのまま納品せず、要件との一致・実際の操作・表示・エラー処理を確認し、修正します。機密情報の扱いとAIの利用範囲も事前に確認します。",
  ],
  [
    "公開まで対応できますか？",
    "はい。公開作業を含む範囲で合意した場合は、環境設定の案内から公開後の表示・リンク確認まで対応します。契約・決済・本人認証・ドメインの権限操作は、ご本人にお願いする場合があります。",
  ],
] as const;

export function FAQ() {
  return (
    <section
      className="hub-section sales-faq"
      id="faq"
      aria-labelledby="faq-title"
    >
      <div className="faq-heading">
        <span className="eyebrow">07 / FAQ</span>
        <h2 id="faq-title" className="editorial-heading">
          BEFORE
          <br />
          YOU ASK.
        </h2>
        <p className="section-lead">依頼前の不安を、ひとつずつ。</p>
      </div>
      <div className="faq-list">
        {questions.map(([question, answer], i) => (
          <details key={question}>
            <summary>
              <span className="faq-number" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{question}</span>
              <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
