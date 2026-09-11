# TETSU / WORKS — Final Art Direction

## 目的

`tetsuworks.com` を、クラウドワークス／ランサーズ等の制作・納品案件で「この人に任せたい」と感じてもらえる、海外の小規模デザインスタジオ級の営業ポートフォリオへ最終研磨する。

今回の目的は機能追加ではなく、ブランド解像度・タイポグラフィ・レイアウト・作品演出・マイクロインタラクションの品質を上げること。

## デザイン正本

Figma: https://www.figma.com/design/bv0O39N0hmW8bxMSYlwY0n

優先ページ／セクション:

- Final Art Direction
- Brand System
- Brand Polish Applied
- Case Studies
- Portfolio Sales UI

Figma MCPが使える場合は実ファイルを読み、spacing / typography / hierarchy / grid / mobile差 / FAQ / footer / logo / editorial works layoutを確認する。

## 最重要原則

- 既存の11作品、12カテゴリ、デモ、問い合わせ、SEO、Analytics、Sentry、Netlify構成は壊さない。
- `main` は変更しない。
- 作業ブランチは `codex/portfolio-final-art-direction`。
- 過剰な3D、過剰なGlow、アイコン乱用、派手なエフェクトは避ける。
- 静止画だけでも美しく、動きは補助。
- Performance 95+、Accessibility / Best Practices / SEO 100目標。
- mobileはdesktop縮小版にしない。

## Brand

### ロゴ

TETSU / WORKS 専用のTW幾何学マークを実装する。
用途:

- Header
- Footer
- favicon
- OGP
- 小型ブランドスタンプ

文字ロゴとマークを併用し、マーク単体でも識別可能にする。

### タイポグラフィ

狙いはEditorial + Digital Studio。

- Hero英字は非常に大きく、密度高く。
- 補助ラベルは小さく、letter-spacingを効かせる。
- 日本語本文は読みやすく細め。
- 見出しと本文の太さ・サイズ差を大きくする。
- Figma上の文字組みを優先。

Hero copy:
BUILD.
AUTOMATE.
DELIVER.

### 背景

完全な黒ベタ一辺倒ではなく、気付かない程度の質感を加える。

- subtle grid
- 2〜4%程度のtexture/noise相当
- lime radial glow
- section divider
- 大きな薄いTW monogram

ただし可読性とPerformanceを優先。

## Hero

Figma Final Art Directionを最優先。

- 巨大タイポ
- TW monogram
- Trust要素
- MESSAGE-ONLY OK
- 必要最小限のCTA
- 静止状態で完成しているデザイン

### Motion

Motionは統一タイミングを持たせる。
推奨:

- entrance 450–700ms
- hover 160–220ms
- image zoom 300–450ms
- easingは統一
- prefers-reduced-motion対応

Hero文字は軽いstagger/clip reveal程度。読みにくい分解演出は禁止。

## Service Selector

カードUI感を弱め、Editorialな一覧へ。

- 01 / WEB SITE
- 02 / LANDING PAGE
- 03 / E-COMMERCE
- 04 / WEB APP
- 05 / AI AUTOMATION
- 06 / API / INTEGRATION
- 07 / DESIGN
- 08 / QA & DELIVERY

番号・大きな文字・細い横罫線・最小限の矢印を使用。
hover時は背景塗りつぶしではなく、文字・線・矢印・微移動中心。

既存12カテゴリURLは維持。

## Selected Works

トップでは代表4作品を主役としてEditorialに表示。

- KISSA
- FLOWSTATE
- FORME
- SMART INBOX

全作品同一カードテンプレに見せない。

### KISSA

- 暖色
- 写真を大きく
- カフェ／紙／雑誌的余白

### FLOWSTATE

- grid
- SaaS
- 精密
- UI中心

### FORME

- fashion / product editorial
- 商品画像を大胆に
- 余白と商品訴求

### SMART INBOX

- navy / cyan
- system / operations
- 業務フローとUI

各作品に小さく:

- index
- category
- year
- SELF-INITIATED
- role / deliverable

をEditorial metadataとして表示。

## Icons

アイコンは必要箇所だけに限定。
統一線幅・統一サイズで以下に使用:

- RESPONSIVE
- SOURCE
- README
- QA
- DELIVERY
- MESSAGE-ONLY

装飾のための大量アイコンは禁止。

## FAQ

トップ下部または営業導線直前に追加。
最低限:

1. Zoomなしでも進められますか？
2. 原稿・画像が揃っていなくても依頼できますか？
3. 修正対応はどのようになりますか？
4. 納品形式は何ですか？
5. WordPress / Next.js / Shopify等は対応できますか？
6. 短納期は相談できますか？
7. AIを使う場合、品質確認はどうしていますか？

回答は短く、営業的に安心感を与える。過剰な保証はしない。

## Footer

Final Art DirectionのFooterを基準に再設計。

- TW mark
- TETSU / WORKS
- DESIGN. BUILD. SHIP.
- Works / Services / Process / QA
- tetsuworks.com
- 直接連絡先は掲載しない

## Case Studies

既存のKISSA / FLOWSTATE / FORME / SMART INBOXは世界観を維持しつつ、ブランド側のHeader/Footer/metadataとの整合を取る。

画像は既存Visual Assetsを活かす。

- KISSA: coffee / interior
- FORME: charcoal / sage / sand / texture
- FLOWSTATE: product UI / board
- SMART INBOX: workflow / control UI

## Micro interactions

全体の速度感を統一。

- CTA arrow slide
- editorial row hover
- image subtle scale
- project metadata reveal
- selected works transitions
- FAQ accordion
- header nav underline/shift

過剰なparallax、cursor replacement、scroll hijackは禁止。

## Responsive

320 / 390 / 768 / 1440を最低確認。
Mobileでは:

- Heroを短く
- monogramを邪魔しない位置へ
- CTAは1つを主に
- Service selectorは縦
- Selected Worksは画像優先
- metadataは小さく整理
- FAQはタップしやすく
- Footerは縦組み

## QA

必須:

- format
- lint
- typecheck
- unit
- build
- E2E
- axe
- links
- visual QA
- Lighthouse

既存テストを弱めて通すことは禁止。

Figmaとの差分をPlaywright screenshotで確認し、Hero / Service Selector / Selected Works / FAQ / Footer / Mobileを目視相当で修正する。

## Git

作業ブランチ: `codex/portfolio-final-art-direction`

推奨commit:

- feat: add final tetsu works brand system
- feat: elevate hero and editorial service navigation
- feat: redesign selected works with project-specific art direction
- feat: add sales faq and premium footer
- test: expand final art direction visual qa
- docs: record final portfolio art direction

pushまで行う。
`main`および本番ブランチへのmerge/pushは行わない。

## 完了条件

- Final Art Directionが実サイトに反映
- TW logo mark実装
- favicon/OGP更新
- typography強化
- subtle background treatment
- editorial service selector
- selected worksが作品ごとに異なる世界観
- FAQ追加
- premium footer
- unified micro motion
- desktop/mobile高品質
- 既存機能維持
- QA green
- branch push済み
- working tree clean

最終ゴールは「高品質な個人ポートフォリオ」ではなく、「小規模でも非常に洗練されたデジタル制作スタジオの営業サイト」に見えること。
