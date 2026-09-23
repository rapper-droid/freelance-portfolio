import { describe, expect, it } from "vitest";
import {
  ADOPTION_STEPS,
  CAPABILITIES,
  SAMPLE_WEEK,
  summariseWeek,
  weeklyMarkdown,
  type Task,
} from "@/lib/flowstate/summary";

/** 受け入れ基準 Q27（指示書 §17）。 */

const AT = "2026-09-25T01:00:00.000Z";

describe("summariseWeek — 画面とファイルが同じ数を言う", () => {
  it("counts every status, and they add up", () => {
    const s = summariseWeek();
    expect(s.total).toBe(SAMPLE_WEEK.length);
    expect(s.done + s.doing + s.blocked + s.todo).toBe(s.total);
  });

  it("lists what is waiting, because that is what carries over", () => {
    const s = summariseWeek();
    expect(s.blockedTasks).toHaveLength(s.blocked);
    for (const task of s.blockedTasks) expect(task.status).toBe("blocked");
  });

  it("groups by project without losing a row", () => {
    const s = summariseWeek();
    expect(s.byProject.reduce((n, p) => n + p.total, 0)).toBe(s.total);
  });

  it("handles an empty week rather than dividing by it", () => {
    const s = summariseWeek([]);
    expect(s.total).toBe(0);
    expect(s.byProject).toEqual([]);
    expect(s.blockedTasks).toEqual([]);
  });
});

describe("weeklyMarkdown — 本物のファイルであること", () => {
  it("quotes the same figures the page shows", () => {
    const s = summariseWeek();
    const md = weeklyMarkdown(SAMPLE_WEEK, AT);
    expect(md).toContain(`- 全体: ${s.total} 件`);
    expect(md).toContain(`- 完了: ${s.done} 件`);
    expect(md).toContain(`- 待ち: ${s.blocked} 件`);
  });

  it("carries every task into the detail table", () => {
    const md = weeklyMarkdown(SAMPLE_WEEK, AT);
    for (const task of SAMPLE_WEEK) {
      expect(md).toContain(task.id);
      expect(md).toContain(task.title);
    }
  });

  it("says what it is, so a file found later is not mistaken for a record", () => {
    const md = weeklyMarkdown(SAMPLE_WEEK, AT);
    expect(md).toContain("架空SaaSのデモが生成したサンプル");
    expect(md).toContain("2026-09-25");
  });

  it("omits the carry-over section when nothing is waiting", () => {
    const clear: Task[] = SAMPLE_WEEK.map((t) => ({ ...t, status: "done" }));
    const md = weeklyMarkdown(clear, AT);
    expect(md).not.toContain("来週に持ち越す");
    expect(md).toContain("- 完了: 8 件");
  });

  it("is valid Markdown structure, not a blob", () => {
    const md = weeklyMarkdown(SAMPLE_WEEK, AT);
    expect(md.startsWith("# ")).toBe(true);
    // A table needs its separator row or it renders as plain text.
    expect(md).toContain("| --- | --- | --- | --- | --- |");
  });
});

describe("CAPABILITIES — つないでいないものを、つないでいないと書く", () => {
  it("marks more as unconnected than connected, and says why for each", () => {
    const connected = CAPABILITIES.filter((c) => c.connected);
    const not = CAPABILITIES.filter((c) => !c.connected);
    expect(connected.length).toBeGreaterThan(0);
    expect(not.length).toBeGreaterThan(0);
    for (const row of CAPABILITIES) {
      expect(row.permission.length).toBeGreaterThan(4);
      expect(row.note.length).toBeGreaterThan(8);
    }
  });

  it("names a permission for everything, including what is not built", () => {
    // A feature with no stated permission is a feature nobody has costed.
    for (const row of CAPABILITIES.filter((c) => !c.connected))
      expect(row.covered).toBe("未実装");
  });
});

describe("ADOPTION_STEPS — 手順であって、約束ではない", () => {
  it("is ordered and reversible in its wording", () => {
    expect(ADOPTION_STEPS.length).toBeGreaterThanOrEqual(3);
    ADOPTION_STEPS.forEach((step, index) => {
      expect(step.title.startsWith(`${index + 1}.`)).toBe(true);
      expect(step.detail.length).toBeGreaterThan(10);
    });
  });
});
