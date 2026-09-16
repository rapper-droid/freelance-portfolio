# TANEBI MASTER BRAND ICON

TANEBI・TANEBI WORKS・TANEBI COMMAND・TSUKUTTA LAB が共有する、**唯一の**ブランドマークです。

サービスの違いはマークの形ではなく、隣に置く文字で表します。

```text
TANEBI                    親ブランド
TANEBI WORKS              制作・受託部門   ← このリポジトリ
TANEBI COMMAND            自分用の運営画面
TSUKUTTA LAB — by TANEBI  自主制作
```

---

## 原本

```text
assets/brand/tanebi-master-icon.jpeg    1254 x 1254 JPEG
```

本人が 2026-09-16 に提示した画像と**バイト単位で同一**です。
同じ原本が `C:\Users\tetsu\Downloads\TANEBI_MASTER_BRAND_ICON.jpeg` にもあります。

原本が無い場合、**想像で再生成しないでください。** 生成スクリプトは停止します。
別の画像で代用すると、そこから先のすべての派生物が別ブランドになります。

---

## 派生物

`node scripts/generate-icons.mjs` がすべてを原本から生成します。

| 出力                                  | 用途                                     |
| ------------------------------------- | ---------------------------------------- |
| `src/app/favicon.ico`                 | ブラウザタブ（16 / 32 / 48 の3枚を内包） |
| `src/app/icon.png`                    | 高解像度favicon（512）                   |
| `src/app/apple-icon.png`              | Apple Touch Icon（180）                  |
| `public/icons/icon-192.png`           | PWA                                      |
| `public/icons/icon-512.png`           | PWA                                      |
| `public/icons/icon-maskable-512.png`  | Android maskable                         |
| `public/icons/tanebi-social-1024.png` | SNSプロフィール                          |
| `public/brand/tanebi-mark.png`        | header / footer（38px表示・3x）          |
| `public/brand/tanebi-mark-og.png`     | OGPカード内のマーク                      |

許可されている操作は **crop / resize / padding / format変換** だけです。

**禁止**: 中心構造の描き直し、別マークの作成、形状・配色・発光表現の変更、
「似たロゴ」のAI生成。小さいサイズで細部が潰れる場合も、
新しい形へ再設計せず、同一原本の crop で解決します。

### サイズごとのcrop

原本は広い黒地の中央にマークがあります。16pxではその黒地が大半を占めて
マークが潰れるため、小さいサイズほど余白を削ります。余白量は定数ではなく、
**輝度から実測した作画範囲**を基準にしています（原本を差し替えても壊れません）。

```text
favicon 16/32/48   余白 +2%    黒地をほぼ除去
icon / PWA         余白 +12%
apple-icon         余白 +22%   Appleが独自に角丸を付けるため原本の額装を残す
maskable           作画を76%に縮小し、原本の地色でpadding
```

maskable は Android が中央80%の円で切り抜く可能性があるため、
円の内側に収まるよう縮小しています。

---

## 実測した色

原本から k-means（k=6, 256x256）で抽出した値です。**目分量ではありません。**
再測定は `scripts/generate-icons.mjs` と同じ方法で行えます。

| 色           | 値        | 面積比 | 用途                                    |
| ------------ | --------- | ------ | --------------------------------------- |
| 地の黒       | `#0e0906` | 48.4%  | background / theme-color / icon padding |
| ember shadow | `#230e06` | 23.8%  | 沈んだ面                                |
| ember mid    | `#4d1906` | 9.6%   | —                                       |
| warm white   | `#f0debf` | 7.5%   | 本文インク                              |
| warm tan     | `#cea276` | 6.9%   | 補助テキスト                            |
| ember accent | `#993f12` | 3.7%   | —                                       |

グロー（彩度0.5以上・輝度90以上の画素）の分布:

```text
上位 1%   #fdea6f
上位 5%   #fdd958
上位15%   #fcbe69   ← accent として採用
上位35%   #eea371
上位60%   #dd812c
```

### コントラスト（`#0e0906` 上、WCAG）

```text
#f0debf   15.00:1   本文（AAA）
#cea276    8.54:1   補助テキスト（AAA）
#fcbe69   11.6:1    accent（AAA）
#b9562f    4.18:1   装飾のみ。小さい文字には使わない
```

`#b9562f` は本文には使いません。4.5:1 を下回る用途は装飾に限定します。

---

## TANEBI HQ との関係

親ブランドの Design DNA は `C:\Users\tetsu\tanebi-hq` の
`apps/hq/public/styles.css` から読み取っています（HQは変更していません）。

| DNA                       | HQ                 | WORKS での扱い                |
| ------------------------- | ------------------ | ----------------------------- |
| 暖色のaccentを1つだけ持つ | `--ember: #b4370f` | 原本実測の ember を採用       |
| 暖色に寄せた地とインク    | `--paper: #faf7f2` | WORKSは暗い地。暖色方向は共有 |
| 小さい角丸                | `--radius: 3px`    | 過度に丸くしない              |
| 明確なfocusリング         | `3px solid ember`  | 同じ考え方を適用              |

HQ は明るい紙、WORKS は暗い地です。**役割が違うため、見た目を機械的に
コピーしていません。** 共有しているのは accent・暖色・focus・余白のリズムです。
