# TSUDOWA Design System

## ブランド階層

```text
TSUDOWA
├─ TETSU WORKS      制作・受託部門
├─ TSUKUTTA LAB     プロダクト・実験・研究
└─ FUTURE VENTURES  今後のサービス・事業
```

親ブランドは `TSUDOWA / ツドワ`、思想は「集う＋輪」です。TETSU WORKSは消さず、相談、制作、納品を担当する受託部門として表示します。TSUKUTTA LABは既存の別事業名として並列に置き、未発表の事業名は作りません。

## ブランド資産

- 正本マーク: `public/brand/tsudowa-mark.svg`
- 暗背景用: `public/brand/tsudowa-mark-dark.svg`
- 単色版: `public/brand/tsudowa-mark-mono.svg`
- コンポーネント: `src/components/brand-mark.tsx`
- OGP: `public/og.svg` / `public/og.png`
- favicon / app icon: `src/app/favicon.ico`、`src/app/icon.png`、`src/app/apple-icon.png`
- PWA: `public/icons/`

マークは4つの要素が中央へ集まり、輪として次へ広がる構造です。形状、余白、色を場当たり的に描き直さず、SVGを生成元として各サイズへ展開します。

## 言葉

```text
PRIMARY               TSUDOWA
READING               ツドワ
TAGLINE               GATHER. BUILD. EXPAND.
MESSAGE               集まり、つくり、次へ広がる輪。
CLIENT_SERVICES       TETSU WORKS
WORKS_TAGLINE         BUILD. AUTOMATE. DELIVER.
```

TSUDOWAをWeb制作会社、AI会社、ゲーム会社のどれか一つに限定する説明は避けます。具体的な受託能力、料金、納品、相談導線はTETSU WORKSの文脈で示します。

## 二つの人格

同じ基盤を共有し、役割で人格を分けます。色だけを差し替えた同じテンプレートにはしません。

| 　       | TSUDOWA（親ブランド）                     | TETSU WORKS（受託）                                         |
| -------- | ----------------------------------------- | ----------------------------------------------------------- |
| 役割     | 母艦・世界観・集まる場所                  | 制作・受注・信頼・理解速度                                  |
| 地色     | forest charcoal `#101411` / 紙 `#e8e3d8`  | studio black `#0e0906` / panel `#1c1816`                    |
| 見出し   | 大きな英語 3 行と短い日本語、余白で語る   | 日本語が先、数字（料金・納期）と行動が近い                  |
| ナビ     | WORKS / LAB / BUILD LOG / CONTACT（抽象） | 制作例 / サービス / 料金 / 進め方 / よくある質問 + 相談する |
| 動き     | 到着時の組み上がり、ゆっくりした面の開き  | ホバーで画像が呼吸、CTA は押し込み、情報は動かさない        |
| スタイル | `src/components/hq/hq.css`                | portfolio cascade + コンポーネント CSS（下記）              |

共通のシグナルは amber（`#f1b761` / `#fcbe69`）。デモは各自の identity を保ち、TSUDOWA・WORKS の色で塗りません（`src/components/demo-identities.css`）。

## トークン（正本：`src/app/tokens.css`）

値を二度使う前に tokens.css へ追加します。旧名（`--motion-*`, `--ease-enter`, `--premium-ease` など）は tokens.css の別名として残し、他のファイルで再定義しません。

| 種類       | トークン                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| 色         | `--tsudowa-*`, `--works-*`, `--color-amber*`                                                                   |
| 文字       | `--text-label` 11px, `--text-caption` 12px, `--text-small` 13px, `--text-body`, `--text-lead`, `--text-h1..h3` |
| 余白       | `--space-1..10`（4px 基準）, `--gutter`, `--section-y`, `--content-max`, `--tap-min` 44px                      |
| 形・影     | `--radius-xs..lg`, `--radius-pill`, `--shadow-soft`, `--shadow-lift`                                           |
| 動き       | `--dur-press/fast/base/slow/image`, `--ease-out/in/standard/emphasis`                                          |
| フォーカス | `--focus-color`, `--focus-width`, `--focus-offset`                                                             |

フォント系トークン（`--font-display`, `--font-body`, `--font-mono`）は next/font が `--font-sales` を定義する `body` に置きます。`:root` に置くと未定義の変数を参照して無効になります。

## 文字の規則

- 読ませる文字の下限：英字ラベル 11px、日本語を含む文字 12px。aria-hidden の装飾ミニチュアは対象外。
- 見出しと `*lead*` は `word-break: auto-phrase`（文節で改行）と `text-wrap: balance`。段落は `text-wrap: pretty`。
- auto-phrase とは `overflow-wrap: break-word` を組み合わせます（1 行に収まらない文節だけを割る）。`anywhere` は min-content まで下げるため、flex の行で英単語が途中で割れます（例：「Cappuccin / o」）。grid/flex の子を最長の文節より細くする必要があるときは、その部品の規則に `min-width: 0` を置きます。
- 大見出しはローカル Inter の可変フォント、本文は日本語システムゴシック。大文字英語は短く、意味のある日本語を近くへ置きます。
- 色だけに意味を依存せず、focus-visible と reduced motion を維持します。

## 広い画面（1440px 超）

- 内容の列は 1440px（WORKS の各セクション）または 1280px（問い合わせ）で中央に置きます。左寄せの箱を作りません。
- 背景色を持つ帯（カテゴリの導入、「この種類の仕事を依頼した場合。」、業務ツールの experience）は画面端まで色を伸ばし、内容は `padding-inline: max(余白, calc((100% - 1440px) / 2 + 余白))` で同じ列に保ちます。`max-width` で帯ごと切ると 1920px で箱の縁が見えます。`/contact` は `main` に帯の色を置き、1280px の本体を中央に置きます。
- ショーケースの experience は 1520px 以上で作品台（artboard）として見せます。業務ツールはアプリとして画面を満たします。同じ効果を全部に使いません。

## CSS の所有（どこを直すか）

以前は同じ要素の規則が最大 7 ファイルに分散し、読み込み順で見た目が変わっていました。次の部品は 1 ファイルが所有します。修正は所有ファイルで行い、後ろに上書きレイヤーを足しません。

| 部品                                               | 所有ファイル                                           |
| -------------------------------------------------- | ------------------------------------------------------ |
| TETSU WORKS ヘッダー / フッター / モバイルメニュー | `src/components/works-chrome.css`（+ `works-nav.tsx`） |
| 制作例カード / グリッド                            | `src/components/project-card.css`                      |
| デモの枠（全 11 デモ共通）・experience バー        | `src/components/demo-frame.css`（+ `demo-frame.tsx`）  |
| TSUDOWA のページ・文書ページ                       | `src/components/hq/hq.css`                             |
| 404 / エラー                                       | `src/app/core.css`（全ページ共通の最小 CSS）           |
| 問い合わせフォームと各状態                         | `src/components/contact-intake.css`                    |

残りの WORKS ページは `src/components/portfolio-styles.css` の 10 層カスケードのままです。触る要素は、DevTools で実際に値を決めている規則を特定し、その規則を直します。

## ページ構成

- WORKS Header / Footer: `src/components/site.tsx`（ナビは `works-nav.tsx`）
- デモ: `src/components/demo-frame.tsx`（`DemoFrame` と業務ツール用 `DemoShell`）
- TSUDOWA home / history / lab / privacy: `src/components/hq/*`, `src/app/{page,history,lab,privacy}`
- TETSU WORKSのサービス、実績、料金、納品、工程: `/works` の 01〜07 は連番。共有セクション（`Process`）は `/works` でだけ番号を持ちます
- 11作品 / 12カテゴリ: `src/lib/portfolio.ts`を正本とし、移行のためにデータを変更しない
- Contact: 既存の入力・コピー導線と安全なサーバー送信を維持

## デモの独立性

KISSA、FLOWSTATE、FORME、SMART INBOXなどの各デモは、それぞれの題材に合う世界観を持つ独立作品です。親ブランド色を一律に上書きしません。共通Header/FooterとSEOでTSUDOWA / TETSU WORKSへの帰属を示し、デモ本体の操作、データ、レスポンシブ動作は保持します。

## QA

- 全公開 53 route（TSUDOWA 6（404 を含む）+ TETSU WORKS 47）と実行時エラー画面を 8 幅（320 / 360 / 390 / 430 / 768 / 1024 / 1440 / 1920）で撮影・監査した手順と結果は `docs/VISUAL_POLISH.md`
- `npm run qa:design`: 主要6ルート×6幅、axe、focus、画像、overflow、runtime
- `npm run qa:visual`: 全37ルート×4幅の表示監査
- `npm run screenshots`: 代表作Previewの再生成
- `npm run qa:links`: 内部リンク・遷移監査
- `npm run qa:performance`: Core Web Vitals基礎検査

固定座標で文字を重ねず、Grid/Flexと可変高を使います。hoverだけの操作を作らず、320pxから1920pxまで意味順を保ちます。最終的な「TSUDOWAらしさ」は自動スコアで確定せず、`TSUDOWA_BRAND_FEEL`としてオーナー確認に残します。
