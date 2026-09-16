import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  FileCode2,
  FolderCheck,
  MonitorSmartphone,
} from "lucide-react";
export function TrustPanel() {
  return (
    <aside className="trust-panel" aria-label="納品内容の概要">
      <span className="eyebrow">READY TO SHIP</span>
      <h2>
        <span>
          設計だけで終わらない。
          <br />
        </span>
        完成品まで納品。
      </h2>
      <p className="trust-scope">WEB / LP / EC / APP / API / AI</p>
      <div className="trust-files">
        <div>
          <MonitorSmartphone size={19} />
          <span>完成した制作物</span>
          <Check size={16} />
        </div>
        <div>
          <FileCode2 size={19} />
          <span>ソース・設定・README</span>
          <Check size={16} />
        </div>
        <div>
          <FolderCheck size={19} />
          <span>確認結果と納品手順</span>
          <Check size={16} />
        </div>
      </div>
      <div className="trust-tags">
        {["RESPONSIVE", "SOURCE", "README", "QA"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </aside>
  );
}
export function Delivery() {
  return (
    <section
      className="hub-section sales-delivery"
      id="delivery"
      data-delivery-info
    >
      <span className="eyebrow">06 / WHAT YOU GET</span>
      <h2>完成品として、渡す。</h2>
      <p className="section-lead">
        制作物だけでなく、使い始めるために必要なファイルと手順まで。
        <br />
        案件の範囲に合わせて、整理して納品します。
      </p>
      <div className="offer-grid">
        {[
          [
            "01 / PRODUCT",
            "完成した制作物",
            "スマートフォンでも使える画面。合意した機能を実装し、修正・動作確認まで対応。",
          ],
          [
            "02 / SOURCE & ASSETS",
            "ソース・画像・設定",
            "ソースコード、納品対象の画像データ、設定ファイルを整理。",
          ],
          [
            "03 / README",
            "迷わない引き継ぎ",
            "READMEに起動・設定・更新方法を記載。必要に応じて操作手順書も用意。",
          ],
          [
            "04 / QUALITY",
            "QA済み成果物",
            "表示・操作・リンクを確認し、確認項目と注意点を共有。",
          ],
        ].map(([label, title, copy]) => (
          <article key={label}>
            <span className="eyebrow">{label}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
      <p className="honesty-note">
        納品物・確認環境・修正範囲は、着手前に合意します。
      </p>
    </section>
  );
}
export function MessageOnly() {
  return (
    <section className="message-offer" aria-labelledby="message-title">
      <div>
        <span className="eyebrow">MESSAGE-ONLY OK</span>
        <h2 id="message-title">メッセージだけでも、進められます。</h2>
        <p>
          仕様確認・進捗共有・修正確認・納品まで、クラウドソーシング上のメッセージを中心に対応。Zoom
          / Google Meetは必須ではありません。
        </p>
      </div>
      <Link href="#contact" className="button">
        相談内容をまとめる <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
