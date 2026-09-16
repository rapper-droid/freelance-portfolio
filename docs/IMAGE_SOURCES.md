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
