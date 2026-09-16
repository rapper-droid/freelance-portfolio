# TSUDOWA — ART DIRECTION

親ブランドとTETSU WORKSの営業力を両立するための判断基準です。

```text
理解しやすさ > 信用 > TSUDOWAらしさ > 演出
```

## 1. 中心思想

TSUDOWAの中心は、集う・接続・循環・制作・拡張です。
旧ブランドで使っていた暖色accentは、視認性と既存資産の連続性が高いため残しますが、
炎・ember・ignitionをブランド説明の中心には置きません。

Heroとブランド構造は、輪、軌道、開口、分岐で表現します。

## 2. 色

```text
地        #090300
インク    #f0e9e0
補助      #c2b7aa
accent    #fcbe69  接続点・現在地・重要CTA
罫線      #332c26
```

accentは1色。常時発光させず、意味のある現在地や操作結果に限定します。

## 3. ブランド階層

- TSUDOWA: 親ブランド。制作会社だけに見せない。
- TETSU WORKS: Web制作・AI業務自動化・納品を担う現在の受託部門。
- TSUKUTTA LAB: 別ブランド。TSUDOWAのUIへ無理に統一しない。
- NEXT VENTURES: 未発表。存在しない実績やサービスとして売らない。

TOPは3秒以内にこの関係が分かるよう、Hero直後にブランド構造を置きます。

## 4. リズムと面

```text
セクション縦    clamp(64px, 7.2vw, 104px)
セクション横    60px（狭い画面では25px）
カード内側      18–24px
本文行間        1.75–2.0
```

線だけでなく低明度の面を使い、すべてを同じカードへ押し込まない。
ブランド構造、サービス一覧、作品、工程はそれぞれ別の視覚文法を持たせます。

## 5. 図・画像

画像は理解、信用、完成イメージ、依頼意欲のいずれかを高める場合のみ使用します。
工程・比較・構造はsemantic HTML/CSSを優先し、文字を画像へ焼き込みません。
各デモは独立ブランドの色・タイポグラフィ・UIを維持します。

## 6. Motion

`src/app/tsudowa-effects.css`のrevealは、内容を遅らせず補助するためのものです。
`prefers-reduced-motion`では情報・CTAを失わず静止表示します。

## 7. 技術条件

```text
responsive      情報とCTAを変えず密度を変える
CLS             width/heightまたは固定高を予約
alt             意味のある画像のみ説明。装飾は空alt
contrast        本文4.5:1以上
performance     transform/opacity中心。動画背景なし
```

## 8. OWNER REVIEW

`TANEBI_SIGNATURE_FEEL`は廃止し、最終感覚評価を`TSUDOWA_BRAND_FEEL`として扱います。
自動QAは可読性・破綻・速度を判定しますが、ブランドの最終採否はOWNERが判断します。
