# WORKS / Design system & Figma review

## Principles

仕事を選ぶ → 制作例を触る → 納品内容を知る → サービス内メッセージへ戻る。操作の目的が分かる見出し、強い文字組み、落ち着いた紙色、作品ごとに異なる表現を使う。

## Tokens

`src/app/hub.css`の`:root`が営業サイト用の基準。既存デモのトークンは`globals.css`を維持。

| Token      | Value                  | Use               |
| ---------- | ---------------------- | ----------------- |
| hub-paper  | #f7f8f4                | ページ背景        |
| hub-ink    | #193b32                | 本文・見出し・CTA |
| hub-accent | #d8ed9e                | 強調・補助面      |
| hub-muted  | #52665e                | 補助テキスト      |
| hub-border | #dce2d8                | 境界              |
| hub-radius | 18px                   | 大きな面の基準    |
| hub-space  | clamp(24px, 5vw, 80px) | ページ左右余白    |

書体はシステム日本語サンセリフ、英字見出しはArial、カフェ等の編集表現はGeorgia / Yu Mincho。Webフォントの通信・レイアウトシフトなし。写真ではなく、コーヒー・タンブラー・プロダクトUIをCSSでオリジナル制作。広告はエクスポート可能なSVG。

## Component map

- Header / Footer: `site.tsx`
- CategoryFilter: `portfolio-grid.tsx`
- ProjectCard (Server Component): `project-card.tsx`
- ProjectArt: `project-art.tsx`
- SalesInfo / Process: `sales.tsx`
- Contact: `contact.tsx`
- CaseStudy: `app/projects/[slug]/page.tsx`
- Demo interactions: `showcase-demos.tsx`

## Figmaで後からレビューする

1. `npm run screenshots`で最新の実画面を生成。
2. Desktop 1440、Tablet 768、Mobile 390のフレームを作成し、対応する画像を配置。画像は参照レイヤーとしてロックする。
3. 上記トークンをFigma Variablesへ写し、ヘッダー・カテゴリ選択・カード・CTA・納品情報をコンポーネント化。
4. Hover / Focus / Selected / Disabled / Empty / Error / Dialogの状態を確認。
5. 特に320pxでの長い日本語、2列→1列の順序、ヘッダーのタップ領域、表の局所スクロールを確認。
6. 修正は元コンポーネントとCSSトークンへ戻し、画像を再生成して照合する。

今回Figmaファイルは作成していません。コードと実画面を設計の正本として、アカウント接続なしでもレビュー可能な構造を用意しています。
