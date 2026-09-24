"use client";

import { downloadText as download } from "@/lib/runtime/download";
import { useState } from "react";
import Image from "next/image";
import { Download, RotateCcw } from "lucide-react";
import {
  DEFAULT_DESIGN,
  LIMITS,
  PALETTES,
  RATIOS,
  RATIO_LABELS,
  RATIO_SIZES,
  contentProblems,
  designDataUri,
  designFilename,
  renderDesign,
  type Design,
  type DesignContent,
  type Ratio,
} from "@/lib/still/design";

/**
 * STILL / STUDIO — an editable design, not three pictures (指示書 §17).
 *
 * Everything on screen comes from one record: change the price and all three
 * ratios change, which is exactly the failure §17 names — *変更した価格が一部
 * 画像だけ古いまま残らない*. The three previews are shown together so that is
 * something a visitor can see rather than take on trust.
 *
 * The safe-area guides are a preview aid and are never written into the file;
 * exporting a design with dashed guides baked in would be a bug pretending to
 * be a feature.
 */

const FIELDS: Array<[keyof DesignContent, string, number, string]> = [
  ["headline", "見出し", LIMITS.headline, "MAKE ROOM."],
  ["productName", "商品名", LIMITS.productName, "FORME / 01 タンブラー"],
  ["price", "価格", LIMITS.price, "¥3,800"],
  ["period", "期間", LIMITS.period, "9/24 — 10/6"],
  ["cta", "CTA", LIMITS.cta, "オンラインストアで見る"],
];

export function StillStudio() {
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN);
  const [ratio, setRatio] = useState<Ratio>("square");
  const [safeArea, setSafeArea] = useState(true);
  const [notice, setNotice] = useState("");

  const problems = contentProblems(design.content);
  const [w, h] = RATIO_SIZES[ratio];

  const setContent = (field: keyof DesignContent, value: string) =>
    setDesign((prev) => ({
      ...prev,
      content: { ...prev.content, [field]: value },
    }));

  return (
    <div className="creative-demo showcase">
      <div className="app-demo-heading">
        <span className="eyebrow">STILL / STUDIO — CREATIVE COLLECTION</span>
        <h2>らしさを、展開する。</h2>
        <p>
          {
            "ひとつの内容を、三つの比率へ。文字・価格・期間・CTAを書き換えると、三つとも同じ内容で更新されます。書き出したファイルは実際に開けます。"
          }
        </p>
      </div>

      <div className="creative-workspace">
        <section className="creative-controls">
          <h3>内容</h3>
          {FIELDS.map(([field, label, max, placeholder]) => (
            <label key={field}>
              {label}
              <input
                value={design.content[field]}
                maxLength={max + 10}
                placeholder={placeholder}
                onChange={(e) => setContent(field, e.target.value)}
              />
            </label>
          ))}

          <h3>アートディレクション</h3>
          <div className="creative-style-buttons">
            {PALETTES.map((palette) => (
              <button
                key={palette.id}
                aria-pressed={design.paletteId === palette.id}
                onClick={() =>
                  setDesign((prev) => ({ ...prev, paletteId: palette.id }))
                }
              >
                <span
                  className="creative-swatch"
                  style={{ background: palette.bg, borderColor: palette.fg }}
                  aria-hidden="true"
                />
                {palette.name}
              </button>
            ))}
          </div>

          <h3>トリミング</h3>
          <label>
            図形の位置（横）
            <input
              type="range"
              min={0}
              max={100}
              value={design.focusX}
              onChange={(e) =>
                setDesign((prev) => ({
                  ...prev,
                  focusX: Number(e.target.value),
                }))
              }
            />
          </label>
          <label>
            図形の位置（縦）
            <input
              type="range"
              min={0}
              max={100}
              value={design.focusY}
              onChange={(e) =>
                setDesign((prev) => ({
                  ...prev,
                  focusY: Number(e.target.value),
                }))
              }
            />
          </label>
          <label>
            図形の大きさ
            <input
              type="range"
              min={20}
              max={90}
              value={design.scale}
              onChange={(e) =>
                setDesign((prev) => ({
                  ...prev,
                  scale: Number(e.target.value),
                }))
              }
            />
          </label>

          <h3>書き出し</h3>
          <label>
            フォーマット
            <select
              value={ratio}
              onChange={(e) => setRatio(e.target.value as Ratio)}
            >
              {RATIOS.map((value) => (
                <option key={value} value={value}>
                  {RATIO_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="creative-check">
            <input
              type="checkbox"
              checked={safeArea}
              onChange={(e) => setSafeArea(e.target.checked)}
            />
            セーフエリアを表示（書き出しには入りません）
          </label>

          {problems.length > 0 && (
            <ul className="creative-problems" role="alert">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}

          <div className="showcase-actions">
            <button
              className="button primary"
              disabled={problems.length > 0}
              onClick={() => {
                // Rendered without the guides: what is downloaded is the
                // design, not the editor's overlay.
                download(
                  renderDesign(design, ratio),
                  designFilename(design, ratio),
                  "image/svg+xml",
                );
                setNotice(
                  `${designFilename(design, ratio)} を書き出しました。SVGはブラウザでもそのまま開けます。`,
                );
              }}
            >
              <Download size={16} />
              この比率を書き出す
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setDesign(DEFAULT_DESIGN);
                setNotice("内容とトリミングを初期状態に戻しました。");
              }}
            >
              <RotateCcw size={14} /> 初期状態に戻す
            </button>
          </div>

          <p role="status" className="demo-fineprint">
            {notice ||
              "全素材は本サイトの自主制作。架空の広告で、配信実績ではありません。"}
          </p>
        </section>

        <div className="creative-preview" data-feature>
          <Image
            unoptimized
            key={`${ratio}-${safeArea}`}
            src={designDataUri(design, ratio, { showSafeArea: safeArea })}
            alt={`${design.content.headline} / ${RATIO_LABELS[ratio]}の広告クリエイティブ`}
            width={w}
            height={h}
          />
        </div>
      </div>

      <section className="creative-all">
        <h3>三つの比率を同時に確認する</h3>
        <p className="demo-fineprint">
          {
            "すべて同じ内容から描いています。価格や期間を変えると、三つとも同時に変わります。片方だけ古いまま残ることはありません。"
          }
        </p>
        <ul>
          {RATIOS.map((value) => (
            <li key={value} data-ratio={value}>
              <Image
                unoptimized
                src={designDataUri(design, value, { showSafeArea: safeArea })}
                alt={`${RATIO_LABELS[value]}のプレビュー`}
                width={RATIO_SIZES[value][0]}
                height={RATIO_SIZES[value][1]}
              />
              <span>{RATIO_LABELS[value]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
