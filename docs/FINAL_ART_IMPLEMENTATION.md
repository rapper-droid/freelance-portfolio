# TETSU / WORKS — Final Art Direction 実装記録

2026-09-11。作業ブランチ `codex/portfolio-final-art-direction`、開始点 `5469883`。開始時はclean、fetch後の作業ブランチとoriginの差分は0。main・本番公開・DNS・環境変数は変更しません。

## デザイン正本との対応

[Figma](https://www.figma.com/design/bv0O39N0hmW8bxMSYlwY0n) の実ページをMCPで読み取り。metadataではPage 1のみ返るため、Plugin APIでページを明示ロードしました。Figmaファイル自体は編集していません。

| ページ / node                          | 確認・反映内容                                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Final Art Direction / 12:3、12:179     | Desktop・Mobileのdesign contextと画像。大きな3行Hero、薄いgrid、サービス罫線一覧、編集的な作品配置、FAQ、Footer |
| Brand System / 12:285                  | design contextと画像。TWマーク、lockup、明暗色、タイポ階層、motionの時間とeasing                                |
| Brand Polish Applied / 9:170、9:322    | 実ノード構造。8サービス、4作品、Trustの情報構成                                                                 |
| Case Studies / 4:3、4:56、4:111、4:165 | 実ノード構造。4作品のscope・画像・価格・納期・納品情報を保持                                                    |
| Portfolio Sales UI / 1:2               | ページと既存フレーム構造を確認。従来の営業導線を継承                                                            |

Figmaの6サービス・2作品のみの大きな紹介には縮めず、指示書に従って8サービス／代表4作品と12カテゴリ／11作品を保持。Figma Mobileにある文字の重なり・画面外配置は、Grid/Flexと可変高へ変換しています。

## 実装

- Hero: Desktop最大150px・800 weight・狭い字間。DELIVERだけをlimeにし、補助本文と納品情報に明確な強弱。Mobileは独立した文字サイズ式、単一CTA、圧縮Trust。文字は常に可読状態で短いtranslateのみ。
- TW: `public/brand/tw-mark.svg` はFigma `12:52` から取得した実SVG。`BrandMark`でheader/footer/薄いHero背景へ再利用。faviconは同じバイト列、OGPは同じSVGを埋め込み。期限付きFigma URLへのランタイム依存なし。
- Typography: 既存ローカルInter可変フォントのみ。日本語はシステムフォント、本文の行長と行間を調整。外部フォント通信なし。
- Services: 番号・大きな英字・日本語説明・矢印を罫線で整列。Mobileは説明を次行へ。全12カテゴリ一覧へのリンクも保持。
- Works: `ProjectFeature`をトップ専用に追加。全一覧の既存`ProjectCard`と機能は継続。価格・納期・技術・ROLE・SELF-INITIATED DEMO・詳細／操作リンクを維持。
- KISSA: 暖色の店内写真とコーヒーの小さな差し込み、serifの英字コピー、茶／creamの作品詳細。
- FLOWSTATE: 左側に広いUI、右に説明。青／neutralのプレビュー背景・ケーススタディ・LP・workspace。月年額比較やFAQは既存のまま。
- FORME: 商品を大きく、素材の寄りを差し込み、明色の商品世界観を維持。3色・数量・カート操作は既存のまま。
- SMART INBOX: navy／cyanの実UIと、受信→AI処理設計→人の確認→下書き出力の業務設計例。実デモは固定ルール・AI API／自動送信なしと明記。
- FAQ: 10項目でZoom／非同期・原稿・画像・修正・納品／ソース・responsive・技術選定・短納期・AI品質・公開を網羅。native `details/summary`で開閉状態とEnter／Spaceを提供。重複するARIA stateを手動同期せず、ブラウザ標準の意味を使用。
- Footer: TW lockup、DESIGN. BUILD. SHIP.、CTA、Capabilities／Works／Process／QA／FAQ／Privacy、ドメイン表記、copyright。ドメイン表記はブランド要素でありDNSやcanonical設定は変更しません。
- Motion: hover/arrow 220ms、image 420ms、Hero 600ms + 60ms刻み。reduced motionではすべて無効。scroll hijack・追加animation依存なし。

## 自主レビューでの修正

1. Mobile Heroを利用可能幅に合わせて拡大し、320pxでの収まりを維持。
2. FAQ英字見出しが既存日本語見出しCSSに負ける問題をspecificityで修正。
3. HeaderとFooterのブランドリンクに44pxの操作領域を確保。
4. FLOWSTATEの世界観をcaseだけでなく実LP・workspaceに揃え、更新版の実画面を再生成。

## 構成・保守

`art-direction.css` は最終ブランド表現をhome／共有header/footer／対象caseに限定。既存APIやデモ操作のロジックは変更しません。新コンポーネントはServer Componentsで、FAQのためのclient JSも追加しません。画像には固定寸法・sizes・遅延読込を設定し、既存のcontent-visibilityを保持します。

`qa:design`を6幅（320/390/768/1024/1440/1920）、トップ＋一覧＋代表4詳細へ拡張。全幅で各section／full-page／firstviewを保存し、axe・focus・画像・overflowを検査。E2EへFAQの全開閉・開状態axe・brand asset一致・6幅のtap target／reduced motionを追加。既存66 E2Eと50単体テストは削除・弱体化しません。

CIのpush対象に今回の作業ブランチを追加。Netlify構成、contact OFF、Turnstile／Resend／rate limiting、分析・監視の秘匿化、SEO・canonical・sitemap・robotsを保持。

実測結果と公開手順は [FINAL_ART_QA.md](FINAL_ART_QA.md) と [PRODUCTION.md](PRODUCTION.md) を参照。
