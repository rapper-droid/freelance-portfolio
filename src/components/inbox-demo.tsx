"use client";
import { useState } from "react";
import { Inbox, Search, Sparkles, Copy, RotateCcw } from "lucide-react";
import { tickets, classify, replyDraft, type Ticket } from "@/lib/inbox";
export function InboxDemo() {
  const [items, setItems] = useState(tickets);
  const [selected, setSelected] = useState<number | null>(1001);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("すべて");
  const [category, setCategory] = useState("すべて");
  const [urgency, setUrgency] = useState("すべて");
  const [owner, setOwner] = useState("すべて");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const filtered = items.filter((t) => {
    const c = classify(t.subject + t.body);
    return (
      [t.name, t.subject, t.body]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "すべて" || t.status === status) &&
      (category === "すべて" || c.category === category) &&
      (urgency === "すべて" || c.urgency === urgency) &&
      (owner === "すべて" || t.owner === owner)
    );
  });
  const ticket = filtered.find((t) => t.id === selected);
  const info = ticket ? classify(ticket.subject + ticket.body) : null;
  function update(patch: Partial<Ticket>) {
    setItems(items.map((t) => (t.id === selected ? { ...t, ...patch } : t)));
    setNotice("対応状況を更新しました。");
  }
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
            setItems(tickets);
            setQuery("");
            setStatus("すべて");
            setCategory("すべて");
            setUrgency("すべて");
            setOwner("すべて");
            setSelected(1001);
            setDraft("");
            setNotice("初期データに戻しました。");
          }}
        >
          <RotateCcw size={14} /> リセット
        </button>
      </div>
      <div className="stats-grid inbox-stats">
        {["すべて", "未対応", "対応中", "完了"].map((s) => (
          <button
            key={s}
            className={`stat stat-button ${status === s ? "selected" : ""}`}
            onClick={() => {
              setStatus(s);
              setDraft("");
            }}
            aria-pressed={status === s}
          >
            <span>{s}</span>
            <strong>
              {s === "すべて"
                ? items.length
                : items.filter((t) => t.status === s).length}
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
            onChange={(e) => {
              setQuery(e.target.value);
              setDraft("");
            }}
          />
        </label>
        {[
          {
            label: "カテゴリ",
            value: category,
            set: setCategory,
            opts: ["請求", "不具合", "契約", "お問い合わせ"],
          },
          {
            label: "緊急度",
            value: urgency,
            set: setUrgency,
            opts: ["高", "中", "通常"],
          },
          {
            label: "担当",
            value: owner,
            set: setOwner,
            opts: ["未割当", "担当A", "担当B"],
          },
        ].map((f) => (
          <label className="filter-label" key={f.label}>
            {f.label}
            <select
              aria-label={f.label}
              value={f.value}
              onChange={(e) => {
                f.set(e.target.value);
                setDraft("");
              }}
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
          {filtered.map((t) => {
            const c = classify(t.subject + t.body);
            return (
              <button
                className={`ticket ${selected === t.id ? "active" : ""}`}
                key={t.id}
                onClick={() => {
                  setSelected(t.id);
                  setDraft("");
                  setNotice("");
                }}
                aria-pressed={selected === t.id}
              >
                <div>
                  <b>{t.name}</b>
                  <small>{t.date}</small>
                </div>
                <h3>{t.subject}</h3>
                <p>{t.body}</p>
                <div>
                  <span className="badge">{c.category}</span>
                  <span
                    className={`badge ${c.urgency === "高" ? "warning" : ""}`}
                  >
                    緊急度：{c.urgency}
                  </span>
                  <small>{t.status}</small>
                </div>
              </button>
            );
          })}
          {!filtered.length && (
            <div className="empty-state">
              該当する問い合わせがありません。
              <button
                className="button secondary"
                onClick={() => {
                  setQuery("");
                  setStatus("すべて");
                  setCategory("すべて");
                  setUrgency("すべて");
                  setOwner("すべて");
                }}
              >
                絞り込みを解除
              </button>
            </div>
          )}
        </div>
        <div className="ticket-detail">
          {ticket && info ? (
            <>
              <div className="detail-meta">
                <span className="eyebrow">TICKET #{ticket.id}</span>
                <span className="badge">
                  {info.category} / 緊急度：{info.urgency}
                </span>
              </div>
              <h3>{ticket.subject}</h3>
              <p className="small muted">
                {ticket.name} · {ticket.date} · 架空の問い合わせ
              </p>
              <p className="ticket-body">{ticket.body}</p>
              <div className="assignment">
                <label>
                  対応状況
                  <select
                    aria-label="対応状況"
                    value={ticket.status}
                    onChange={(e) =>
                      update({ status: e.target.value as Ticket["status"] })
                    }
                  >
                    {["未対応", "対応中", "完了"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  担当者
                  <select
                    aria-label="担当者"
                    value={ticket.owner}
                    onChange={(e) => update({ owner: e.target.value })}
                  >
                    {["未割当", "担当A", "担当B"].map((s) => (
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
                    setDraft(replyDraft(ticket));
                    setNotice("返信案を作成しました。内容を確認してください。");
                  }}
                >
                  <Sparkles size={15} /> 返信案を生成
                </button>
                {draft && (
                  <>
                    <label className="sr-only" htmlFor="reply">
                      返信案を編集
                    </label>
                    <textarea
                      id="reply"
                      rows={9}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <button
                      className="button secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(draft);
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
                  </>
                )}
              </div>
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
      <p className="small muted option-note">
        「至急・緊急・停止・本日中」を高、「確認・期限」を中と判定。請求→不具合→契約の順にキーワードを照合します。変更は再読み込みで初期化されます。メール送信機能はありません。
      </p>
    </div>
  );
}
