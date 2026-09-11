# TETSU / WORKS — Design system

最新の正本は [Figma](https://www.figma.com/design/bv0O39N0hmW8bxMSYlwY0n) と [実装対応表](FIGMA_SALES_UI.md)。営業UIは `src/app/sales-ui.css`、デモ内部は既存 `globals.css` / `showcase.css`を維持します。

| Token       | Value                     | 用途         |
| ----------- | ------------------------- | ------------ |
| hub-paper   | #0b0d0c                   | 背景         |
| hub-ink     | #f3f1e9                   | 見出し・本文 |
| hub-accent  | #b7f36b                   | CTA・ラベル  |
| hub-muted   | #a6aaa2                   | 補足         |
| hub-border  | #2a302a                   | 境界         |
| sales-panel | #121512                   | カード       |
| hub-space   | clamp(20px, 5.56vw, 80px) | 左右余白     |

英語Hero・ブランド・カテゴリ見出しはInterのローカル可変フォント、本文はArialと日本語システムゴシックを使用。CSSは営業ページ内にスコープし、デモのトークンを上書きしません。ケースごとの暖色・ライム・明色・シアンはFigma由来。

## Component map

- Header / Footer: `site.tsx`
- Hero / Service selector / Pricing: `app/page.tsx`
- TrustPanel / Delivery / MessageOnly: `sales-sections.tsx`
- 全11作品と12カテゴリフィルタ: `app/works/page.tsx` / `portfolio-grid.tsx`
- ProjectCard: `project-card.tsx`（実画面・価格・納期・2つのCTA）
- 代表作選定・プレビューURL: `lib/sales-ui.ts` / `lib/preview.ts`
- SalesInfo / Process: `sales.tsx`
- Contact / ContactSend: 既存コンポーネントと安全なサーバー送信を維持
- CaseStudy: `app/projects/[slug]/page.tsx`
- Demo interactions: `showcase-demos.tsx` / csv・inbox・admin

## QAと更新

`npm run qa:design`でFigma対応6ページの4画面幅を撮影・axe/focus検査。Desktop1440とMobile390のHero・カテゴリ・作品・料金・納品物を実画像で比較します。幅320でoverflowも確認します。

プレビューは `npm run screenshots` で生成し、`src/lib/preview.ts` のリビジョンを更新してから再build。これはNext Image/CDNが旧画像を返すことを防ぎます。撮影時だけlazy imageをeagerにして全画像の読込・欠損を確認し、実サイトの遅延読込は維持します。

Figmaの固定座標・文字重なりはCSSへ持ち込まず、可変高のGrid/Flexで意味のある順序を保持。hoverだけの操作は作らず、focus-visibleとreduced motionを提供します。
