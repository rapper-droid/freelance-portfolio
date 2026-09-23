import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "@/lib/runtime/sha256";
import { hash } from "@/lib/runtime/ids";

/**
 * The digest must match Node's exactly.
 *
 * Not because the algorithm is in doubt, but because every id already derived
 * — order references, cart line keys, payment idempotency keys, sandboxes
 * saved in people's browsers — was produced by `node:crypto`. A digest that
 * is merely "a hash" would orphan all of them.
 */
const node = (text: string) => createHash("sha256").update(text).digest("hex");

describe("sha256Hex — Node と 1 ビットも違わない", () => {
  it("matches the published test vectors", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("matches node:crypto across lengths and block boundaries", () => {
    const cases = [
      "",
      "a",
      "hello world",
      // 55, 56, 63, 64 and 65 bytes: the padding edges where a naive
      // implementation drops or duplicates a block.
      "x".repeat(55),
      "x".repeat(56),
      "x".repeat(63),
      "x".repeat(64),
      "x".repeat(65),
      "x".repeat(1000),
      '{"a":1,"b":[2,3]}',
    ];
    for (const value of cases) expect(sha256Hex(value)).toBe(node(value));
  });

  it("matches node:crypto on Japanese and on emoji", () => {
    // Multi-byte and surrogate pairs: the demo's own data is full of both.
    for (const value of [
      "テスト太郎",
      "カフェラテ（ICED・ラージ）",
      "残り 2 点 ☕",
      "🫖🍰",
      "サンプル商店 — 請求書の宛名変更について",
    ])
      expect(sha256Hex(value)).toBe(node(value));
  });

  it("keeps `hash` deterministic and 32 characters", () => {
    const a = hash({ b: 2, a: 1 });
    const b = hash({ a: 1, b: 2 });
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(hash({ a: 1 })).not.toBe(hash({ a: 2 }));
  });

  it("produces the same key the previous implementation did", () => {
    // Guards against a future "improvement" that changes every stored id.
    expect(hash("tsudowa")).toBe(node('"tsudowa"').slice(0, 32));
  });
});
