import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { flowPhases, pricingNote, type categories } from "@/lib/portfolio";
import { PhaseFlow } from "./diagrams";
export function Process() {
  return (
    <section className="hub-section" id="process">
      {/* The lead absorbs what used to float in the top-right corner. A
          single sentence about how the work runs belongs with the heading,
          not opposite it where it read as an unrelated aside. */}
      <div className="process-head">
        <span className="eyebrow">07 / FROM BRIEF TO DELIVERY</span>
        <h2>
          依頼から納品まで、
          <br />
          見通しのある進め方。
        </h2>
        <p className="section-lead">
          全10工程を4つのフェーズで進めます。ご利用中のクラウドソーシングサービスのメッセージだけでも進行できます。
        </p>
      </div>
      {/* One list, not two. Each phase carries its own steps, so the ten
          detailed steps are no longer a second list repeating the first. */}
      <div data-reveal="trace">
        <PhaseFlow phases={flowPhases} />
      </div>
      <div className="delivery-foot">
        <Check size={18} />
        <p>
          制作範囲・確認日・納品形式を最初に共有。AIも活用して効率化し、動作確認・修正・成果物の整理まで責任を持って対応します。修正回数と対象範囲も着手前に合意します。
        </p>
      </div>
    </section>
  );
}
export function SalesInfo({
  category,
}: {
  category: (typeof categories)[number];
}) {
  return (
    <section
      className="hub-section sales-info"
      id="delivery"
      data-delivery-info
      data-price-info
    >
      <div className="hub-section-head">
        <div>
          <span className="eyebrow">WHAT YOU CAN ORDER</span>
          <h2>
            この種類の仕事を
            <br />
            依頼した場合。
          </h2>
        </div>
        <Link href="#contact" className="button primary">
          相談内容をまとめる <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="sales-grid" data-reveal="group">
        {[
          ["向いている依頼", category.audience],
          ["対応可能内容", category.scope],
          ["参考料金", category.price],
          ["制作期間", category.duration],
          [
            "納品可能物",
            "ソースコード・設定ファイル・README・必要な素材・確認項目一覧（契約範囲による）",
          ],
          [
            "修正対応",
            "確認用共有後、合意した範囲で修正。追加仕様は費用と日程を先に相談します。",
          ],
          ["必要素材", category.materials],
          // Not a new condition: the row above already says these come from
          // the client, which means the reference price does not cover making
          // them. Stating the consequence plainly is clearer than leaving a
          // reader to infer it after they have asked for a quote.
          [
            "含まれないもの",
            "上の必要素材はお客様にご用意いただく前提です。素材そのものの作成は参考料金に含みません。",
          ],
          ["使用可能技術", category.tech],
          [
            "進め方",
            "仕様・素材確認 → 設計 → 実装 → QA → 共有・修正 → 最終QA → 納品",
          ],
        ].map(([label, text]) => (
          <div key={label}>
            <span>{label}</span>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <p className="honesty-note">{pricingNote}</p>
      {["api", "automation"].includes(category.id) && (
        <p className="honesty-note">
          公開デモはローカル処理です。AIモデル・外部APIの実接続は、利用条件・認証・費用・対象データを確認して個別に設計します。
        </p>
      )}
    </section>
  );
}
