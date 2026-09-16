# TANEBI SIGNATURE EFFECTS

指示書V2・26章の実装記録です。「綺麗」ではなく、**意味のある動き**を目標にしています。

実装は2ファイルだけです。

```text
src/app/tanebi-effects.css    演出とtoken（見た目はすべてここ）
src/components/effects.tsx    reveal監視とpointer追従（2つの仕事だけ）
```

---

## 演出文法

| 文法      | 意味                   | 実装箇所                                                    |
| --------- | ---------------------- | ----------------------------------------------------------- |
| EMBER     | 小さな火種・静止時     | demoの起動ドット、nav下線の待機状態                         |
| IGNITION  | ユーザーが起こした点火 | Primary CTA の hover / press / afterglow、serviceカードの縁 |
| SPREAD    | 内容が静かに現れる     | scroll reveal（title / group / image / section）            |
| TRACE     | 道筋をたどる           | 「依頼→納品」フローの段階表示                               |
| AFTERGLOW | 直後に残る余韻         | CTA押下後のリング（480ms）                                  |

---

## 安全側に倒した設計

**演出が失敗しても、内容は必ず表示されます。**

hidden状態は `<html data-reveal-ready="on">` が付いている間だけ有効で、
この属性を付けるのは `effects.tsx` だけです。

```text
JSが動かない      → 属性が付かない → 全部表示
JSがエラーで止まる → 属性が付かない → 全部表示
Reduced Motion    → 属性を付けない → 全部表示
```

scroll演出の典型的な事故は「opacity:0 のまま戻らず白紙になる」ことです。
仕事を受けるサイトでそれは起こしてはいけないので、
**表示がデフォルト、非表示がオプトイン**にしています。

実測でも `hiddenAfterFlagRemoved: 0` を確認しています。

### 属性名を分けた理由

当初 `<html>` のフラグと対象要素のマーカーに同じ `data-reveal` を使っていましたが、
`querySelectorAll('[data-reveal]')` が `<html>` 自身を拾っていました（実測で発覚）。
フラグは `data-reveal-ready` に分離しています。

---

## Effect Quality Gate（26.11）

実ブラウザで計測した結果です。**コードを読んだだけの判定はしていません。**

```text
SIGNATURE_HERO_EFFECT          PASS
CTA_IGNITION_FEEDBACK          PASS
CARD_MICRO_INTERACTION         PASS
SCROLL_REVEAL_QUALITY          PASS
NAV_MOTION                     PASS
DEMO_STATE_ANIMATION           PASS
REDUCED_MOTION                 PASS
MOBILE_EFFECT_DENSITY          PASS
NO_TEXT_OBSCURED_BY_EFFECT     PASS
NO_EFFECT_INPUT_DELAY          PASS
NO_EXCESSIVE_PARTICLES         PASS
NO_ANIMATION_PERF_REGRESSION   PASS
```

### 実測値

**CTA（実hover）**

```text
rest   box-shadow rgba(252,190,105,0) 0 0 0 1px   filter none
hover  box-shadow rgba(252,190,105,0.5) 0 6px 22px -10px   filter brightness(1.05)
press  translate3d(0,1px,0) + glow-active（80ms）
after  tanebi-afterglow 480ms（登録済みkeyframe）
```

**Serviceカード（実hover）**

```text
縁の点火   scaleX 0 → 1
見出し     +4px 移動、色が ember へ
矢印       +3 / -3 移動
```

**Nav（実hover）**

```text
ember下線  scaleX 0 → 1   rgb(252,190,105)  高さ1px
```

**Demoの状態遷移（連続frame）**

チケット 1001 → 1002 を選択したときの `.ticket-detail`:

```text
frame 0   opacity 0       progress 0.00   running
frame 1   opacity 0.342   progress 0.06   running
frame 2   opacity 0.581   progress 0.13   running
frame 3   opacity 0.736   progress 0.19   running
settled   opacity 1
```

静止スクリーンショットでは示せないため、フレーム値を証拠として残します。

**Scroll reveal**

```text
対象6件がすべて表示        6/6
上へ戻しても再発火なし      6/6 のまま
表示領域内で隠れていた瞬間   0回   ← 修正後
終了時点で非表示の要素      0
```

計測で最初に見つけたのは「最終的に全部出るか」ではなく、
**「画面内にあるのに隠れている瞬間があるか」**でした。
当初の設定（rootMargin 下 -12% ＋ threshold 0.12）では、
背の高い section が画面に入ってからでないと条件を満たさず、
`.sales-quality` が表示領域内で opacity 0 のまま留まる瞬間がありました。
scroll演出が「到着」ではなく「壊れたページ」に見える瞬間です。

到着前に発火するよう変更しています（threshold 0 ＋ 下マージンを正に）。

**性能（ページ全体をスクロールしながら計測）**

```text
中央値フレーム   16.7ms
p95              16.8ms
最悪フレーム     16.8ms   ← 60fps を一度も割っていない
50ms超のlongtask 0件
canvas / video   0 / 0
無限ループanimation 0件（サイト側）
```

**入力の即応性**

```text
CTA中心の最前面要素   A.button primary（演出レイヤーが被っていない）
ハンドラ到達          0.8ms
hero glowレイヤー     pointer-events:none / z-index:-1
```

**Reduced Motion**

```text
reduce用 @media ブロック   9件
un-hideルール             opacity:1 !important / clip-path:none !important
                          transition:none !important / animation:none !important
フラグ除去時の非表示要素    0件
```

> 検証方法：OSの設定自体は切り替えられないため、
> (1) 配信されたCSSに reduce ルールが存在すること、
> (2) runtime が `matchMedia` を見てから属性を付けること、
> (3) 属性を外した状態（= reduce時と同じ経路）で何も隠れないこと
> の3点で確認しています。

**モバイルの演出密度**

```text
390px    hero glow display:none    stagger 30ms
1276px   hero glow display:block   stagger 45ms
```

情報・操作・CTAは幅によって変えていません。

---

## していないこと

```text
DOM particle          使っていない
canvas / WebGL        使っていない
動画背景              使っていない
intro gate（ENTER）   作っていない
pointermoveごとのstate更新   していない（rAFで1frame 1回に制限）
```

`blur` / `box-shadow` のanimationは避け、
できあがったレイヤーの `opacity` と `transform` を動かしています。

デモ画面の配色・レイアウトは変更していません。作品そのものだからです。
追加したのは状態変化のtransitionと、選択が変わったときの
パネル再マウント（`key`）だけです。

---

## 本人判断の項目

```text
TANEBI_SIGNATURE_FEEL   OWNER_REVIEW
```

指示書27章の指定どおり、これだけは自己判定していません。

実ブラウザで触って、

- TANEBIらしいか
- 気持ちいいか
- 邪魔ではないか
- 仕事を頼むサイトとして信用できるか

をご確認ください。確認ポイントは最終報告に記載しています。
