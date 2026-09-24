import {
  backupNote,
  exportText,
  importSandbox,
  keepBackup,
  readRaw,
  writeRaw,
  type ImportResult,
} from "../runtime/sandbox";
import type { Booking, SlotVerdict } from "../runtime/rules/availability";

/**
 * DAYBOOK's sandbox (指示書 §14).
 *
 * The domain for this — business hours, buffers, conflict detection,
 * alternative slots, holds that expire, and a confirmation that needs *both*
 * the requester's agreement and the operator's approval — was already written
 * and tested. What it never had was somewhere to keep a booking between two
 * page loads, which is why the demo reset every time and could only ever show
 * the first half of the story.
 *
 * The half it could not show is the half the spec calls mandatory: the slot
 * somebody wants is taken, they take an alternative, and then next week they
 * ask to move it.
 */

export const DAYBOOK_SCHEMA_VERSION = 1;
export const DAYBOOK_STORAGE_KEY = "tsudowa-daybook-sandbox-v1";

/** One enquiry and everything that happened to it. */
export type RequestRecord = {
  requestId: string;
  requesterName: string;
  requesterEmail: string;
  text: string;
  receivedAtIso: string;
  /** The slot the message asked for, when one could be read out of it. */
  requestedIso: string | null;
  /** Offered because the requested slot was unavailable, or none was given. */
  proposals: SlotVerdict[];
  bookingId: string | null;
  /** Both are required before a booking can be confirmed. */
  requesterAgreedAt: string | null;
  adminApprovedAt: string | null;
  /**
   * The time a confirmed booking is being moved to, while it is being moved.
   * The booking itself stays where it is — and keeps blocking its old slot —
   * until the move is approved, so a change that is never answered leaves the
   * appointment intact (指示書 §08-3).
   */
  moveToIso: string | null;
  timeline: Array<{ at: string; event: string; detail: string }>;
};

export type DaybookState = {
  schemaVersion: number;
  sandboxId: string;
  bookings: Booking[];
  requests: RequestRecord[];
  createdAtIso: string;
  updatedAtIso: string;
};

export const emptyDaybookState = (
  nowIso: string,
  sandboxId: string,
): DaybookState => ({
  schemaVersion: DAYBOOK_SCHEMA_VERSION,
  sandboxId,
  bookings: [],
  requests: [],
  createdAtIso: nowIso,
  updatedAtIso: nowIso,
});

export function newSandboxId(): string {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

export type DaybookMigration = { state: DaybookState; note?: string };

const isBooking = (v: unknown): v is Booking => {
  const b = v as Partial<Booking>;
  return (
    !!b && typeof b.bookingId === "string" && typeof b.startIso === "string"
  );
};

const isRequest = (v: unknown): v is RequestRecord => {
  const r = v as Partial<RequestRecord>;
  return !!r && typeof r.requestId === "string" && Array.isArray(r.timeline);
};

export function migrateDaybook(raw: unknown, nowIso: string): DaybookMigration {
  if (!raw || typeof raw !== "object")
    return { state: emptyDaybookState(nowIso, newSandboxId()) };

  const value = raw as Partial<DaybookState>;
  const version =
    typeof value.schemaVersion === "number" ? value.schemaVersion : 0;

  if (version > DAYBOOK_SCHEMA_VERSION) {
    const kept = keepBackup(
      DAYBOOK_STORAGE_KEY,
      JSON.stringify(raw),
      `schemaVersion ${version} > ${DAYBOOK_SCHEMA_VERSION}`,
      nowIso,
    );
    return {
      state: emptyDaybookState(nowIso, newSandboxId()),
      note:
        "新しい版で保存されたデータのため、この画面では読み込みませんでした。" +
        backupNote(kept),
    };
  }

  const base = emptyDaybookState(nowIso, value.sandboxId || newSandboxId());
  const bookings = Array.isArray(value.bookings)
    ? value.bookings.filter(isBooking)
    : [];
  const requests = Array.isArray(value.requests)
    ? value.requests.filter(isRequest)
    : [];
  const dropped =
    (Array.isArray(value.bookings)
      ? value.bookings.length - bookings.length
      : 0) +
    (Array.isArray(value.requests)
      ? value.requests.length - requests.length
      : 0);

  const notes: string[] = [];
  if (version < DAYBOOK_SCHEMA_VERSION && (bookings.length || requests.length))
    notes.push(
      `保存されていた予約を${version ? `版 ${version}` : "旧形式"}から版 ${DAYBOOK_SCHEMA_VERSION} へ更新しました。内容はそのまま引き継いでいます。`,
    );
  if (dropped)
    notes.push(`読み取れなかった ${dropped} 件を除いて読み込みました。`);

  return {
    state: {
      ...base,
      bookings,
      requests,
      createdAtIso: value.createdAtIso ?? nowIso,
      updatedAtIso: nowIso,
      schemaVersion: DAYBOOK_SCHEMA_VERSION,
    },
    note: notes.length ? notes.join(" ") : undefined,
  };
}

export function loadDaybookState(nowIso: string): DaybookMigration {
  const read = readRaw(DAYBOOK_STORAGE_KEY);
  if (read.ok)
    return read.value === null
      ? { state: emptyDaybookState(nowIso, newSandboxId()) }
      : migrateDaybook(read.value, nowIso);

  if (read.fault === "unavailable")
    return {
      state: emptyDaybookState(nowIso, newSandboxId()),
      note: "このブラウザでは保存が使えないため、このタブの間だけの体験になります。",
    };

  const kept = keepBackup(
    DAYBOOK_STORAGE_KEY,
    read.text ?? "",
    "unreadable",
    nowIso,
  );
  return {
    state: emptyDaybookState(nowIso, newSandboxId()),
    note: "保存されていた予約を読み込めませんでした。" + backupNote(kept),
  };
}

export const saveDaybookState = (state: DaybookState) =>
  writeRaw(DAYBOOK_STORAGE_KEY, state);

export function resetDaybookState(nowIso: string): DaybookState {
  const fresh = emptyDaybookState(nowIso, newSandboxId());
  saveDaybookState(fresh);
  return fresh;
}

export const exportDaybookState = (state: DaybookState) => exportText(state);

/** Bookings plus requests together belong to no other sandbox. */
const looksLikeDaybook = (raw: unknown) => {
  const value = raw as Partial<DaybookState>;
  return Array.isArray(value?.bookings) && Array.isArray(value?.requests);
};

export function importDaybookState(
  text: string,
  nowIso: string,
): ImportResult<DaybookState> {
  return importSandbox(text, nowIso, migrateDaybook, looksLikeDaybook);
}

export const DAYBOOK_STORAGE_DISCLOSURE =
  "この体験の予約希望・仮押さえ・確定は、お使いのブラウザの中だけに保存されます。サーバーには送信されず、他の訪問者とは共有されません。";
