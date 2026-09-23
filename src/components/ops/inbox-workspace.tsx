"use client";

import { useState } from "react";
import Link from "next/link";
import { Inbox, Search, Sparkles, Copy, RotateCcw, Check } from "lucide-react";
import { OperationsOverview } from "../operations-overview";
import { useOps } from "./ops-provider";
import { receivedLabel } from "@/lib/ops/cases";
import { OWNERS, type CaseStatus } from "@/lib/ops/types";

/**
 * SMART INBOX (指示書 §14).
 *
 * The same cases RELAY files and ADMIN counts. Status, owner and the reply
 * draft are written to the record rather than to this component, which is
 * what makes the other two screens agree with this one — and what makes the
 * work survive a reload.
 *
 * The approval state is shown, not just the draft: a reply that was signed
 * off and then edited is no longer signed off, and a support desk needs to
 * see that at a glance rather than infer it.
 */

const STATUSES: CaseStatus[] = ["未対応", "対応中", "完了"];
const CATEGORIES = ["請求", "不具合", "契約", "お問い合わせ"];
const URGENCIES = ["高", "中", "通常"];

export function InboxWorkspace() {
  const ops = useOps();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("すべて");
  const [category, setCategory] = useState("すべて");
  const [urgency, setUrgency] = useState("すべて");
  const [owner, setOwner] = useState("すべて");
  const [notice, setNotice] = useState("");

  const cases = ops.cases;
  const filtered = cases.filter((c) => {
    const haystack = [c.customerName, c.subject, c.body]
      .join(" ")
      .toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (status === "すべて" || c.status === status) &&
      (category === "すべて" || c.category === category) &&
      (urgency === "すべて" || c.urgency === urgency) &&
      (owner === "すべて" || c.owner === owner)
    );
  });

  // The selection follows the list: a case filtered away, dismissed or never
  // chosen should not leave the detail pane showing something invisible.
  const active =
    filtered.find((c) => c.caseId === selected) ?? filtered[0] ?? null;

  const clearFilters = () => {
    setQuery("");
    setStatus("すべて");
    setCategory("すべて");
    setUrgency("すべて");
    setOwner("すべて");
  };

  const filters = [
    { label: "カテゴリ", value: category, set: setCategory, opts: CATEGORIES },
    { label: "緊急度", value: urgency, set: setUrgency, opts: URGENCIES },
    { label: "担当", value: owner, set: setOwner, opts: [...OWNERS] },
  ];

  return (
    <div className="tool-panel">
      <div className="tool-title">
        <div>
          <Inbox size={20} />
          <h2>問い合わせ管理</h2>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            ops.reset();
            clearFilters();
            setSelected(null);
            setNotice("初期データに戻しました。");
          }}
        >
          <RotateCcw size={14} /> リセット
        </button>
      </div>

      <OperationsOverview
        name="今日の対応に、集中する。"
        description="未対応から確認し、返信の下書きまで一つの流れで。"
        total={ops.totals.total}
        completed={cases.filter((c) => c.status === "完了").length}
        pending={cases.filter((c) => c.status === "未対応").length}
      />

      <div className="stats-grid inbox-stats">
        {["すべて", ...STATUSES].map((s) => (
          <button
            key={s}
            className={`stat stat-button ${status === s ? "selected" : ""}`}
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
          >
            <span>{s}</span>
            <strong>
              {s === "すべて"
                ? cases.length
                : cases.filter((c) => c.status === s).length}
              <small> 件</small>
            </strong>
          </button>
        ))}
      </div>

      <div className="inbox-filter">
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="問い合わせを検索"
            placeholder="件名・本文・顧客名で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {filters.map((f) => (
          <label className="filter-label" key={f.label}>
            {f.label}
            <select
              aria-label={f.label}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
            >
              <option>すべて</option>
              {f.opts.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="inbox-workspace">
        <div className="ticket-list" aria-label="問い合わせ一覧">
          <div className="list-caption">
            受信一覧 <span>{filtered.length}件</span>
          </div>
          {filtered.map((c) => (
            <button
              className={`ticket ${active?.caseId === c.caseId ? "active" : ""}`}
              key={c.caseId}
              onClick={() => {
                setSelected(c.caseId);
                setNotice("");
              }}
              aria-pressed={active?.caseId === c.caseId}
            >
              <div>
                <b>{c.customerName}</b>
                <small>{receivedLabel(c, ops.nowIso)}</small>
              </div>
              <h3>{c.subject || c.body.slice(0, 24)}</h3>
              <p>{c.body}</p>
              <div>
                <span className="badge">{c.category}</span>
                <span
                  className={`badge ${c.urgency === "高" ? "warning" : ""}`}
                >
                  緊急度：{c.urgency}
                </span>
                <small>{c.status}</small>
                {c.source === "relay" && <small>RELAY から</small>}
              </div>
            </button>
          ))}
          {!filtered.length && (
            <div className="empty-state">
              該当する問い合わせがありません。
              <button className="button secondary" onClick={clearFilters}>
                絞り込みを解除
              </button>
            </div>
          )}
        </div>

        {/* Keyed on the case so switching selection remounts the panel.
            Without this React reuses the same nodes and the content swaps
            with no transition at all, which reads as a redraw glitch rather
            than "a different ticket is now open". */}
        <div className="ticket-detail" key={active ? active.caseId : "none"}>
          {active ? (
            <>
              <div className="detail-meta">
                <span className="eyebrow">TICKET {active.reference}</span>
                <span className="badge">
                  {active.category} / 緊急度：{active.urgency}
                </span>
                {active.approvedAtIso && (
                  <span className="badge approved">
                    <Check size={13} aria-hidden="true" /> 確認済み
                  </span>
                )}
              </div>
              <h3>{active.subject || active.body.slice(0, 24)}</h3>
              <p className="small muted">
                {active.customerName} · {receivedLabel(active, ops.nowIso)} ·
                架空の問い合わせ
              </p>
              <p className="ticket-body">{active.body}</p>

              <div className="assignment">
                <label>
                  対応状況
                  <select
                    aria-label="対応状況"
                    value={active.status}
                    onChange={(e) => {
                      const result = ops.setStatus(
                        active.caseId,
                        e.target.value as CaseStatus,
                      );
                      setNotice(
                        result.ok
                          ? "対応状況を更新しました。"
                          : (result.reason ?? ""),
                      );
                    }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  担当者
                  <select
                    aria-label="担当者"
                    value={active.owner}
                    onChange={(e) => {
                      ops.assign(active.caseId, e.target.value);
                      setNotice("担当者を更新しました。");
                    }}
                  >
                    {OWNERS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="reply-section">
                <div>
                  <h4>
                    <Sparkles size={17} /> 返信の下書き
                  </h4>
                  <span className="small muted">ローカルの定型文生成</span>
                </div>
                <p className="small muted">
                  内容に応じた返信案を用意します。確認・編集してご利用ください。
                </p>
                <button
                  className="button primary"
                  onClick={() => {
                    ops.suggest(active.caseId);
                    setNotice("返信案を作成しました。内容を確認してください。");
                  }}
                >
                  <Sparkles size={15} /> 返信案を生成
                </button>

                {/* The draft is read straight off the record rather than
                    mirrored into local state: a copy would drift from what
                    ADMIN and RELAY see, and mirroring it back on every
                    selection change is the kind of effect that quietly
                    overwrites a half-typed reply. */}
                {active.draft && (
                  <>
                    <label className="sr-only" htmlFor="reply">
                      返信案を編集
                    </label>
                    <textarea
                      id="reply"
                      rows={9}
                      value={active.draft}
                      onChange={(e) =>
                        ops.saveDraft(active.caseId, e.target.value)
                      }
                    />
                    <div className="reply-actions">
                      <button
                        className="button secondary"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(active.draft);
                            setNotice(
                              "返信案をコピーしました。外部送信は行っていません。",
                            );
                          } catch {
                            setNotice(
                              "コピーできませんでした。返信案を選択してコピーしてください。",
                            );
                          }
                        }}
                      >
                        <Copy size={15} /> 返信案をコピー
                      </button>
                      {active.approvedAtIso ? (
                        <button
                          className="button secondary"
                          onClick={() => {
                            ops.withdraw(active.caseId);
                            setNotice("確認を差し戻しました。");
                          }}
                        >
                          確認を取り消す
                        </button>
                      ) : (
                        <button
                          className="button primary"
                          onClick={() => {
                            const result = ops.approve(active.caseId);
                            setNotice(
                              result.ok
                                ? "確認済みにしました。メールは送信されません。"
                                : (result.reason ?? ""),
                            );
                          }}
                        >
                          <Check size={15} /> 確認済みにする
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <details className="case-history">
                <summary>
                  この問い合わせの経過（{active.history.length}）
                </summary>
                <ul>
                  {active.history.map((entry, index) => (
                    <li key={`${entry.event}-${index}`}>
                      <b>{entry.event}</b>
                      <span>{entry.detail}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          ) : (
            <div className="empty-state large">
              <Inbox size={30} />
              <h3>一覧から問い合わせを選択してください</h3>
              <p>フィルタに一致する問い合わせの詳細を表示します。</p>
            </div>
          )}
        </div>
      </div>

      <p role="status" className="status-line">
        {notice ||
          "キーワードで自動分類済みです。分類・緊急度は目安として、人が確認してください。"}
      </p>
      <p className="demo-fineprint">
        この一覧は <Link href="/demos/automation">RELAY</Link> が受け付けた分と
        見本データを合わせたものです。対応状況と担当は{" "}
        <Link href="/demos/admin">ADMIN</Link> の集計にもそのまま反映されます。
      </p>
    </div>
  );
}
