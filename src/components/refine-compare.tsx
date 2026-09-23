"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * REFINE — the same page, arranged twice (指示書 §17).
 *
 * §17 is specific about what this has to be and what it must not be: the same
 * content and the same controls in both versions, a width switch, the reading
 * order and the focus order made visible, a stated version and stated
 * measurement conditions — and no strawman. *beforeをわざと極端に壊して成果
 * を誇張しない.*
 *
 * So both versions render the same blocks, with the same words and the same
 * links, from the list below. Only the order changes. The "before" is a
 * perfectly ordinary art-first hero of the kind that ships every day; it is
 * not broken markup, and nothing here claims it is.
 *
 * No revenue or conversion figures appear anywhere. There is no measurement
 * behind this page, so there is nothing to report, and the conditions block
 * says exactly that rather than leaving a gap for a reader to fill in.
 */

type BlockId = "nav" | "art" | "kicker" | "headline" | "body" | "cta" | "links";

/** The blocks both arrangements are built from, named for the notes below. */
const BLOCKS: Record<BlockId, { label: string }> = {
  nav: { label: "ブランドとナビゲーション" },
  art: { label: "イメージ" },
  kicker: { label: "キッカー" },
  headline: { label: "見出し" },
  body: { label: "説明" },
  cta: { label: "申し込み" },
  links: { label: "関連リンク" },
};

/**
 * The two arrangements.
 *
 * Before puts the picture and the navigation first and the action last, which
 * is a real and common choice. After leads with what the page is for and puts
 * the action next to the reason for taking it.
 */
const ORDERS: Record<"before" | "after", BlockId[]> = {
  before: ["nav", "art", "kicker", "body", "headline", "links", "cta"],
  after: ["nav", "kicker", "headline", "body", "cta", "art", "links"],
};

const WIDTHS = [360, 768, 1200] as const;
type Width = (typeof WIDTHS)[number];

const WIDTH_LABELS: Record<Width, string> = {
  360: "スマートフォン 360px",
  768: "タブレット 768px",
  1200: "デスクトップ 1200px",
};

/** What this comparison is of, and what has not been measured. */
const CONDITIONS = {
  version: "REFINE 2026-09 / 自主制作",
  what: "同じ本文・同じリンク・同じ操作を、順番だけ変えて並べています。",
  measured:
    "読み順とフォーカス順は、この画面のDOMから実際に読み取って表示しています。",
  notMeasured:
    "売上・CVR・滞在時間・表示速度は測定していません。実測がないため、改善率は一切表示しません。",
};

function Page({
  variant,
  showOrder,
  showFocus,
}: {
  variant: "before" | "after";
  showOrder: boolean;
  showFocus: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [focusOrder, setFocusOrder] = useState<string[]>([]);

  useEffect(() => {
    if (!root.current) return;
    // Read from the rendered page rather than from a list written by hand:
    // an overlay that disagrees with the real tab order would be worse than
    // no overlay at all.
    const focusable = root.current.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    setFocusOrder([...focusable].map((el) => el.dataset.focusName ?? "—"));
  }, [variant]);

  const content: Record<BlockId, React.ReactNode> = {
    nav: (
      <header className="refine-nav">
        <b>GREEN ROOM</b>
        <nav aria-label={`${variant}のナビゲーション`}>
          <a href="#refine-conditions" data-focus-name="サービス">
            サービス
          </a>
          <a href="#refine-conditions" data-focus-name="流れ">
            流れ
          </a>
          <a href="#refine-conditions" data-focus-name="よくある質問">
            よくある質問
          </a>
        </nav>
      </header>
    ),
    art: (
      <div className="refine-art" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    ),
    kicker: <p className="refine-kicker">暮らしの整理サポート</p>,
    headline: (
      <h3 className="refine-headline">
        暮らしに、
        <br />
        余白をつくる。
      </h3>
    ),
    body: (
      <p className="refine-body">
        整理収納のオンライン相談です。持ちものを減らすことより、戻せる仕組みを
        つくることを優先します。はじめの一回は、いまの部屋を見ながら現状を整理
        するところから始めます。
      </p>
    ),
    cta: (
      <a
        className="refine-cta"
        href="#refine-conditions"
        data-focus-name="相談を申し込む"
      >
        相談を申し込む <ArrowRight size={15} aria-hidden="true" />
      </a>
    ),
    links: (
      <footer className="refine-links">
        <a href="#refine-conditions" data-focus-name="料金">
          料金
        </a>
        <a href="#refine-conditions" data-focus-name="事例">
          事例
        </a>
      </footer>
    ),
  };

  return (
    <div className="refine-page-wrap">
      <div
        className={`refine-page is-${variant}`}
        ref={root}
        data-order={showOrder}
      >
        {ORDERS[variant].map((id, index) => (
          <div className="refine-block" key={id} data-block={id}>
            {showOrder && (
              <span className="refine-marker" aria-hidden="true">
                {index + 1}
              </span>
            )}
            {content[id]}
          </div>
        ))}
      </div>

      {showFocus && (
        <ol
          className="refine-focus-list"
          aria-label={`${variant}のフォーカス順`}
        >
          {focusOrder.map((name, index) => (
            <li key={`${name}-${index}`}>
              <b>{index + 1}</b> {name}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function RefineCompare() {
  const [mode, setMode] = useState<"before" | "after" | "both">("after");
  const [width, setWidth] = useState<Width>(1200);
  const [showOrder, setShowOrder] = useState(false);
  const [showFocus, setShowFocus] = useState(false);

  const shown: Array<"before" | "after"> =
    mode === "both" ? ["before", "after"] : [mode];

  return (
    <div className="improvement-demo showcase">
      <div className="app-demo-heading">
        <span className="eyebrow">REFINE / BEFORE &amp; AFTER</span>
        <h2>伝わる順番に、整える。</h2>
        <p>
          同じ本文・同じリンク・同じ操作を、順番だけ変えて比べます。幅を切り替え、
          読み順とフォーカス順を表示して確かめられます。
        </p>
      </div>

      <div className="refine-controls">
        <div
          className="segmented improvement-toggle"
          role="group"
          aria-label="表示する版"
        >
          {(["before", "after", "both"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {value === "before"
                ? "Before"
                : value === "after"
                  ? "After"
                  : "並べて"}
            </button>
          ))}
        </div>

        <label className="refine-select">
          画面幅
          <select
            value={width}
            onChange={(e) => setWidth(Number(e.target.value) as Width)}
          >
            {WIDTHS.map((value) => (
              <option key={value} value={value}>
                {WIDTH_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="refine-check">
          <input
            type="checkbox"
            checked={showOrder}
            onChange={(e) => setShowOrder(e.target.checked)}
          />
          読み順を表示
        </label>
        <label className="refine-check">
          <input
            type="checkbox"
            checked={showFocus}
            onChange={(e) => setShowFocus(e.target.checked)}
          />
          フォーカス順を表示
        </label>
      </div>

      <section className="refine-stage" data-feature data-mode={mode}>
        {shown.map((variant) => (
          <figure key={variant} className="refine-frame">
            <figcaption>
              {variant === "before" ? "Before" : "After"} —{" "}
              {WIDTH_LABELS[width]}
            </figcaption>
            <div className="refine-viewport" style={{ width }}>
              <Page
                variant={variant}
                showOrder={showOrder}
                showFocus={showFocus}
              />
            </div>
          </figure>
        ))}
      </section>

      <section className="demo-content-section" id="refine-notes">
        <h2>順番を変えた理由</h2>
        <div className="demo-three-columns">
          <article>
            <h3>{BLOCKS.headline.label}を先に</h3>
            <p>
              Before は画像を先に置き、説明のあとに見出しが来ます。読む人は
              「何の話か」を知る前に本文を読むことになります。After は見出しを
              先に置き、そのあと説明へ進みます。
            </p>
          </article>
          <article>
            <h3>{BLOCKS.cta.label}を理由のとなりに</h3>
            <p>
              Before では申し込みが最後、関連リンクよりあとにあります。After は
              説明のすぐあとに置き、読み終えた場所で操作できるようにしています。
            </p>
          </article>
          <article>
            <h3>フォーカスの順番</h3>
            <p>
              リンクの数も行き先も同じです。順番が変わると、キーボードで申し込みに
              たどり着くまでに通過するリンクの数が変わります。「フォーカス順を
              表示」で確かめられます。
            </p>
          </article>
        </div>
      </section>

      <section className="demo-content-section" id="refine-conditions">
        <h2>対象版と測定条件</h2>
        <dl className="refine-conditions">
          <div>
            <dt>対象版</dt>
            <dd>{CONDITIONS.version}</dd>
          </div>
          <div>
            <dt>比較したもの</dt>
            <dd>{CONDITIONS.what}</dd>
          </div>
          <div>
            <dt>測定したもの</dt>
            <dd>{CONDITIONS.measured}</dd>
          </div>
          <div>
            <dt>測定していないもの</dt>
            <dd>{CONDITIONS.notMeasured}</dd>
          </div>
        </dl>
        <p className="demo-fineprint">
          Before は「よくある構成」であって、わざと壊した見本ではありません。
          画像を先に置き、申し込みを下に置く作りは実際によくあります。
        </p>
      </section>
    </div>
  );
}
