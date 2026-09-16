# TETSU WORKS 営業での使い方

TETSU WORKSはTSUDOWAの制作・受託部門です。応募文では親ブランドの物語を長く説明せず、依頼者に必要な対応範囲、作品、料金目安、納品物を先に示します。

## 共通応募文の骨子

募集内容を拝見しました。AIを活用して制作を効率化しながら、最終的には人が使える完成品まで責任を持って仕上げます。要件整理・設計・制作・実装から、動作確認・修正・ソースと手順書の整理まで、合意した範囲で一貫して対応します。

関連する自主制作の例はこちらです。
https://tsudowa.com/works/web?utm_source=crowdworks

作品詳細に想定依頼、実装した機能、参考料金・期間、納品物を記載しています。デモには実案件の顧客情報や成果実績を含みません。

募集内容と必要な素材を確認し、制作範囲・納期・費用をご提示します。進行は本サービスのメッセージで可能です。

※ 実際の募集要件・応募条件に合わせて冒頭と対応範囲を確認してください。

## 送るURLの選び方

- LPの募集 → `/works/lp`
- 店舗・企業サイト → `/works/web`
- AI・自動化 → `/works/automation`（現在のデモはルールベースと明記）
- アプリ・予約・管理 → `/works/apps`
- 修正・スマホ対応 → `/works/improvement` または `/works/responsive`
- テスト・README・納品整理 → `/works/qa`

## そのまま貼れるURL

- 総合 / CrowdWorks: https://tsudowa.com/?utm_source=crowdworks
- 総合 / Lancers: https://tsudowa.com/?utm_source=lancers
- LP: https://tsudowa.com/works/lp?utm_source=crowdworks
- EC: https://tsudowa.com/works/ec?utm_source=crowdworks
- AI自動化: https://tsudowa.com/works/automation?utm_source=crowdworks

上記URLはTSUDOWA移行版の本番公開後に使用します。公開前はBranch deploy / Deploy Previewの確認用URLと混同しません。

## 正式ドメイン

正式オリジンは `https://tsudowa.com` です。コード内のcanonical、OGP、robots、sitemap、営業URLはこのオリジンへ統一します。ただし、このUnitではドメイン購入、DNS変更、ホスティング接続、本番deployを行いません。

## 流入元付きURL

公開後のHTTPSオリジンに `/works/lp?utm_source=crowdworks` または `/works/lp?utm_source=lancers` を付けます。Web制作なら `/works/web`、管理画面なら `/works/apps`へ置き換えます。案件名、発注者名、秘密情報をURLへ入れません。カテゴリが不明なら `/?utm_source=crowdworks` で十分です。

## 受注後にだけ追加するもの

公開許可を得た実案件の事例と、実際の相談で繰り返し聞かれたFAQを追加します。共有DB、認証、決済、AI実接続は、その機能を含む受注仕様と費用が決まった時だけ追加します。作品数や演出を増やすためだけの追加開発は不要です。
