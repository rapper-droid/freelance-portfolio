# TETSU / WORKS — Design system

最新の正本は [Figma](https://www.figma.com/design/bv0O39N0hmW8bxMSYlwY0n) のFinal Art Direction / Brand Systemと [最終実装対応表](FINAL_ART_IMPLEMENTATION.md)。基礎の営業UIは `src/app/sales-ui.css`、最終ブランド表現は `art-direction.css`。TWの正本は `public/brand/tw-mark.svg`。Heroは最大150px、800 weight、字間-0.058em。homeは背景#080a09、文字#f3f4ee、アクセント#c7ff63。本文は既存の日本語システムフォントを維持します。

| Token       | Value                     | 用途         |
| ----------- | ------------------------- | ------------ |
| hub-paper   | #0b0d0c                   | 背景         |
| hub-ink     | #f3f1e9                   | 見出し・本文 |
| hub-accent  | #b7f36b                   | CTA・ラベル  |
| hub-muted   | #a6aaa2                   | 補足         |
| hub-border  | #2a302a                   | 境界         |
| sales-panel | #121512                   | カード       |
| hub-space   | clamp(20px, 5.56vw, 80px) | 左右余白     |

上表は基礎UIのトークンです。最終ブランド層の`studio-paper`（#080a09）・`studio-ink`（#f3f4ee）・`studio-accent`（#c7ff63）をHomeに適用します。英語Hero・ブランド・カテゴリ見出しはInterのローカル可変フォント、本文はArialと日本語システムゴシックを使用。CSSは対象ページにスコープし、KISSAは暖色、FLOWSTATEは青／neutral、FORMEは明色、SMART INBOXはnavy／cyan。FLOWSTATEの実LPにも同じ青を適用し、デモ操作は保持しています。

## Component map

- Header / Footer: `site.tsx`
- TW mark: `brand-mark.tsx` / `public/brand/tw-mark.svg`
- Home代表作品: `project-feature.tsx`
- 営業FAQ: `faq.tsx`（native details/summary）
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

`npm run qa:design`でFigma対応6ページの6画面幅（320/390/768/1024/1440/1920）を撮影し、axe/focus・画像・overflowを検査。Hero・カテゴリ・作品・料金・納品物・Process・FAQ・Footerを各幅で保存します。

プレビューは `npm run screenshots` で生成し、`src/lib/preview.ts` のリビジョンを更新してから再build。これはNext Image/CDNが旧画像を返すことを防ぎます。撮影時だけlazy imageをeagerにして全画像の読込・欠損を確認し、実サイトの遅延読込は維持します。

Figmaの固定座標・文字重なりはCSSへ持ち込まず、可変高のGrid/Flexで意味のある順序を保持。hoverだけの操作は作らず、focus-visibleとreduced motionを提供します。
