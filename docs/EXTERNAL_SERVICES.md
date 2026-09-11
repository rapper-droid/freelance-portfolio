# External services / connection checklist

この変更で有料サービスの購入・課金・カード登録・本番公開は行っていません。画像はCSS/SVGとローカル実画面から制作しており、有料素材の追加購入は不要です。

## 接続する場合だけ利用者が行うこと

- ホスティング先でリポジトリをインポートし、公開オリジンを設定。
- 商用用途に適したホスティングプランを選択。Vercel Hobbyは非商用限定なので営業用途の公開先として無条件に推奨しません。
- PostHogのプロジェクトを作り、Project tokenとリージョンを設定。Eventsで5イベントを確認。
- SentryのBrowser JavaScriptプロジェクトを作り、公開DSNを設定。Previewでテストエラーを確認。
- 独自ドメインを取得し、公開先が提示するDNSレコードを設定。

費用は今回0円。計測は必要量に合う無料枠から開始し、課金上限を利用者が設定してください。ホスティング・ドメインの金額は契約時の公式価格を確認し、許容予算1〜3万円の中で選択。Figmaの有料契約や素材購入は必須ではありません。

## 接続後の確認

1. HTTPSと正規URL。
2. 全カテゴリ・作品・Live Demo・画像・404。
3. title / canonical / OGP / Twitter Card / sitemapのホスト。
4. 相談文をコピーできること（外部直接連絡先は追加しない）。
5. 分析イベントに入力本文が入らないこと。
6. Sentryにエラー本文・個人情報が入らないこと。
7. 公開環境でもE2E相当の操作とLighthouseを再確認。

参考: [PostHog Capture API](https://posthog.com/docs/api/capture)、[Vercel Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)、[Vercel Hobbyの用途条件](https://vercel.com/docs/plans/hobby)、[Cloudflare Next.js](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)。
