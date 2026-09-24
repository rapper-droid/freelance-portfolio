import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SavingsCalculator } from "./flow/savings-calculator";
import { extractorAvailability } from "@/lib/runtime/extract/registry";

/**
 * What /works now opens with (指示書 §11).
 *
 * The order is the point. A visitor meets the job that gets smaller before
 * they meet a product name, and they meet what stays theirs to decide before
 * they meet a price. The eleven cards and the twelve categories are still
 * below this, unchanged — this section leads, it does not replace.
 */

const TROUBLES = [
  {
    href: "/flow",
    kicker: "返信の準備",
    title: "問い合わせが届いてから、返信するまで",
    removes: [
      "本文を読んで要件を書き出す",
      "過去のやりとりを探す",
      "案件台帳に転記する",
      "確認質問を考える",
    ],
    keeps: "依頼を受けるか、金額と納期をどう約束するか。",
    output: "案件記録・返信案・確認事項の一覧",
  },
  {
    href: "/flow",
    kicker: "日程調整",
    title: "予約希望が届いてから、確定するまで",
    removes: [
      "候補を書き出す",
      "空き時間を確認する",
      "準備時間を足して考える",
      "変更時に関連記録を直す",
    ],
    keeps: "例外的な予約を受けるかどうか。日程合意は予約者本人が行います。",
    output: "空き確認済みの候補・案内文・変更時の更新一覧",
  },
  {
    href: "/flow",
    kicker: "定期報告",
    title: "毎週のファイルが届いてから、報告するまで",
    removes: [
      "列の対応をやり直す",
      "重複を目視で探す",
      "集計し直す",
      "前回と見比べる",
    ],
    keeps: "不明な列の意味、新しいルール、異常値をどう扱うか。",
    output: "集計表・前回比較・問題行一覧・変更ログ",
  },
];

export function WorksLead() {
  const ai = extractorAvailability();
  return (
    <section
      className="hub-section works-lead"
      aria-labelledby="works-lead-heading"
    >
      <div className="works-lead-intro">
        <span className="eyebrow">WHAT GETS SMALLER</span>
        <h2 id="works-lead-heading">
          入力する仕事を、減らす。
          <br />
          確かめるだけの仕事を、増やす。
        </h2>
        <p>
          {
            "問い合わせ、日程調整、毎週の集計。いま使っている道具をつなぎ、繰り返す作業を先に進めます。すべてが一クリックで終わるわけではありません。初期設定と、人に残る判断がどこかは、下に書いています。"
          }
        </p>
        <Link href="/flow" className="button primary">
          仕事が進むところを見る <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <ul className="works-lead-grid">
        {TROUBLES.map((t) => (
          <li key={t.kicker} className="works-lead-card">
            <span className="works-lead-kicker">{t.kicker}</span>
            <h3>{t.title}</h3>
            <p className="works-lead-label">代わりにやること</p>
            <ul>
              {t.removes.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="works-lead-label">あなたに残る判断</p>
            <p>{t.keeps}</p>
            <p className="works-lead-label">出てくるもの</p>
            <p>{t.output}</p>
            <Link href={t.href} className="works-lead-link">
              この体験を見る <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="works-lead-state">
        <h3>いまの実行状態</h3>
        <ul>
          <li>
            <b>通常プログラム</b>
            {
              "：稼働中。日時の判定、空き確認、集計、重複判定、数式注入の防止はすべて実際のコードが実行しています。"
            }
          </li>
          <li>
            <b>実AI処理</b>：
            {ai.ai
              ? "稼働中。使用した工程には実AIと表示します。"
              : `未稼働（${ai.aiBlockedReason}）。ルール処理で代替した結果をAIの成果として表示することはしません。`}
          </li>
          <li>
            <b>外部への送信・カレンダー登録</b>
            ：公開サンプルでは実行しません。下書きと計画までを表示します。
          </li>
        </ul>
        <p className="works-lead-fineprint">
          {
            "自主制作の検証であり、顧客導入の実績ではありません。稼働件数・精度・売上改善の数値は掲載していません。"
          }
        </p>
      </div>

      <div className="works-lead-savings">
        <h3>自分の場合で試算する</h3>
        <p>
          {
            "入力した条件での計算です。体験で計測した値ではなく、導入後の成果を保証するものでもありません。"
          }
        </p>
        <SavingsCalculator />
      </div>
    </section>
  );
}
