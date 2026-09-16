# 画像・ブランド資産の出どころ

公開面で使用する画像と生成資産の出典です。

| ファイル                               | 出どころ                              | 用途                           |
| -------------------------------------- | ------------------------------------- | ------------------------------ |
| `public/brand/tsudowa-mark*.svg`       | 本移行で設計したeditable vector       | header / footer / light / mono |
| favicon・PWA・social・OGP用TSUDOWA PNG | 上記SVGから`generate-icons.mjs`で生成 | browser / app / social         |
| `public/visuals/kissa-*.webp`          | AI生成・架空店舗                      | カフェデモ                     |
| `public/visuals/forme-*.webp`          | AI生成・架空商品                      | ECデモ                         |
| `public/previews/*.webp`               | 自サイトのスクリーンショット          | 制作例                         |
| category key visual 12点               | `generate-keyvisuals.mjs`で自動生成   | WORKSカテゴリ                  |

AI生成画像は画面上で架空であることを明記します。

## 旧ブランド資産

`assets/brand/tanebi-master-icon.jpeg`と`docs/screenshots/tanebi-remake/`は移行履歴の証拠として保持します。
public配下の旧TANEBI mark/social assetは削除し、配信対象には残しません。

## 実写

出典・撮影者・ライセンス・取得日を記録できない実写は導入しません。
新しい素材を加える場合はこの表へ1点ずつ追記し、watermarkや権利不明素材は使いません。

## 2026-09-17 premium imagery

今回の写真はCodex内蔵画像生成機能で新規生成した架空店舗・架空メニューの画像です。
実在店舗や実際の納品案件の撮影写真ではありません。生成時に第三者画像は入力していません。
人物、ロゴ、文字、透かしは依頼していません。公開前にOWNERが不自然な細部・意図しない類似を確認します。
独占権・商標権などを保証する資料ではありません。

| 配信ファイル                          | 用途                              | 種別・元データ                              | プロンプト概要                                                                                                                           | 編集・配信サイズ                                               |
| ------------------------------------- | --------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `public/visuals/kissa-ritual-v2.webp` | TOP / webカテゴリ / cafe hero     | AI生成 `assets/imagery/kissa-ritual-v2.png` | 日本の静かな喫茶店。窓からの自然光、木のテーブル、手作りの乳白色カップのラテ、クロワッサン。現実的な質感、編集写真、人物・文字・ロゴなし | 構図の編集なし。1536×1024から1440×960、WebP q82、124,862 bytes |
| `public/visuals/kissa-food-v2.webp`   | cafe Foodメニュー / atmosphere    | AI生成 `assets/imagery/kissa-food-v2.png`   | 厚切りバタートースト、卵サンド、少量の葉物、陶器の皿、木のテーブル、自然光。ブランドや文字なし                                           | 同上、172,912 bytes                                            |
| `public/visuals/kissa-space-v2.webp`  | WORKS hero / cafe atmosphere      | AI生成 `assets/imagery/kissa-space-v2.png`  | 小さな日本の近隣カフェ。木のカウンターと椅子、落ち着いた壁、左からの窓光、エスプレッソ機器。歪みのない垂直線、人物・看板なし             | 同上、160,036 bytes                                            |
| `public/visuals/kissa-drip-v2.webp`   | cafe Coffeeメニュー / recommended | AI生成 `assets/imagery/kissa-drip-v2.png`   | 陶器のドリッパーとガラスのサーバー、ブラックコーヒー、揃いのカップ、細口ケトル。木のカウンターと窓光。作為的な湯気・文字・人物なし       | 同上、119,984 bytes                                            |

再生成ではなく同一元画像からの配信変換は`node scripts/premium-images.mjs`で再現できます。
合計577,794 bytes。写真の切り抜きはCSSのobject-fitによる表示範囲調整のみです。

### 自サイトの画面・図版

- `public/previews/*-premium-3.webp`: 実装済み11デモをdesktop/tablet/mobileで撮影した33点。`scripts/portfolio-screenshots.mjs`で再取得。架空データ・自主制作表示を保持。新しいURLで変更前の画像キャッシュを避ける。
- `src/components/premium-exhibits.tsx`: 自作のsemantic HTML/CSS図版。API接続、分類・人による確認、QA、code構造、device構成。図版内に検証していない成功率や導入数を表示しない。
- `src/components/operations-overview.tsx`: 問い合わせの実状態と顧客配列から算出する集計・meter。画像焼き込みではない。
- アイコンは既存依存`lucide-react`（ISC）の利用範囲。新たな第三者イラストの取得なし。
- `kv-*.webp`は旧カテゴリ背景の履歴として残すが、新カテゴリHeroでは配信参照しない。

### 参考閲覧の扱い

参考URLと採用した情報設計の観点は`ART_DIRECTION.md`に記録。
外部サイトのキャプチャは外側の`work/premium-references/`に内部比較用として置き、
repositoryの公開素材・販売用素材には含めない。参考素材の再配布許諾を得たという意味ではない。
