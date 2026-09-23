"use client";

import { useState } from "react";
import Link from "next/link";
import { Link2, Plus } from "lucide-react";
import { useOps } from "./ops-provider";
import { receivedLabel } from "@/lib/ops/cases";
import type { Customer } from "@/lib/admin";

/**
 * The join between the customer list and the enquiries (指示書 §14).
 *
 * ADMIN was a customer list with no idea what any of those customers had
 * written in about, and SMART INBOX was a list of enquiries from names that
 * matched nothing. This is the one place a case is attached to a row — either
 * to a customer that already exists, or to one created from the enquiry.
 *
 * Nothing is matched automatically. Two customers can share a name, and
 * guessing wrong here would put one company's support history under another.
 */
export function CaseLinkPanel({
  customers,
  onCreateCustomer,
}: {
  customers: Customer[];
  /** Creates a customer row and returns its id, or null if it was refused. */
  onCreateCustomer: (name: string) => string | null;
}) {
  const ops = useOps();
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const unlinked = ops.cases.filter((c) => !c.customerId);

  return (
    <section className="case-link" aria-labelledby="case-link-heading">
      <div className="table-toolbar">
        <div>
          <h3 id="case-link-heading">
            問い合わせとの紐づけ{" "}
            <span className="badge">{unlinked.length}件 未紐づけ</span>
          </h3>
          <p className="small muted">
            <Link href="/demos/inbox">SMART INBOX</Link> と{" "}
            <Link href="/demos/automation">RELAY</Link>{" "}
            が扱う記録と同じものです。顧客に紐づけると、この一覧の件数に入ります。
          </p>
        </div>
      </div>

      {unlinked.length === 0 ? (
        <p className="small muted">未紐づけの問い合わせはありません。</p>
      ) : (
        <ul className="case-link-list">
          {unlinked.map((c) => (
            <li key={c.caseId}>
              <div className="case-link-body">
                <span className="eyebrow">{c.reference}</span>
                <b>{c.customerName}</b>
                <p>{c.subject || c.body.slice(0, 40)}</p>
                <small>
                  {c.category} / 緊急度：{c.urgency} /{" "}
                  {receivedLabel(c, ops.nowIso)}
                </small>
              </div>
              <div className="case-link-actions">
                <label className="filter-label">
                  <span className="sr-only">
                    {c.customerName}の問い合わせを紐づける顧客
                  </span>
                  <select
                    aria-label={`${c.reference}の紐づけ先`}
                    value={choice[c.caseId] ?? ""}
                    onChange={(e) =>
                      setChoice({ ...choice, [c.caseId]: e.target.value })
                    }
                  >
                    <option value="">顧客を選ぶ</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button secondary"
                  disabled={!choice[c.caseId]}
                  onClick={() => {
                    const id = choice[c.caseId];
                    const customer = customers.find((x) => x.id === id);
                    if (!customer) return;
                    ops.link(c.caseId, customer.id, customer.name);
                    setNotice(
                      `${c.reference} を ${customer.name} に紐づけました。`,
                    );
                  }}
                >
                  <Link2 size={15} /> 紐づける
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    const id = onCreateCustomer(c.customerName);
                    if (!id) {
                      setNotice("顧客を追加できませんでした。");
                      return;
                    }
                    ops.link(c.caseId, id, c.customerName);
                    setNotice(
                      `${c.customerName} を顧客として追加し、${c.reference} を紐づけました。`,
                    );
                  }}
                >
                  <Plus size={15} /> 顧客として追加
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Announced politely without claiming the `status` role: ADMIN already
          has one status region, and a second would make "the status line"
          ambiguous to a screen reader and to anything looking for it. */}
      <p aria-live="polite" className="small muted">
        {notice}
      </p>
    </section>
  );
}

/** How many enquiries this customer row is the record of. */
export function CaseCount({ customerId }: { customerId: string }) {
  const ops = useOps();
  const mine = ops.cases.filter((c) => c.customerId === customerId);
  if (!mine.length) return <span className="small muted">—</span>;
  const open = mine.filter((c) => c.status !== "完了").length;
  return (
    <Link href="/demos/inbox" className="case-count">
      {mine.length} 件
      {open > 0 && <span className="badge warning">未完了 {open}</span>}
    </Link>
  );
}
