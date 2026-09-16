# TSUDOWA BRAND MARK

TSUDOWAの親ブランド用シンボルと、その派生資産の正本です。

## 意味

4つの開いた弧が、中心の輪へ集まっています。閉じた円ではなく間を残すことで、
集まって終わるのではなく、つくったものが次へ広がる状態を表します。

```text
外側の4要素   人 / 技術 / 作品 / 事業
中心の輪      TSUDOWAという共有思想
開いた間      接続 / 循環 / 次の事業への余白
```

人物の輪、握手、network nodes、infinity、AI脳、回路、炎は使っていません。

## 正本

| ファイル                             | 用途                     |
| ------------------------------------ | ------------------------ |
| `public/brand/tsudowa-mark.svg`      | 暗い背景のprimary vector |
| `public/brand/tsudowa-mark-dark.svg` | 明るい背景               |
| `public/brand/tsudowa-mark-mono.svg` | 単色印刷・刻印           |

線幅と間隔は16px表示で潰れないことを基準にしています。wordmarkは画像へ焼き込まず、
隣接する`TSUDOWA`テキストで構成します。

## 派生資産

`node scripts/generate-icons.mjs`がprimary SVGから次を生成します。

```text
src/app/favicon.ico
src/app/icon.png
src/app/apple-icon.png
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/icon-maskable-512.png
public/icons/tsudowa-social-1024.png
public/brand/tsudowa-mark-og.png
```

別の形を手作業で描き足さず、形を変える場合は3つのvector正本と生成物を同時に更新します。

## ブランド構造

```text
TSUDOWA              親ブランド
├─ TETSU WORKS        制作・受託部門
├─ TSUKUTTA LAB       PRODUCTS & PLAY（別ブランド）
└─ NEXT VENTURES      未発表。現時点でサービスとして表示しない
```

シンボルを各子ブランドへ強制適用しません。TETSU WORKSはTSUDOWAとの関係を明記し、
TSUKUTTA LABは既存の独立した表現を維持します。

## OWNER REVIEW

最終的な形状・字間・印刷物での見え方は`TSUDOWA_BRAND_FEEL`としてOWNER確認対象です。
この確認はproduction merge/deploy前に行います。
