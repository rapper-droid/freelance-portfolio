# TSUDOWA MOTION & INTERACTION

## 原則

Motionは「集まる → つくる → 広がる」の順序を補助します。炎や点火の再現を目的にしません。

```text
使う      セクションの到着、因果関係、処理結果、brand orbitの方向
使わない  常時発光、操作を待たせる演出、全要素同一fade、動画背景
```

runtimeは`src/components/effects.tsx`、見た目は`src/app/tsudowa-effects.css`です。
JavaScriptが失敗してもcontentは最初から読めるfail-safe構造を維持します。

## Accessibility

`prefers-reduced-motion: reduce`ではopacity、transform、clip-path、animationを停止し、
情報、順序、CTA、操作状態を変えません。

## OWNER REVIEW

```text
TSUDOWA_BRAND_FEEL   OWNER_REVIEW
```

確認観点は、親ブランドとして狭く見えないか、輪・接続・拡張が無理なく伝わるか、
演出が営業情報より前へ出ていないかです。
