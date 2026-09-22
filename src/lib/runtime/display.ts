/**
 * Rendering stored values for people.
 *
 * Kept apart from the workflows so the server draft and the browser panel
 * show the same thing. Internal enum names and bare numbers belong in a
 * record, not in a sentence a customer reads: "ご相談の種類：booking" and
 * "所要時間：60" both read as a leak.
 *
 * This module has no Node dependencies on purpose — a client component
 * imports it directly.
 */

export const FIELD_LABELS: Record<string, string> = {
  intent: "ご相談の種類",
  currentTools: "いま使っている道具",
  cadence: "頻度",
  volume: "件数",
  durationMinutes: "所要時間",
  bufferMinutes: "準備・片付け時間",
  staffing: "対応する人数",
  availabilityNote: "対応できる曜日・時間",
  startDate: "希望日",
  startTime: "希望時刻",
};

export const INTENT_LABELS: Record<string, string> = {
  booking: "予約・日程調整",
  quote: "お見積り",
  incident: "不具合のご連絡",
  billing: "請求について",
  contract: "ご契約について",
};

export const fieldLabel = (field: string) => FIELD_LABELS[field] ?? field;

/** The stored value is never changed; only its rendering differs. */
export function displayValue(field: string, value: string): string {
  if (field === "intent") return INTENT_LABELS[value] ?? value;
  if (field === "durationMinutes" || field === "bufferMinutes")
    return /^\d+$/.test(value) ? `${value}分` : value;
  return value;
}
