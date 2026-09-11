"use client";
import { useState } from "react";
import { ContactSend } from "./contact-send";
import { track } from "./analytics";
import { Copy, Check, ArrowUpRight } from "lucide-react";
export function Contact({
  initialKind = "Webサイト制作",
}: {
  initialKind?: string;
}) {
  const [kind, setKind] = useState(initialKind);
  const [detail, setDetail] = useState("");
  const [budget, setBudget] = useState("相談して決めたい");
  const [message, setMessage] = useState("");
  const template = `【相談内容】${kind}\n【困っていること】${detail || "（ご記入ください）"}\n【希望予算】${budget}\n【希望納期】（ご記入ください）\n【対象URL・資料】（必要に応じてご記入ください）`;
  return (
    <section id="contact" className="contact-section section">
      <div>
        <span className="eyebrow">LET’S MAKE IT WORK</span>
        <h2>
          つくりたいものを、
          <br />
          聞かせてください。
        </h2>
        <p>
          Web制作から業務ツール、修正まで。
          <br />
          まだ要件が曖昧でも、課題の整理から始められます。
        </p>
        <div className="contact-note">
          <Check size={16} /> 使う人の視点で確認・修正し、完成品まで仕上げます。
        </div>
        <p className="muted small">
          相談内容をコピーして、
          <br />
          ご利用中のクラウドソーシングサービスのメッセージからご連絡ください。
        </p>
      </div>
      <div className="contact-form">
        <label>
          相談したいこと
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {Array.from(
              new Set([
                initialKind,
                "Webサイトの修正",
                "LP制作",
                "EC商品ページ",
                "デザイン・コンテンツ",
                "テスト・納品",
                "業務自動化・データ加工",
                "管理画面・フォーム制作",
                "その他・まず相談したい",
              ]),
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          困っていること
          <textarea
            rows={3}
            value={detail}
            maxLength={2000}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="例：毎週、CSVから重複データを手作業で削除しています。"
          />
        </label>
        <label>
          希望予算の目安
          <select value={budget} onChange={(e) => setBudget(e.target.value)}>
            {Array.from(
              new Set([
                "5,000〜10,000円",
                "10,000〜30,000円",
                "30,000〜50,000円",
                "50,000〜100,000円",
                "100,000円以上",
                "相談して決めたい",
              ]),
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button
          className="button primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(template);
              track("portfolio_copy_contact_message");
              setMessage(
                "相談内容をコピーしました。案件サイトのメッセージに貼り付けてください。",
              );
            } catch {
              setMessage(
                "コピーできませんでした。下のテキストを選択してコピーしてください。",
              );
            }
          }}
        >
          <Copy size={16} /> 相談内容をコピー <ArrowUpRight size={16} />
        </button>
        <p className="small muted">
          送信は行いません。金額・納期は内容を確認してご相談。
        </p>
        <p role="status" className="small">
          {message}
        </p>
        <ContactSend kind={kind} detail={detail} budget={budget} />
        {message.includes("できません") && (
          <textarea
            aria-label="コピー用の相談内容"
            readOnly
            value={template}
            rows={7}
          />
        )}
      </div>
    </section>
  );
}
