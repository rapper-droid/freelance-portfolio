"use client";

import { useId, useState } from "react";
import { formatJst } from "@/lib/runtime/rules/datetime";
import type { SlotVerdict } from "@/lib/runtime/rules/availability";

/**
 * One list of times to choose from, grouped by day.
 *
 * Candidates arrive nearest-first, which is the order that answers the
 * question that was asked. Grouping by day keeps that order while making the
 * dates readable, so the first group is the nearest day rather than the
 * earliest one on the calendar.
 */
export function SlotPicker({
  slots,
  onChoose,
  action,
  busyLabel,
  emptyNote,
}: {
  slots: SlotVerdict[];
  onChoose: (startIso: string) => void;
  action: string;
  busyLabel?: string;
  emptyNote: string;
}) {
  const name = useId();
  const [chosen, setChosen] = useState("");

  if (slots.length === 0) return <p className="daybook-empty">{emptyNote}</p>;

  const days: Array<{ key: string; label: string; slots: SlotVerdict[] }> = [];
  for (const slot of slots) {
    const label = formatJst(slot.startIso, { withTime: false });
    const found = days.find((d) => d.key === label);
    if (found) found.slots.push(slot);
    else days.push({ key: label, label, slots: [slot] });
  }

  return (
    <div className="daybook-picker">
      <fieldset>
        <legend className="sr-only">候補の日時</legend>
        {days.map((day) => (
          <div key={day.key} className="daybook-picker-day">
            <p className="daybook-picker-date">{day.label}</p>
            <div className="daybook-picker-times">
              {day.slots.map((slot) => (
                <label key={slot.startIso} className="daybook-slot">
                  <input
                    type="radio"
                    name={name}
                    value={slot.startIso}
                    checked={chosen === slot.startIso}
                    onChange={() => setChosen(slot.startIso)}
                  />
                  <span>{formatJst(slot.startIso).slice(-5)}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>
      <button
        type="button"
        className="daybook-button"
        disabled={!chosen}
        onClick={() => {
          onChoose(chosen);
          setChosen("");
        }}
      >
        {chosen ? action : (busyLabel ?? "まず候補を選んでください")}
      </button>
    </div>
  );
}
