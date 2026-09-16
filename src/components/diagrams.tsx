import type { ReactNode } from "react";

/**
 * TETSU WORKS explanatory diagrams.
 *
 * Built as semantic HTML that is then styled to read as a diagram, rather
 * than as pictures with captions. That ordering is deliberate: the list, the
 * steps and the comparison are real markup, so a screen reader, a search
 * engine, and a stylesheet-less render all still get the information. The
 * connectors and glyphs are the only SVG, and they are decorative.
 *
 * Visually they follow the brand: a line that lights as the work moves along
 * it, ember nodes at the points where something happens. No gauges, no
 * progress rings, nothing that would make a site that takes commissions look
 * like a game.
 */

/* ------------------------------------------------------------------ */

/**
 * A stage in a left-to-right (or, on mobile, top-to-bottom) sequence.
 * `note` is what actually happens; `actor` says who does it, which is the
 * question clients ask most often about automation work.
 */
export type Stage = {
  label: string;
  note?: string;
  actor?: "人" | "自動" | "AI";
};

export function Pipeline({
  stages,
  caption,
  id,
}: {
  stages: Stage[];
  caption?: string;
  id?: string;
}) {
  return (
    <figure className="works-dia works-pipeline" id={id}>
      <ol>
        {stages.map((s, i) => (
          <li key={s.label} data-actor={s.actor ?? "自動"}>
            <span className="works-node" aria-hidden="true" />
            <span className="works-step-n">
              {String(i + 1).padStart(2, "0")}
            </span>
            <b>{s.label}</b>
            {s.note ? <span className="works-note">{s.note}</span> : null}
            {s.actor ? (
              <span className="works-actor" data-actor={s.actor}>
                {s.actor}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Before / TETSU WORKS / After.
 *
 * A description list rather than three columns of divs: each "before" is a
 * term and its "after" is the description, so the pairing survives without
 * the layout.
 */
export function BeforeAfter({
  rows,
  via = "TETSU WORKS",
  caption,
}: {
  rows: { before: string; after: string }[];
  via?: string;
  caption?: string;
}) {
  return (
    <figure className="works-dia works-ba">
      {/* The via label sits on its own line. It used to occupy the narrow
          arrow column between the two headings, where a name as long as
          "TETSU WORKS" overflowed and collided with "AFTER". */}
      <p className="works-ba-via" aria-hidden="true">
        {via}
      </p>
      <div className="works-ba-head" aria-hidden="true">
        <span>BEFORE</span>
        <span />
        <span>AFTER</span>
      </div>
      <dl>
        {rows.map((r) => (
          <div key={r.before} className="works-ba-row">
            <dt>
              <span className="works-ba-tag">BEFORE</span>
              {r.before}
            </dt>
            <span className="works-arrow" aria-hidden="true">
              <svg viewBox="0 0 40 12" width="40" height="12" focusable="false">
                <path
                  d="M0 6h30"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
                <path
                  d="M28 2l6 4-6 4"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
            </span>
            <dd>
              <span className="works-ba-tag works-ba-tag--after">AFTER</span>
              {r.after}
            </dd>
          </div>
        ))}
      </dl>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/* ------------------------------------------------------------------ */

/**
 * What is actually handed over, shown as a stack of labelled parts.
 * Each item keeps its own heading and description so the section still reads
 * correctly as prose.
 */
export function DeliveryStack({
  items,
  caption,
}: {
  items: { title: string; note: string; icon?: ReactNode }[];
  caption?: string;
}) {
  return (
    <figure className="works-dia works-stack">
      <ul>
        {items.map((it) => (
          <li key={it.title}>
            <span className="works-stack-mark" aria-hidden="true">
              {it.icon ?? <GlyphBox />}
            </span>
            <b>{it.title}</b>
            <span className="works-note">{it.note}</span>
          </li>
        ))}
      </ul>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/* ------------------------------------------------------------------ */

/** Decorative glyphs. Always aria-hidden — the label beside them is the content. */

export function GlyphBox() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
      <path
        d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M3 7.5 12 12l9-4.5M12 12v9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GlyphCode() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
      <path
        d="M9 6 4 12l5 6M15 6l5 6-5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GlyphDoc() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
      <path
        d="M6 3h8l4 4v14H6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v4h4M9 12h6M9 16h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GlyphCheck() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="m8 12 3 3 5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

/** Phase glyphs. Decorative; the phase name sits beside each one. */
const PHASE_ART: Record<string, React.ReactNode> = {
  talk: (
    <>
      <path
        d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-5 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M8 9h8M8 12h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  ),
  draft: (
    <>
      <path
        d="M4 5h16v14H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M4 9h16M9 9v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M12 12h5M12 15h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  ),
  build: (
    <>
      <path
        d="M8 6 3 12l5 6M16 6l5 6-5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m13 5-2 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  ),
  deliver: (
    <>
      <path
        d="M3 8 12 4l9 4v8l-9 4-9-4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M3 8l9 4 9-4M12 12v8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </>
  ),
};

export type Phase = {
  label: string;
  note: string;
  icon: string;
  checkpoint: string | null;
  steps: string[];
};

/**
 * The route from brief to delivery, as four cards.
 *
 * Replaces a hairline rule with numbers on it. The change that matters is
 * not that it is prettier: each phase now carries its own steps, so the ten
 * detailed steps are no longer a second list repeating the first, and the
 * points where the CLIENT has to do something are called out. "When do I
 * have to be available, and what am I agreeing to" is the question this
 * section exists to answer.
 */
export function PhaseFlow({ phases }: { phases: Phase[] }) {
  return (
    <ol className="works-phases">
      {phases.map((p, i) => (
        <li key={p.label} className="works-phase">
          <div className="works-phase-top">
            <span className="works-phase-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
                {PHASE_ART[p.icon]}
              </svg>
            </span>
            <span className="works-phase-n">
              PHASE {String(i + 1).padStart(2, "0")}
            </span>
          </div>
          <h3>{p.label}</h3>
          <p className="works-phase-note">{p.note}</p>
          <ul className="works-phase-steps">
            {p.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          {p.checkpoint ? (
            <p className="works-phase-check">
              <span aria-hidden="true" className="works-phase-check-mark" />
              <span>
                <b>ご確認いただく場面</b>
                {p.checkpoint}
              </span>
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
