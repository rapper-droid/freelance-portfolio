"use client";

import { useState } from "react";
import { boundaries, enumSets, recordShapes } from "@/lib/automation/schema";

/**
 * The contract itself (指示書 §17).
 *
 * Read from the runtime's exported constants rather than retyped, so the day
 * somebody adds a status this page gains it instead of quietly lying. The
 * boundaries are listed first because "what will this thing not do" is the
 * question a technical reader has before any of the rest.
 */
export function SchemaPanel() {
  const [open, setOpen] = useState<string | null>(enumSets[0].id);

  return (
    <section className="auto-panel" aria-labelledby="schema-h">
      <h2 id="schema-h">2. スキーマと境界</h2>

      <div className="auto-boundaries">
        {boundaries.map((b) => (
          <div key={b.title}>
            <h3>{b.title}</h3>
            <p>{b.detail}</p>
          </div>
        ))}
      </div>

      <h3>閉じた集合</h3>
      <p className="auto-lead">
        {
          "いずれもコードの定数から読み出しています。ここに無い値は、計画を作る側が作り出すこともできません。"
        }
      </p>

      <div className="auto-enums">
        {enumSets.map((set) => (
          <div key={set.id} className="auto-enum">
            <button
              type="button"
              onClick={() => setOpen(open === set.id ? null : set.id)}
              aria-expanded={open === set.id}
            >
              <b>{set.title}</b>
              <span>{set.values.length} 個</span>
              <code>{set.source}</code>
            </button>
            {open === set.id && (
              <div className="auto-enum-body">
                <p className="auto-note">{set.description}</p>
                <ul className="auto-list">
                  {set.values.map((v) => (
                    <li key={v.value}>
                      <b>
                        <code>{v.value}</code>
                        {v.flag && <span className="auto-tag">{v.flag}</span>}
                      </b>
                      <span>{v.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <h3>記録の形</h3>
      <div className="auto-shapes">
        {recordShapes.map((shape) => (
          <details key={shape.id}>
            <summary>
              {shape.title} <code>{shape.source}</code>
            </summary>
            <p className="auto-note">{shape.description}</p>
            <div
              className="auto-table-scroll"
              tabIndex={0}
              role="region"
              aria-label={`${shape.title} の項目`}
            >
              <table className="auto-table">
                <caption className="sr-only">{shape.title} の項目</caption>
                <thead>
                  <tr>
                    <th scope="col">項目</th>
                    <th scope="col">型</th>
                    <th scope="col">意味</th>
                  </tr>
                </thead>
                <tbody>
                  {shape.fields.map((f) => (
                    <tr key={f.name}>
                      <th scope="row">
                        <code>{f.name}</code>
                      </th>
                      <td data-label="型">
                        <code>{f.type}</code>
                      </td>
                      <td data-label="意味">{f.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
