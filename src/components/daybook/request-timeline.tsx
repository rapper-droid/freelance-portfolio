"use client";

import { formatJst } from "@/lib/runtime/rules/datetime";
import type { RequestRecord } from "@/lib/daybook/store";

/**
 * What happened to one request, in order.
 *
 * Refusals are in here alongside successes. A booking that could not be
 * confirmed because nobody had agreed is the clearest evidence the rule is
 * enforced, and hiding it would leave only the assertion.
 */
export function RequestTimeline({ record }: { record: RequestRecord }) {
  return (
    <details className="daybook-timeline">
      <summary>この依頼の記録（{record.timeline.length}件）</summary>
      <ol>
        {record.timeline.map((entry, index) => (
          <li key={`${entry.at}-${index}`}>
            <p className="daybook-timeline-head">
              <span className="daybook-timeline-event">{entry.event}</span>
              <time dateTime={entry.at}>{formatJst(entry.at)}</time>
            </p>
            <p>{entry.detail}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
