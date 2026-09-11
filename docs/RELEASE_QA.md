# 営業公開準備 — 最終品質記録

2026-09-11。アプリ実装commit: `7977ba0`。この後のドキュメント・画像コミットは実装を変更しません。

## 実行結果

| 検証                        | 結果                                                       |
| --------------------------- | ---------------------------------------------------------- |
| prettier / format:check     | 成功                                                       |
| ESLint                      | 成功                                                       |
| Next typegen / TypeScript   | 成功                                                       |
| Vitest                      | 45件、7ファイル、全成功                                    |
| Next production build       | 成功。静的コンテンツと動的contact/analytics APIを生成      |
| Playwright E2E              | 60件、全成功。既存54件を保持して6件追加                    |
| Visual QA                   | 36ルート × 320/390/768/1440px = 144画面成功                |
| 画像・console・実行時エラー | 上記144画面で欠落/エラー0、横はみ出し0                     |
| 内部リンク                  | 36ルートで107リンク/アンカー、全正常                       |
| axe-core                    | E2E対象ページ/操作状態で違反0。送信フォームとprivacyを含む |
| npm audit --omit=dev        | vulnerabilities 0                                          |
| スクリーンショット生成      | 主要8作品40枚・11作品のresponsive previews 33枚を再生成    |
| 追加送信UI実画像            | desktop/tablet/mobile/320pxの4枚を保存                     |
| Git diff --check            | 成功                                                       |

外部サービスは未接続。問い合わせのブラウザテストはAPIとwidgetをモックし、API単体テストはResend/Turnstile/Redisをモックします。実メール到達や本物のCAPTCHAの成功と混同しません。実機Safari/Androidは未実施、Chromiumの相当viewportによる検証です。

## 機能・安全性のテスト内容

- 既存の12カテゴリと11作品、料金・期間・納品物、コピー、CSV処理、inbox、管理画面、EC、予約、自動化デモ、QAデモを保持。
- JSON不正・ストリームサイズ制限・短すぎる/長すぎる本文・メール改行注入・honeypot・同意欠落・不正Originを拒否。
- Turnstileのsuccess/action/hostname不一致を拒否。共有rate limitと全体送信予算を適用。
- 固定宛先・text形式・reply_to・Resend idempotency、同時送信拒否、受付済み再送で二重通知しないこと、同一IDで本文変更時の拒否。
- 依存先拒否・timeout・Redis障害で成功を偽装しない。UIは入力を保持し、新token・同じ送信IDで再試行可能。
- PostHogで匿名UUIDとsource分類を維持し、自由なUTM/本文を除外。Sentryもrequest/user/extra/本文を破棄。
- 不正公開URLや有効化したサービスの環境変数不足で公開用ビルド前検査が失敗すること。

## Visual確認で修正した点

追加フォームの同意チェックボックスが既存の幅100%入力欄ルールを継承し、ラベルを押し出していました。checkbox専用の適切なCSS優先度に修正し、フォーム展開状態の320px検査を追加。desktop/320pxの画像を実際に開いて、読みやすさ・ボタン・同意文・失敗表示を確認しました。既存デザイン・作品内容・品質基準は変更していません。

E2Eのrole=alertはNextのroute announcerと重複したため、フォーム内のalertに限定。テスト削除・skip・閾値緩和は行っていません。

## Lighthouse（モバイル・ローカル本番ビルド）

| ページ         | Performance | Accessibility | Best Practices | SEO | LCP    | CLS | TBT    |
| -------------- | ----------- | ------------- | -------------- | --- | ------ | --- | ------ |
| /              | 98          | 100           | 100            | 100 | 2.25秒 | 0   | 38ms   |
| /works/lp      | 99          | 100           | 100            | 100 | 2.24秒 | 0   | 38ms   |
| /projects/cafe | 100         | 100           | 100            | 100 | 1.81秒 | 0   | 42.5ms |
| /demos/booking | 100         | 100           | 100            | 100 | 1.81秒 | 0   | 35ms   |

[生データ](performance/summary.json)。PostHog/Sentry/Turnstileの実接続によるネットワーク負荷は含みません。実トラフィックのCore Web Vitalsでも、Netlify配信性能の測定でもありません。公開後は同じ公開URLで再計測してください。

## 成果物

- [公開運用・ACTION REQUIRED](PRODUCTION.md)
- [外部サービス費用と上限](EXTERNAL_SERVICES.md)
- [応募URLと応募文](SALES_GUIDE.md)
- [144画面記録](screenshots/portfolio/visual-report.json)
- [107リンク記録](link-report.json)
- [フォーム320px](screenshots/contact-send-320.png) / [PC](screenshots/contact-send-desktop.png)

公開URLは未発行。本人のNetlifyログイン・サービスキー/通知先設定・公開後の受信確認を残しています。main統合は公開の必須条件ではなく、作業ブランチを公開ブランチとして指定できます。Git履歴の書換え・force pushは行いません。
