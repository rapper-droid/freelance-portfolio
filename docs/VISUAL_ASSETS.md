# ページ別ビジュアルと素材管理

2026-09-11。既存Figma営業UIを維持し、実案件の完成イメージを伝えるための追加です。画像は組み込みimage_genで新規生成／色違い編集し、採用素材を `public/visuals/` にWebPで保存。外部の写真サイト・商標素材・人物写真は使用していません。架空店舗・商品であることをページ上に明記しています。

## 配置と役割

| ページ                           | 素材・表現                                | 目的                                                                         |
| -------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| KISSA デモHero                   | kissa-coffee-v1.webp                      | ラテアート、焼き菓子、温かな店内を一枚で伝える                               |
| KISSA 店舗紹介・ケーススタディ   | kissa-interior-v1.webp、coffee            | 訪れる場所と過ごす時間を想像できる写真構成                                   |
| FLOWSTATE Hero・ケーススタディ   | WorkspaceVisual（HTML/CSS）               | 計画→制作→確認、担当と作業を整理するUIを可読テキストで表現                   |
| FORME 商品メイン                 | forme-sage / sand / charcoal-v1.webp      | 既存のカラー選択と連動する同一構図の商品画像                                 |
| FORME 商品詳細・ケーススタディ   | forme-sage-v1.webp、forme-texture-v1.webp | デスクでの使用シーンとマットな質感を分けて伝える                             |
| SMART INBOX デモ・ケーススタディ | WorkflowVisual（HTML/CSS）                | 受信→分類→担当・下書き→人の確認。管理画面の上にコンパクトな流れを配置        |
| 改善比較・QAケーススタディ       | 3段階のテキスト図解                       | Before/Afterの着眼点、確認・記録・納品を説明。既存の比較・チェック操作を維持 |
| トップ・カテゴリ・全一覧         | 実デモの更新済みスクリーンショット        | カード上の完成イメージとLive Demoを一致させる                                |

写真を機械的に全ページへ配布しません。カフェ外観や独立した豆・スイーツ画像は、既存構成では追加価値が小さいため増やしていません。SaaSとINBOXはラスタ画像の架空UIを使わず、文字が読める軽量コンポーネントを使います。数値成果・AI実行・自動送信を装いません。

## 生成方針・プロンプト

生成元: 組み込みimage_gen。新規生成3回、FORME色違い編集2回。APIキー／新サービス契約は追加していません。生成時の原本はCodexのgenerated_imagesに残し、サイトが依存する採用素材はすべてリポジトリ内に保存しています。

### KISSA coffee — photorealistic-natural

High-end editorial photograph for fictional KISSA coffee shop website. Warm Japanese neighborhood cafe interior, handmade ivory ceramic cup with rosetta latte art on a dark walnut table, flaky pastry, softly blurred timber counter and sunlit window. Restrained premium magazine photography, cream and deep brown palette, natural morning light, tactile ceramic and wood. Landscape 3:2, cup centered for portrait crop. No people, logos, lettering or watermark; no real establishment.

### KISSA interior — photorealistic-natural

Editorial architectural photograph of a fictional warm intimate Japanese cafe. Empty walnut chairs and tables, creamy plaster, street-facing window with linen curtain, timber espresso counter, ceramic cups and pastries behind glass. Morning sidelight, quiet hospitality, realistic texture without clutter. Wide 3:2. No people, text, logos, signage, watermark or known establishment.

### FORME sage — product-mockup

Premium editorial photograph for fictional reusable tumbler. Unbranded sage green powder-coated stainless steel, straight cylindrical silhouette, softly rounded bottom, flat matching lid, no handle or straw. Centered on limestone desk beside closed cream notebook, natural architectural sunlight and pale neutral background, tactile matte surface. Whole product visible, landscape 3:2 for portrait crop. No people, words, logos or watermark.

### FORME Sand / Charcoal — precise-object-edit

Reference: generated Sage image. Change only body and matching lid color to warm muted sand beige (#bbaa89) / matte dark charcoal (#505450). Preserve shape, finish, scale, position, camera, notebook, stone, vegetation, lighting, shadows and background. No added objects or text. Inspect consistency before adoption.

TextureはSage原本から表面とふたの接合部を切り出した補助画像です。架空商品のイメージであり、実物の仕様や性能を保証する写真として使いません。

## 最適化・更新

- 5画像を幅1200px・WebP品質80へ変換。textureは480×720px・品質82。合計297,502 bytes（約291KiB）、最大約90KiB。[サイズ・SHA-256一覧](VISUAL_ASSETS.json)。これは素材総量であり、初回転送量ではありません。
- `next/image`のwidth/height・sizesを指定。デモHeroだけpreload、補助画像は既定のlazy loading。ホバー画像・背景動画・外部CDNへの依存は追加しません。
- 色選択では必要な1枚を表示。画像とaltの色を一致させ、サンド／チャコールの読込もE2Eで検査。
- モバイルは写真を縦配置、中央の被写体が残るトリミング、質感写真を小さめに配置。ボードとワークフローは縦に流し、文字を画像化しません。
- `src/lib/preview.ts` のrevisionは `visual-worlds-1`。旧プレビューURLは保持。撮影スクリプトは新revisionのパスをNext起動前に登録し、実画面で置換してから詳細ページを撮影します。
- 素材更新時はバージョン付き別名、一覧とハッシュを更新。`npm run screenshots` → build → Visual QAでカードと実画面を揃えます。QA撮影時のみ全画像の読み込みを待ち、失敗を握りつぶしません。

## QA

今回のlint・typecheck・production build・既存E2E・Visual QAは再実行し、結果を `VISUAL_RELEASE_QA.md` に記録します。既存のNetlify・環境変数・問い合わせ・分析・監視・カテゴリURLは変更しません。本番への反映は従来の公開手順に従います。
