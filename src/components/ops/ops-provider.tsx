"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  approveDraft,
  assign,
  caseTotals,
  linkCustomer,
  mergedCases,
  newCase,
  saveDraft,
  setStatus,
  suggestDraft,
  withdrawApproval,
  type CaseTotals,
} from "@/lib/ops/cases";
import {
  exportOpsState,
  importOpsState,
  loadOpsState,
  resetOpsState,
  saveOpsState,
  newSandboxId,
} from "@/lib/ops/store";
import { emptyOpsState } from "@/lib/ops/cases";
import type { CaseStatus, OpsCase, OpsState } from "@/lib/ops/types";

/**
 * The record RELAY, SMART INBOX and ADMIN share (指示書 §14).
 *
 * The three screens are three routes, so they do not share a React tree; they
 * share this storage. Approving a reply in RELAY puts a case in the inbox, and
 * the customer list can point at the enquiries it is the record of, because
 * all three are reading the same rows rather than three fixtures that happen
 * to look similar.
 *
 * The sample cases are not stored. They are regenerated from today's clock on
 * every read and merged with whatever this visitor actually did, so changing
 * the sample in a later build does not leave stale copies behind.
 */

type OpsContextValue = {
  cases: OpsCase[];
  totals: CaseTotals;
  ready: boolean;
  notice: string;
  nowIso: string;
  /** Files a new enquiry and returns it, so the caller can show what it made. */
  file: (input: {
    customerName: string;
    subject: string;
    body: string;
    owner?: string;
  }) => OpsCase;
  setStatus: (
    caseId: string,
    to: CaseStatus,
  ) => { ok: boolean; reason?: string };
  assign: (caseId: string, owner: string) => void;
  saveDraft: (caseId: string, draft: string) => void;
  suggest: (caseId: string) => void;
  approve: (caseId: string) => { ok: boolean; reason?: string };
  withdraw: (caseId: string) => void;
  link: (caseId: string, customerId: string, customerName: string) => void;
  dismiss: (caseId: string) => void;
  reset: () => void;
  /** The visitor's own copy of this sandbox, to keep or carry. */
  exportData: () => string;
  /** Returns a message when the file was refused, null when taken. */
  importData: (text: string) => string | null;
};

const OpsContext = createContext<OpsContextValue | null>(null);

export function useOps(): OpsContextValue {
  const value = useContext(OpsContext);
  if (!value) throw new Error("useOps must be used inside <OpsProvider>");
  return value;
}

export function OpsProvider({
  children,
  /** Fixed on the server so the markup matches; replaced after mount. */
  referenceIso,
}: {
  children: React.ReactNode;
  referenceIso: string;
}) {
  const [state, setState] = useState<OpsState>(() =>
    emptyOpsState(referenceIso, "server"),
  );
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [nowIso, setNowIso] = useState(referenceIso);
  const loaded = useRef(false);

  /**
   * The state the mutations read.
   *
   * RELAY files a case, writes its draft and approves it in one handler, and
   * React has not re-rendered in between — so an operation reading the
   * closed-over `state` would look for a case that, as far as its copy is
   * concerned, does not exist yet. It failed exactly that way: the case was
   * filed and the approval was then refused as "not found".
   */
  const live = useRef(state);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const now = new Date().toISOString();
    const { state: stored, note } = loadOpsState(now);
    live.current = stored;
    setState(stored);
    setNotice(note ?? "");
    setNowIso(now);
    setReady(true);
  }, []);

  const commit = useCallback((next: OpsState) => {
    const stamped = { ...next, updatedAtIso: new Date().toISOString() };
    live.current = stamped;
    setState(stamped);
    if (!saveOpsState(stamped))
      setNotice(
        "このブラウザでは保存できないため、タブを閉じると内容は消えます。",
      );
  }, []);

  const value = useMemo<OpsContextValue>(() => {
    const cases = mergedCases(state, nowIso);
    const now = () => new Date().toISOString();

    /**
     * Writes one case back.
     *
     * A seeded case being edited for the first time is not in storage yet, so
     * it is appended rather than mapped over; mapping alone would drop the
     * edit and leave the screen showing the sample again.
     */
    const put = (next: OpsCase) => {
      const current = live.current;
      const known = current.cases.some((c) => c.caseId === next.caseId);
      commit({
        ...current,
        cases: known
          ? current.cases.map((c) => (c.caseId === next.caseId ? next : c))
          : [...current.cases, next],
      });
    };

    const find = (caseId: string) =>
      mergedCases(live.current, nowIso).find((c) => c.caseId === caseId);

    return {
      cases,
      totals: caseTotals(cases),
      ready,
      notice,
      nowIso,

      file: (input) => {
        const created = newCase({
          ...input,
          receivedAtIso: now(),
          source: "relay",
        });
        commit({ ...live.current, cases: [...live.current.cases, created] });
        return created;
      },

      setStatus: (caseId, to) => {
        const found = find(caseId);
        if (!found) return { ok: false, reason: "対応記録が見つかりません。" };
        const result = setStatus(found, to, now());
        if (!result.ok) return { ok: false, reason: result.reason };
        put(result.case);
        return { ok: true };
      },

      assign: (caseId, owner) => {
        const found = find(caseId);
        if (found) put(assign(found, owner, now()));
      },

      saveDraft: (caseId, draft) => {
        const found = find(caseId);
        if (found) put(saveDraft(found, draft, now()));
      },

      suggest: (caseId) => {
        const found = find(caseId);
        if (found) put(suggestDraft(found, now()));
      },

      approve: (caseId) => {
        const found = find(caseId);
        if (!found) return { ok: false, reason: "対応記録が見つかりません。" };
        const result = approveDraft(found, now());
        if (!result.ok) return { ok: false, reason: result.reason };
        put(result.case);
        return { ok: true };
      },

      withdraw: (caseId) => {
        const found = find(caseId);
        if (found) put(withdrawApproval(found, now()));
      },

      link: (caseId, customerId, customerName) => {
        const found = find(caseId);
        if (found) put(linkCustomer(found, customerId, customerName, now()));
      },

      dismiss: (caseId) => {
        const current = live.current;
        const seeded = caseId.startsWith("case-seed-");
        commit({
          ...current,
          cases: current.cases.filter((c) => c.caseId !== caseId),
          dismissedSeedIds: seeded
            ? [...new Set([...current.dismissedSeedIds, caseId])]
            : current.dismissedSeedIds,
        });
      },

      reset: () => {
        const fresh = resetOpsState(new Date().toISOString());
        live.current = fresh;
        setState(fresh);
        setNotice("この端末の対応記録を初期化しました。");
      },

      exportData: () => exportOpsState(live.current),
      importData: (text: string) => {
        const result = importOpsState(text, new Date().toISOString());
        if (!result.ok) return result.reason;
        commit(result.state);
        setNotice(result.note ?? "");
        return null;
      },
    };
  }, [state, ready, notice, nowIso, commit]);

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

export { newSandboxId };
