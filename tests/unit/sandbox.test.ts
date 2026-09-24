import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  backupKeyFor,
  forgetBackup,
  keepBackup,
  readBackup,
  readRaw,
  writeRaw,
} from "../../src/lib/runtime/sandbox";
import {
  STORAGE_KEY,
  SHOP_SCHEMA_VERSION,
  exportState,
  importState,
  loadState,
  resetState,
  saveState,
  emptyState,
} from "../../src/lib/shop/store";
import {
  FORME_STORAGE_KEY,
  FORME_SCHEMA_VERSION,
  exportFormeState,
  importFormeState,
  loadFormeState,
  resetFormeState,
  saveFormeState,
  emptyFormeState,
} from "../../src/lib/forme/store";
import {
  OPS_STORAGE_KEY,
  exportOpsState,
  importOpsState,
  loadOpsState,
  resetOpsState,
  saveOpsState,
} from "../../src/lib/ops/store";
import { emptyOpsState } from "../../src/lib/ops/cases";

const NOW = "2026-09-24T02:00:00.000Z";

/** A localStorage that behaves, so the failure modes can be added on top. */
function fakeStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

let store: ReturnType<typeof fakeStorage>;
beforeEach(() => {
  store = fakeStorage();
  vi.stubGlobal("localStorage", store);
});

describe("sandbox storage mechanics", () => {
  it("separates 'nothing yet' from 'cannot read' from 'not usable'", () => {
    expect(readRaw("k")).toEqual({ ok: true, value: null });

    writeRaw("k", { a: 1 });
    expect(readRaw("k")).toEqual({ ok: true, value: { a: 1 } });

    store.map.set("k", "{not json");
    expect(readRaw("k")).toEqual({
      ok: false,
      fault: "unreadable",
      text: "{not json",
    });

    // A JSON scalar is valid JSON and still not a sandbox.
    store.map.set("k", "42");
    expect(readRaw("k")).toMatchObject({ ok: false, fault: "unreadable" });

    vi.stubGlobal("localStorage", undefined);
    expect(readRaw("k")).toEqual({
      ok: false,
      fault: "unavailable",
      text: null,
    });
    expect(writeRaw("k", { a: 1 })).toBe(false);
  });

  it("keeps one backup, readable and removable, and reports when it cannot", () => {
    expect(keepBackup("k", '{"old":true}', "unreadable", NOW)).toBe(true);
    expect(store.map.has(backupKeyFor("k"))).toBe(true);
    expect(readBackup("k")).toEqual({
      savedAtIso: NOW,
      reason: "unreadable",
      text: '{"old":true}',
    });

    // One slot: the newest problem replaces the previous copy.
    keepBackup("k", "second", "newer", NOW);
    expect(readBackup("k")?.text).toBe("second");

    forgetBackup("k");
    expect(readBackup("k")).toBeNull();

    vi.stubGlobal("localStorage", {
      ...store,
      setItem: () => {
        throw new Error("quota");
      },
    });
    expect(keepBackup("k", "x", "unreadable", NOW)).toBe(false);
  });
});

describe("unusable data is copied aside, never dropped", () => {
  const cases = [
    ["KISSA", STORAGE_KEY, loadState, SHOP_SCHEMA_VERSION],
    ["FORME", FORME_STORAGE_KEY, loadFormeState, FORME_SCHEMA_VERSION],
    ["ops", OPS_STORAGE_KEY, loadOpsState, 1],
  ] as const;

  it.each(cases)("%s keeps unreadable data and says so", (_n, key, load) => {
    store.map.set(key, "}}broken{{");
    const { note } = load(NOW);
    expect(note).toContain("控えとして残しています");
    expect(readBackup(key)?.text).toBe("}}broken{{");
  });

  it.each(cases)(
    "%s does not overwrite data from a newer build",
    (_n, key, load, version) => {
      // The old behaviour promised the original was untouched and then the
      // first edit wrote over it. The copy is what makes the promise true.
      const future = JSON.stringify({ schemaVersion: version + 1, mine: true });
      store.map.set(key, future);
      const { note } = load(NOW);
      expect(note).toContain("新しい版");
      expect(readBackup(key)?.text).toBe(future);
      expect(readBackup(key)?.reason).toContain(String(version + 1));
    },
  );

  it("still starts a usable sandbox after a fault", () => {
    store.map.set(STORAGE_KEY, "broken");
    const { state } = loadState(NOW);
    expect(state.schemaVersion).toBe(SHOP_SCHEMA_VERSION);
    expect(state.orders).toEqual([]);
    expect(state.sandboxId).toBeTruthy();
  });
});

describe("export and import", () => {
  it("carries a KISSA sandbox out and back in", () => {
    const state = {
      ...emptyState(NOW, "abc12345"),
      orders: [{ id: "o1" }],
    } as never;
    const text = exportState(state);
    expect(text).toContain("\n"); // readable, not one line
    const result = importState(text, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.orders).toHaveLength(1);
  });

  it("refuses another experience's file rather than half-reading it", () => {
    const forme = exportFormeState(emptyFormeState(NOW, "abc12345"));
    const kissa = exportState(emptyState(NOW, "abc12345"));
    const ops = exportOpsState(emptyOpsState(NOW, "abc12345"));

    expect(importState(forme, NOW)).toEqual({
      ok: false,
      reason: "この体験の保存データではないようです。",
    });
    expect(importFormeState(kissa, NOW).ok).toBe(false);
    expect(importOpsState(kissa, NOW).ok).toBe(false);
    expect(importFormeState(ops, NOW).ok).toBe(false);

    // Each still accepts its own.
    expect(importState(kissa, NOW).ok).toBe(true);
    expect(importFormeState(forme, NOW).ok).toBe(true);
    expect(importOpsState(ops, NOW).ok).toBe(true);
  });

  it("rejects text that is not JSON at all", () => {
    expect(importState("hello", NOW)).toEqual({
      ok: false,
      reason: "読み込めない形式です。",
    });
    expect(importState("[1,2]", NOW).ok).toBe(false);
  });

  it("upgrades an old export instead of refusing it", () => {
    const old = JSON.stringify({
      schemaVersion: 0,
      orders: [{ id: "o1" }],
      reservations: [],
    });
    const result = importState(old, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.schemaVersion).toBe(SHOP_SCHEMA_VERSION);
      expect(result.state.orders).toHaveLength(1);
      expect(result.note).toContain("更新しました");
    }
  });
});

describe("the three sandboxes are isolated from each other", () => {
  it("uses three distinct keys, and a reset clears only its own", () => {
    const keys = [STORAGE_KEY, FORME_STORAGE_KEY, OPS_STORAGE_KEY];
    expect(new Set(keys).size).toBe(3);

    saveState({ ...emptyState(NOW, "k"), orders: [{ id: "k1" }] } as never);
    saveFormeState({
      ...emptyFormeState(NOW, "f"),
      orders: [{ id: "f1" }],
    } as never);
    saveOpsState({
      ...emptyOpsState(NOW, "o"),
      cases: [{ id: "c1" }],
    } as never);

    resetState(NOW);
    expect(loadState(NOW).state.orders).toEqual([]);
    expect(loadFormeState(NOW).state.orders).toHaveLength(1);
    expect(loadOpsState(NOW).state.cases).toHaveLength(1);

    resetFormeState(NOW);
    expect(loadFormeState(NOW).state.orders).toEqual([]);
    expect(loadOpsState(NOW).state.cases).toHaveLength(1);

    resetOpsState(NOW);
    expect(loadOpsState(NOW).state.cases).toEqual([]);
  });

  it("gives each visitor a different sandbox id", () => {
    const ids = new Set(
      Array.from({ length: 50 }, () => resetState(NOW).sandboxId),
    );
    expect(ids.size).toBeGreaterThan(40);
  });

  it("stores nothing under a key another experience reads", () => {
    saveState(emptyState(NOW, "k"));
    saveFormeState(emptyFormeState(NOW, "f"));
    saveOpsState(emptyOpsState(NOW, "o"));
    // Every key written belongs to exactly one of the three prefixes.
    for (const key of store.map.keys())
      expect(
        [STORAGE_KEY, FORME_STORAGE_KEY, OPS_STORAGE_KEY].filter((k) =>
          key.startsWith(k),
        ),
      ).toHaveLength(1);
  });
});

describe("the public demos never reach the production back end", () => {
  // 指示書 §18: 本番の CONTACT_STATE をデモ注文の保存先に流用しない。
  // The shops' whole premise is that nothing leaves the browser, so the
  // guard is structural: these trees must contain no request at all.
  const trees = [
    "src/components/kissa",
    "src/components/forme",
    "src/components/ops",
    "src/lib/shop",
    "src/lib/forme",
    "src/lib/ops",
  ];

  const filesUnder = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? filesUnder(full) : [full];
    });

  it.each(trees)("%s issues no network request", (tree) => {
    for (const file of filesUnder(tree)) {
      const source = fs.readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/\bfetch\(/);
      expect(source, file).not.toMatch(/XMLHttpRequest|navigator\.sendBeacon/);
      expect(source, file).not.toMatch(/\/api\//);
    }
  });

  it("keeps the contact store out of the demos' reach", () => {
    for (const tree of trees)
      for (const file of filesUnder(tree))
        expect(fs.readFileSync(file, "utf8"), file).not.toContain(
          "CONTACT_STATE",
        );
  });
});
