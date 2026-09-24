import type { CsvData } from "../csv";
import type { ChangeLogEntry, ProblemRow } from "../runtime/report/compute";
import type { RowFix } from "./types";

/**
 * Corrections to rows the computation could not read (指示書 §15).
 *
 * This is the part that turns a report generator into something somebody
 * would use twice. A file with eleven unreadable rows out of a hundred is
 * normal; a tool that can only tell you about them makes you open the
 * spreadsheet anyway, fix them by hand, and come back — which is the work we
 * are supposed to be removing.
 *
 * Two rules keep it honest:
 *
 * 1. **The source file is never modified.** Fixes are an overlay. The original
 *    value stays available so a reviewer can see what was in the file and what
 *    was counted, side by side.
 * 2. **Every applied fix appears in the change log**, with the row, the column
 *    and both values. A total that silently includes somebody's typed-in
 *    number is worse than a total that excludes the row.
 */

export type FixApplication = {
  data: CsvData;
  applied: RowFix[];
  /** Fixes whose row no longer exists — a different file was loaded. */
  orphaned: RowFix[];
  changeLog: ChangeLogEntry[];
};

/**
 * Returns a copy of the data with the fixes laid over it.
 *
 * A fix naming a column the file does not have is ignored for that column
 * rather than discarded: the other columns in the same fix are still useful,
 * and silently dropping the whole correction would be surprising.
 */
export function applyFixes(data: CsvData, fixes: RowFix[]): FixApplication {
  if (fixes.length === 0)
    return { data, applied: [], orphaned: [], changeLog: [] };

  const rows = data.rows.map((row) => [...row]);
  const applied: RowFix[] = [];
  const orphaned: RowFix[] = [];
  const changeLog: ChangeLogEntry[] = [];

  for (const fix of fixes) {
    // ProblemRow.sourceRow counts the header as row 1.
    const index = fix.sourceRow - 2;
    if (index < 0 || index >= rows.length) {
      orphaned.push(fix);
      continue;
    }

    let touched = false;
    for (const [column, value] of Object.entries(fix.cells)) {
      const at = data.headers.indexOf(column);
      if (at < 0) continue;
      const before = rows[index][at] ?? "";
      if (before === value) continue;
      rows[index][at] = value;
      touched = true;
      changeLog.push({
        kind: "value_normalised",
        sourceRow: fix.sourceRow,
        detail: `${column}: 「${before || "（空欄）"}」→「${value || "（空欄）"}」（手入力での修正${fix.note ? `・${fix.note}` : ""}）`,
      });
    }
    if (touched) applied.push(fix);
    else orphaned.push(fix);
  }

  return { data: { ...data, rows }, applied, orphaned, changeLog };
}

/**
 * The columns worth offering for a given problem row.
 *
 * Everything is editable, but the ones the recipe actually reads come first —
 * a person fixing an unreadable amount should not have to find the amount
 * column among forty others.
 */
export function fixableColumns(
  headers: string[],
  mappedColumns: Array<string | null>,
): { primary: string[]; rest: string[] } {
  const mapped = new Set(mappedColumns.filter((c): c is string => !!c));
  return {
    primary: headers.filter((h) => mapped.has(h)),
    rest: headers.filter((h) => !mapped.has(h)),
  };
}

/** The current values of a problem row, for pre-filling the editor. */
export function cellsOf(
  problem: ProblemRow,
  headers: string[],
): Record<string, string> {
  const cells: Record<string, string> = {};
  headers.forEach((header, i) => {
    cells[header] = problem.raw[i] ?? "";
  });
  return cells;
}

/** Replaces any earlier fix for the same row rather than stacking them. */
export function upsertFix(fixes: RowFix[], next: RowFix): RowFix[] {
  const without = fixes.filter((f) => f.sourceRow !== next.sourceRow);
  return [...without, next].sort((a, b) => a.sourceRow - b.sourceRow);
}

export const removeFix = (fixes: RowFix[], sourceRow: number) =>
  fixes.filter((f) => f.sourceRow !== sourceRow);
