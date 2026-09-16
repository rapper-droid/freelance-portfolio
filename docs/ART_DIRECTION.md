# TSUDOWA — ART DIRECTION

親ブランドとTETSU WORKSの営業力を両立するための判断基準です。

```text
理解しやすさ > 信用 > TSUDOWAらしさ > 演出
```

## 1. 中心思想

TSUDOWAの中心は、集う・接続・循環・制作・拡張です。
旧ブランドで使っていた暖色accentは、視認性と既存資産の連続性が高いため残しますが、
炎・ember・ignitionをブランド説明の中心には置きません。

ブランド構造は輪・開口・分岐で表現します。Heroは抽象的な記号だけに頼らず、
TETSU WORKSの店舗体験と業務ツールを組み合わせ、「思想が実物になる」ことを見せます。

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

## 9. Premium refinement / 2026-09-17

- TOP: 黒褐色の編集的な余白、三行の思想、実物の写真と操作UI。親ブランドの領域を維持し、受託窓口はTETSU WORKSと明記。
- WORKS: 店舗の空間写真と業務UIを重ねた入口。カテゴリ選択の前に「何をつくれるか」を見せる。
- 12カテゴリ: editorial / screen / code / devices / compare / product / flow / poster / qualityを使い分ける。飾りだけの背景画像は表示から外す。
- ケース11件: 各ブランドの配色を残し、実画面を大きく額装。番号付きの設計説明と、実際のデモ・納品情報の優先順位を統一。
- KISSA: 写真の大きな面、明朝体、印刷メニューのようなリスト。おすすめ・空間・アクセスのリズムを分ける。
- Inbox / Admin: 説明は開閉式、作業領域を前面へ。集計は画面の実データに追従し、飾りの成功率や売上推移は作らない。
- Booking: 週単位の選択と当日の一覧を連動。日付は架空予約サンプルとして明記。
- Motion: 1.035倍までの画像反応、1pxのpress、短いunderline、選択パネルの切替。自動ループやheavy parallaxは追加しない。
- Accessibility: route変更時にrevealを再登録。reduceへ切り替えた場合も全内容が読める。明るいECケースの色変数を暗色サイトで上書きしない。

### 構成比較に用いた公開参考

[Pentagram Work](https://www.pentagram.com/work)の大小をつけた作品面と短いキャプション、
[Kurasu](https://kurasu.kyoto/)の写真を主役とする商品・文化の見せ方、
[Cal.com](https://cal.com/)の見出しと予約UIを並べた説明構造、
[Linear](https://linear.app/)の製品説明とUIの関係を参考にした。
参考のロゴ、画像、コード、コピーは転用していない。内部参照キャプチャはpublicへ入れない。

今回の構成・コピー・HTML図版は本サイト向けの独自実装。品質評価の基準は比較画像の模倣ではなく、
「何ができるか」「触れるか」「依頼時に何が届くか」を短時間で理解できることである。
