"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useOps } from "./ops-provider";
import { classifyCase, suggestDraft, newCase } from "@/lib/ops/cases";
import type { OpsCase } from "@/lib/ops/types";

/**
 * RELAY — intake, classification, draft, and a person (指示書 §14).
 *
 * The classification and the draft happen here and stay here. A case is only
 * filed when someone presses approve, which is what the four steps above the
 * workspace have always claimed and what the screen now actually does: before
 * this, approving changed a label and nothing else, and SMART INBOX never
 * learned that an enquiry existed.
 *
 * Nothing is sent. The reply is written, checked and recorded; delivering it
 * is a separate, connected system that does not exist here, and the screen
 * says so rather than implying an outbox.
 */

const SAMPLE =
  "本日からフォームが動かず業務が停止しています。至急確認をお願いします。";

export function RelayWorkspace() {
  const ops = useOps();
  const { file, approve, saveDraft, withdraw, ready } = ops;
  const [input, setInput] = useState(SAMPLE);
  const [name, setName] = useState("サンプルのお客様");
  const [analysed, setAnalysed] = useState(false);
  const [draft, setDraft] = useState("");
  const [filed, setFiled] = useState<OpsCase | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Derived, not stored: the verdict always matches the text on screen.
  const verdict = useMemo(
    () => (analysed ? classifyCase(input) : null),
    [analysed, input],
  );

  const reset = () => {
    setAnalysed(false);
    setDraft("");
    setFiled(null);
    setNotice("");
    setError("");
  };

  const analyse = () => {
    const provisional = newCase({
      customerName: name.trim() || "サンプルのお客様",
      subject: "",
      body: input,
      receivedAtIso: new Date().toISOString(),
      source: "relay",
    });
    setDraft(suggestDraft(provisional, provisional.receivedAtIso).draft);
    setAnalysed(true);
    setFiled(null);
    setError("");
    setNotice("分類と返信下書きを作成しました。担当者が確認してください。");
  };

  /**
   * Sends the draft back for revision.
   *
   * If the case is already filed, this is not a local gesture: the approval
   * is withdrawn from the record, so SMART INBOX stops showing it as checked.
   */
  const sendBack = () => {
    if (filed) withdraw(filed.caseId);
    setError("");
    setNotice("下書きを差し戻しました。編集して再確認してください。");
  };

  const confirm = () => {
    if (!draft.trim()) {
      setError("下書きがありません。");
      return;
    }
    // Already filed: this is a re-approval of the same case, not a new one.
    if (filed) {
      saveDraft(filed.caseId, draft);
      const again = approve(filed.caseId);
      if (!again.ok) {
        setError(again.reason ?? "確認済みにできませんでした。");
        return;
      }
      setError("");
      setNotice(
        `再確認しました（${filed.reference}）。メールは送信されません。`,
      );
      return;
    }
    const created = file({
      customerName: name.trim() || "サンプルのお客様",
      subject: input.slice(0, 30).replace(/\n/g, " "),
      body: input,
    });
    // The operator's draft belongs to the case, so it is written first:
    // approving a case with no draft is refused, which is the point.
    saveDraft(created.caseId, draft);
    const result = approve(created.caseId);
    if (!result.ok) {
      setError(result.reason ?? "確認済みにできませんでした。");
      return;
    }
    setFiled(created);
    setError("");
    setNotice(
      `確認済みとして SMART INBOX に記録しました（${created.reference}）。メールは送信されません。`,
    );
  };

  // Read back out of the record: once filed, whether this reply counts as
  // approved is the record's answer, not this component's memory of it.
  const stored = filed
    ? (ops.cases.find((c) => c.caseId === filed.caseId) ?? null)
    : null;
  const approved = Boolean(stored?.approvedAtIso);

  const steps = ["受付", "分類", "下書き", "人の確認"];
  const reached = approved ? 4 : analysed ? 3 : 1;

  return (
    <div className="automation-demo showcase">
      <div className="app-demo-heading">
        <span className="eyebrow">RELAY / SUPPORT OPERATIONS</span>
        <h2>自動化に、人の判断を。</h2>
        <p>
          AI導入を想定した体験デモ。現在はキーワード・定型文でローカル処理します。
          確認済みにすると、同じ記録が SMART INBOX と ADMIN に現れます。
        </p>
      </div>

      <ol className="relay-flow">
        {steps.map((s, i) => (
          <li key={s} className={i < reached ? "done" : ""}>
            <span>0{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="relay-workspace" data-feature>
        <section>
          <span className="eyebrow">01 / INPUT</span>
          <h3>問い合わせ内容</h3>
          <label>
            お客様名
            <input
              value={name}
              maxLength={40}
              onChange={(e) => {
                setName(e.target.value);
                reset();
              }}
            />
          </label>
          <label>
            テスト用の問い合わせ
            <textarea
              rows={6}
              maxLength={2000}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                reset();
              }}
            />
          </label>
          <button
            className="button primary"
            disabled={!input.trim() || !ready}
            onClick={analyse}
          >
            分類・下書きを実行 <ArrowRight size={16} />
          </button>
          <p className="demo-fineprint">
            入力内容は外部送信しません。実際の個人情報は入力しないでください。
          </p>
        </section>

        <section>
          <span className="eyebrow">02 / REVIEW</span>
          <h3>担当者の確認</h3>
          {verdict ? (
            <>
              <div className="relay-result">
                <span>
                  分類 <b>{verdict.category}</b>
                </span>
                <span>
                  緊急度 <b>{verdict.urgency}</b>
                </span>
              </div>
              <label>
                返信下書き
                <textarea
                  rows={8}
                  aria-label="返信下書き"
                  value={draft}
                  maxLength={4000}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    // Editing a filed case clears its approval in the record,
                    // which is the rule this screen exists to demonstrate.
                    if (filed) saveDraft(filed.caseId, e.target.value);
                    setNotice("変更した下書きを再確認してください。");
                  }}
                />
              </label>

              {error && <p role="alert">{error}</p>}

              {filed && (
                <div className="relay-filed">
                  <p>
                    <b>{filed.reference}</b> として記録しました。
                    {approved ? "確認済みです。" : "未確認のままです。"}
                  </p>
                  <Link className="button secondary" href="/demos/inbox">
                    SMART INBOX で見る <ArrowRight size={16} />
                  </Link>
                </div>
              )}

              <div className="showcase-actions">
                <button
                  className="button primary"
                  disabled={!draft.trim() || approved}
                  onClick={confirm}
                >
                  内容を確認済みにする
                </button>
                <button className="button secondary" onClick={sendBack}>
                  差し戻す
                </button>
                {filed && (
                  <button className="button secondary" onClick={reset}>
                    別の問い合わせを試す
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="relay-empty">
              問い合わせを入力して実行すると、
              <br />
              分類結果と返信下書きが表示されます。
            </div>
          )}
          <p role="status">{notice}</p>
        </section>
      </div>

      <details className="api-contract">
        <summary>API連携を実装する場合のデータ契約例</summary>
        <p>
          接続設計サンプルです。以下のAPIは公開・接続されていません。実装時は認証・入力検証・タイムアウト・コスト上限・人の確認を設けます。
        </p>
        <pre>
          {JSON.stringify(
            {
              request: { ticketId: "demo-001", text: "匿名化した本文" },
              response: {
                category: "support",
                draft: "要確認の返信案",
                requiresHumanReview: true,
              },
              failure: { code: "UPSTREAM_UNAVAILABLE", retryable: true },
            },
            null,
            2,
          )}
        </pre>
      </details>
    </div>
  );
}
