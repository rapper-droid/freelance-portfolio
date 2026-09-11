# Sales Hub v2 — 設計・調査記録

2026-09-11 / branch: codex/portfolio-sales-hub-v2 / baseline: 785986d

## 確認したもの

README、Issue #1、PORTFOLIO_SALES_HUB_V2.md、全src構成、package.json、既存3デモのUIと処理、Vitest、Playwright/axe、Visual QAスクリプト、既存QA記録、CSS、metadata/sitemap/robots、Git状態を調査。開始時はclean。Next.js App Router / React / TypeScript / Tailwind 4 / Lucideを維持する。既存11単体テストと8 E2Eシナリオを回帰検証に使用する。

## 設計

- `/works/[category]`: 12カテゴリ。型付きカタログから生成し関連作品だけを表示。
- `/projects/[slug]`: 共通ケーススタディ。想定依頼、課題、解決、デバイス別実画面、料金、期間、納品物、QA。
- `/demos/[slug]`: 新規体験。既存csv/inbox/adminの静的ルートは維持。
- Server Componentsを基本とし、フィルタ・入力・操作のみClient Components。
- カフェ / SaaS / EC / 問い合わせ自動化 / 予約 / 改善 / クリエイティブ / QAを主要8作品とし、CSV・既存問い合わせ・顧客管理を補助作品として公開。
- トップ・カテゴリ・作品のすべてからプラットフォーム内メッセージ用の相談文コピーへ誘導。
- CSSトークンと独立した作品ビジュアルを設け、Figmaで後から確認・再構成しやすくする。

## 維持する安全性

全作品を自主制作と明記。成果の数値や顧客実績を創作しない。既存CSV数式対策、入力検証、localStorage破損時対応を維持。AI体験はローカルルールであり、実モデル利用やメール送信を装わない。予約・購入も架空データを用いたブラウザ内デモ。相談本文を外部送信しない。計測は列挙されたイベントと公開カタログIDのみ。外部サービス未設定時も動作する。

## 完了検証

lint / format / typecheck / Vitest / build / 既存と新規E2E / axe / 320・390・768・1440px / 全カテゴリ・作品・デモ / 不正URL / metadata・sitemap / キーボード / reduced-motion / 実画像確認。結果はQA.mdに実測で記録する。
