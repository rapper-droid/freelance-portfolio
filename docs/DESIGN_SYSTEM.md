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

## 色とタイポグラフィ

| Token           | Value                  | 用途             |
| --------------- | ---------------------- | ---------------- |
| `studio-paper`  | `#090300`              | 親ブランドの背景 |
| `studio-ink`    | `#f8f2e7`              | 主要文字         |
| `studio-muted`  | `#cbbfb0`              | 補足             |
| `studio-accent` | `#ff5c35`              | 中心・CTA・状態  |
| `studio-gold`   | `#ffc866`              | 輪・接続・強調   |
| `studio-border` | translucent warm white | 境界             |

大見出しはローカルInterの可変フォント、本文は読みやすい日本語システムゴシックを使います。大文字英語は短くし、意味のある日本語を近くへ置きます。色だけに意味を依存せず、focus-visibleとreduced motionを維持します。

## ページ構成

- Header / Footer: `src/components/site.tsx`
- Parent-brand hero / architecture: `src/components/brand-architecture.tsx`
- Parent home: `src/app/page.tsx`
- Brand styling: `src/app/tsudowa-brand.css`
- Base sales UI: `src/app/sales-ui.css`
- Art direction: `src/app/art-direction.css`
- TETSU WORKSのサービス、実績、料金、納品、工程: 既存セクションを維持
- 11作品 / 12カテゴリ: `src/lib/portfolio.ts`を正本とし、移行のためにデータを変更しない
- Contact: 既存の入力・コピー導線と安全なサーバー送信を維持

## デモの独立性

KISSA、FLOWSTATE、FORME、SMART INBOXなどの各デモは、それぞれの題材に合う世界観を持つ独立作品です。親ブランド色を一律に上書きしません。共通Header/FooterとSEOでTSUDOWA / TETSU WORKSへの帰属を示し、デモ本体の操作、データ、レスポンシブ動作は保持します。

## QA

- `npm run qa:design`: 主要6ルート×6幅、axe、focus、画像、overflow、runtime
- `npm run qa:visual`: 全37ルート×4幅の表示監査
- `npm run screenshots`: 代表作Previewの再生成
- `npm run qa:links`: 内部リンク・遷移監査
- `npm run qa:performance`: Core Web Vitals基礎検査

固定座標で文字を重ねず、Grid/Flexと可変高を使います。hoverだけの操作を作らず、320pxから1920pxまで意味順を保ちます。最終的な「TSUDOWAらしさ」は自動スコアで確定せず、`TSUDOWA_BRAND_FEEL`としてオーナー確認に残します。
