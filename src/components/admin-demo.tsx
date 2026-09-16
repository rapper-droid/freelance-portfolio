"use client";
import { useEffect, useRef, useState } from "react";
import { RevenueOverview } from "./operations-overview";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  History as HistoryIcon,
  RotateCcw,
} from "lucide-react";
import {
  initialAdmin,
  isAdminData,
  type AdminData,
  type Customer,
} from "@/lib/admin";
const KEY = "works-admin-v1";
const blank = {
  name: "",
  contact: "",
  status: "見込み" as Customer["status"],
  revenue: 0,
};
export function AdminDemo() {
  const [data, setData] = useState<AdminData>(initialAdmin);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("すべて");
  const [edit, setEdit] = useState<Customer | null>(null);
  const [form, setForm] = useState(blank);
  const [remove, setRemove] = useState<Customer | null>(null);
  const [reset, setReset] = useState(false);
  const [formError, setFormError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const confirmDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const value: unknown = JSON.parse(raw);
          if (isAdminData(value)) setData(value);
          else
            setStorageError(
              "保存データの形式が不正なため、サンプルを表示しています。次の変更で上書きします。",
            );
        }
      } catch {
        setStorageError(
          "保存データを読み込めませんでした。サンプルを表示しています。",
        );
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  function commit(next: AdminData, text: string) {
    setData(next);
    setNotice(text);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError(
        "ブラウザに保存できません。この画面では操作できますが、再読み込みで変更が失われます。",
      );
    }
  }
  function save() {
    if (
      !form.name.trim() ||
      !form.contact.trim() ||
      !Number.isFinite(form.revenue) ||
      form.revenue < 0 ||
      form.revenue > 999999999 ||
      !Number.isInteger(form.revenue)
    ) {
      setFormError(
        "顧客名・担当者名と、0〜999,999,999の整数の売上を入力してください。",
      );
      return;
    }
    if (!edit && data.customers.length >= 1000) {
      setFormError("登録できる顧客は1,000件までです。");
      return;
    }
    const customer = {
      ...form,
      name: form.name.trim(),
      contact: form.contact.trim(),
      id: edit?.id ?? crypto.randomUUID(),
    };
    const action = `${customer.name}を${edit ? "更新" : "追加"}しました`;
    commit(
      {
        customers: edit
          ? data.customers.map((c) => (c.id === edit.id ? customer : c))
          : [...data.customers, customer],
        history: [
          {
            id: crypto.randomUUID(),
            text: action,
            at: new Date().toISOString(),
          },
          ...data.history,
        ].slice(0, 30),
      },
      action + "。",
    );
    dialog.current?.close();
  }
  function openEdit(c: Customer | null) {
    setEdit(c);
    setForm(
      c
        ? {
            name: c.name,
            contact: c.contact,
            status: c.status,
            revenue: c.revenue,
          }
        : blank,
    );
    setFormError("");
    dialog.current?.showModal();
  }
  const rows = data.customers.filter(
    (c) =>
      (c.name + c.contact).toLowerCase().includes(query.toLowerCase()) &&
      (filter === "すべて" || c.status === filter),
  );
  return (
    <div className="tool-panel">
      <div className="tool-title">
        <div>
          <Users size={20} />
          <h2>顧客管理ダッシュボード</h2>
        </div>
        <span className="pill">ブラウザに自動保存</span>
      </div>
      {storageError && (
        <p role="alert" className="error-message">
          {storageError}
        </p>
      )}
      <RevenueOverview customers={data.customers} />
      <div className="stats-grid">
        <div className="stat">
          <span>顧客数</span>
          <strong>
            {data.customers.length}
            <small> 社</small>
          </strong>
        </div>
        <div className="stat">
          <span>取引中</span>
          <strong className="green">
            {data.customers.filter((c) => c.status === "取引中").length}
            <small> 社</small>
          </strong>
        </div>
        <div className="stat">
          <span>見込み顧客</span>
          <strong>
            {data.customers.filter((c) => c.status === "見込み").length}
            <small> 社</small>
          </strong>
        </div>
        <div className="stat">
          <span>累計売上（架空データ）</span>
          <strong className="sum-value">
            ¥
            {data.customers
              .reduce((a, c) => a + c.revenue, 0)
              .toLocaleString("ja-JP")}
          </strong>
        </div>
      </div>
      <div className="table-toolbar">
        <div>
          <h3>
            顧客一覧 <span className="badge">{rows.length}件</span>
          </h3>
          <p className="small muted">顧客情報と取引ステータスを一元管理</p>
        </div>
        <button
          className="button primary"
          disabled={!ready}
          onClick={() => openEdit(null)}
        >
          <Plus size={17} /> 顧客を追加
        </button>
      </div>
      <div className="inbox-filter">
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="顧客を検索"
            placeholder="顧客名・担当者名で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="filter-label">
          ステータス
          <select
            aria-label="ステータス"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["すべて", "見込み", "取引中", "休止"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button
          className="button secondary reset-button"
          disabled={!ready}
          onClick={() => {
            setRemove(null);
            setReset(true);
            confirmDialog.current?.showModal();
          }}
        >
          <RotateCcw size={14} /> サンプルに戻す
        </button>
      </div>
      <div
        className="table-scroll"
        role="region"
        tabIndex={0}
        aria-label="顧客一覧"
      >
        <table className="customer-table">
          <thead>
            <tr>
              <th>顧客名</th>
              <th>担当者</th>
              <th>ステータス</th>
              <th>累計売上</th>
              <th className="right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="customer-name">
                    <span className="customer-avatar">
                      {c.name.slice(0, 1)}
                    </span>
                    <b>{c.name}</b>
                  </span>
                </td>
                <td data-label="担当者">{c.contact}</td>
                <td>
                  <span
                    className={`badge ${c.status === "取引中" ? "success" : ""}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td data-label="累計売上">
                  ¥{c.revenue.toLocaleString("ja-JP")}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      disabled={!ready}
                      aria-label={`${c.name}を編集`}
                      onClick={() => openEdit(c)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      disabled={!ready}
                      aria-label={`${c.name}を削除`}
                      onClick={() => {
                        setRemove(c);
                        setReset(false);
                        confirmDialog.current?.showModal();
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty-state">
            該当する顧客がありません。検索条件を変えるか、顧客を追加してください。
          </div>
        )}
      </div>
      <p className="status-line" role="status">
        {notice ||
          "サンプルデータを編集・追加してお試しください。変更はこのブラウザに保存されます。"}
      </p>
      <section className="history-section">
        <h3>
          <HistoryIcon size={17} /> 操作履歴 <small>直近30件</small>
        </h3>
        {data.history.length ? (
          <ul>
            {data.history.map((h) => (
              <li key={h.id}>
                <span>{h.text}</span>
                <time dateTime={h.at}>
                  {new Date(h.at).toLocaleString("ja-JP")}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small muted">
            まだ操作履歴はありません。顧客の追加・編集・削除をすると表示されます。
          </p>
        )}
      </section>
      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby="customer-dialog-title"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="modal-heading">
            <h2 id="customer-dialog-title">
              {edit ? "顧客を編集" : "顧客を追加"}
            </h2>
            <button
              type="button"
              className="icon-button"
              aria-label="閉じる"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} />
            </button>
          </div>
          <p className="small muted">デモ用の架空データを入力してください。</p>
          <label>
            顧客名 <span className="required">必須</span>
            <input
              autoFocus
              required
              maxLength={80}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            担当者名 <span className="required">必須</span>
            <input
              required
              maxLength={80}
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
          </label>
          <label>
            ステータス
            <select
              aria-label="ステータス"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as Customer["status"],
                })
              }
            >
              {["見込み", "取引中", "休止"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            累計売上（円）
            <input
              type="number"
              required
              min={0}
              max={999999999}
              step={1}
              value={Number.isNaN(form.revenue) ? "" : form.revenue}
              onChange={(e) =>
                setForm({
                  ...form,
                  revenue: e.target.value === "" ? NaN : Number(e.target.value),
                })
              }
            />
          </label>
          {formError && (
            <p role="alert" className="error-message">
              {formError}
            </p>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => dialog.current?.close()}
            >
              キャンセル
            </button>
            <button className="button primary" type="submit">
              {edit ? "変更を保存" : "追加する"}
            </button>
          </div>
        </form>
      </dialog>
      <dialog
        ref={confirmDialog}
        className="modal"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title">
          {reset ? "サンプルデータに戻しますか？" : "顧客を削除しますか？"}
        </h2>
        <p>
          {reset
            ? "追加・編集した顧客と操作履歴を初期状態に戻します。"
            : `${remove?.name ?? ""}の顧客情報を削除します。`}
          この操作は取り消せません。
        </p>
        <div className="modal-actions">
          <button
            autoFocus
            className="button secondary"
            onClick={() => confirmDialog.current?.close()}
          >
            キャンセル
          </button>
          <button
            className="button danger-button"
            onClick={() => {
              if (reset) {
                commit(initialAdmin, "サンプルデータに戻しました。");
                setQuery("");
                setFilter("すべて");
              } else if (remove) {
                const text = `${remove.name}を削除しました`;
                commit(
                  {
                    customers: data.customers.filter((c) => c.id !== remove.id),
                    history: [
                      {
                        id: crypto.randomUUID(),
                        text,
                        at: new Date().toISOString(),
                      },
                      ...data.history,
                    ].slice(0, 30),
                  },
                  text + "。",
                );
              }
              confirmDialog.current?.close();
            }}
          >
            {" "}
            {reset ? "初期状態に戻す" : "削除する"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
