import { describe, expect, it } from "vitest";
import {
  DEFAULT_DESIGN,
  PALETTES,
  RATIOS,
  RATIO_SIZES,
  contentProblems,
  designFilename,
  renderDesign,
  wrapHeadline,
  type Design,
} from "@/lib/still/design";

/** 受け入れ基準 Q29（指示書 §17）。 */

const withContent = (patch: Partial<Design["content"]>): Design => ({
  ...DEFAULT_DESIGN,
  content: { ...DEFAULT_DESIGN.content, ...patch },
});

describe("renderDesign — 一つの内容から、どの比率も同じことを言う", () => {
  it("renders each format at its declared size", () => {
    for (const ratio of RATIOS) {
      const [w, h] = RATIO_SIZES[ratio];
      const svg = renderDesign(DEFAULT_DESIGN, ratio);
      expect(svg).toContain(`width="${w}"`);
      expect(svg).toContain(`height="${h}"`);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
    }
  });

  it("puts a changed price into every ratio at once", () => {
    // The failure §17 names: a price current in one image and stale in
    // another. There is one record, so this cannot happen by construction —
    // and this fails if a per-ratio copy is ever introduced.
    const design = withContent({ price: "¥5,500" });
    for (const ratio of RATIOS) {
      expect(renderDesign(design, ratio)).toContain("¥5,500");
      expect(renderDesign(design, ratio)).not.toContain("¥3,800");
    }
  });

  it("carries every field a shop would need", () => {
    const design = withContent({
      productName: "FORME / 05 トート",
      period: "11/1 — 11/30",
      cta: "店頭でご覧ください",
    });
    const svg = renderDesign(design, "square");
    expect(svg).toContain("FORME / 05 トート");
    expect(svg).toContain("11/1 — 11/30");
    expect(svg).toContain("店頭でご覧ください");
  });

  it("escapes text rather than letting it become markup", () => {
    const svg = renderDesign(
      withContent({ headline: '<script>alert("x")</script>' }),
      "portrait",
    );
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("draws the safe area only when asked, and never in an export", () => {
    const preview = renderDesign(DEFAULT_DESIGN, "square", {
      showSafeArea: true,
    });
    const exported = renderDesign(DEFAULT_DESIGN, "square");
    expect(preview).toContain("stroke-dasharray");
    expect(exported).not.toContain("stroke-dasharray");
  });

  it("keeps the crop inside the frame however it is pushed", () => {
    const pushed: Design = {
      ...DEFAULT_DESIGN,
      focusX: 999,
      focusY: -50,
      scale: 5000,
    };
    const svg = renderDesign(pushed, "landscape");
    const [w, h] = RATIO_SIZES.landscape;
    const cx = Number(svg.match(/cx="(\d+)"/)?.[1]);
    const cy = Number(svg.match(/cy="(-?\d+)"/)?.[1]);
    expect(cx).toBeLessThanOrEqual(w);
    expect(cy).toBeGreaterThanOrEqual(0);
    expect(cy).toBeLessThanOrEqual(h);
  });

  it("names the file after the direction, not an array index", () => {
    for (const palette of PALETTES) {
      const name = designFilename(
        { ...DEFAULT_DESIGN, paletteId: palette.id },
        "portrait",
      );
      expect(name).toBe(`still-${palette.id}-portrait.svg`);
    }
  });
});

describe("wrapHeadline — 長い見出しを黙って捨てない", () => {
  it("breaks on words, not in the middle of them", () => {
    expect(wrapHeadline("MAKE ROOM FOR LESS", 10)).toEqual([
      "MAKE ROOM",
      "FOR LESS",
    ]);
  });

  it("folds an over-long headline into three lines rather than dropping it", () => {
    const lines = wrapHeadline("one two three four five six seven eight", 5);
    expect(lines).toHaveLength(3);
    expect(lines.join(" ")).toContain("eight");
  });

  it("survives an empty headline", () => {
    expect(wrapHeadline("   ", 10)).toEqual([""]);
  });
});

describe("contentProblems — 書き出す前に断る", () => {
  it("refuses an empty headline", () => {
    expect(contentProblems(withContent({ headline: " " }).content)).toContain(
      "見出しを入力してください。",
    );
  });

  it("names the field that is too long", () => {
    const problems = contentProblems(
      withContent({ price: "x".repeat(40) }).content,
    );
    expect(problems.join(" ")).toContain("価格");
  });

  it("passes the default design", () => {
    expect(contentProblems(DEFAULT_DESIGN.content)).toEqual([]);
  });
});
