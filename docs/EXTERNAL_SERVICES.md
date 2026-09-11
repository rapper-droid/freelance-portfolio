# 外部サービスと費用判断

2026-09-11に公式情報を確認。USD表示は為替・税別。今回契約・支払・利用料発生は0円、現存アカウントの請求全体は未確認。初期構成は全サービスFreeで月0円、独自ドメインは任意。月30,000円は上限であり目標ではありません。

| サービス                                                                                  | 無料枠                                     | 有料化した場合                              | 必要性・期待効果                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Netlify](https://www.netlify.com/pricing/)（採用）                                       | 月300 credits、商用利用可                  | Personal $9/月・1,000 credits、Pro $20/月〜 | Nextを維持して公開。初回は無料で営業URLを得る。上限停止を監視し、実アクセスに応じて最小有料枠へ                                                                                      |
| [Vercel](https://vercel.com/pricing)（比較）                                              | Hobbyは非商用                              | Pro $20/月〜＋従量                          | ネイティブNext運用は簡単。ただし初期商用サイトには無料プランが適さない                                                                                                               |
| [Cloudflare Workers](https://developers.cloudflare.com/workers/platform/pricing/)（比較） | 100,000 requests/日（CPU等の制限あり）     | $5/月〜＋従量                               | 配信費は安いが[Next対応](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)のadapter/runtime適合・再検証が必要。今回は移植費用に対する営業上の利点が小さい |
| [Resend](https://resend.com/pricing)（採用）                                              | 月3,000通・日100通                         | Pro $20/月・50,000通、超過従量              | 相談通知を確実に運ぶ。本文をAPIから固定宛先へ送る                                                                                                                                    |
| [Turnstile](https://developers.cloudflare.com/turnstile/plans/)（採用）                   | Free、20 widgets、検証リクエスト無制限     | Enterprise個別見積もり                      | bot投稿を抑え、正常な相談の通知が埋もれるのを防ぐ                                                                                                                                    |
| [Upstash Redis](https://upstash.com/pricing/redis)（採用）                                | 256MB・月500,000 commands                  | Pay as you go $0.20/100,000 commands等      | 複数サーバーでrate limit・予算・重複防止を共有。本文保存DBは作らない                                                                                                                 |
| [PostHog](https://posthog.com/pricing)（既存を改善）                                      | Product Analytics 月100万イベント          | 超過$0.00005/イベントから段階単価           | 流入元別に料金閲覧・相談までの離脱を把握                                                                                                                                             |
| [Sentry](https://sentry.io/pricing/)（既存を改善）                                        | Developer 月5,000 errors、1 uptime monitor | Team $26/月〜（年払い表示、契約周期による） | 表示障害と送信失敗を検知し、依頼機会の損失を防ぐ                                                                                                                                     |

[Netlify Freeの商用利用](https://www.netlify.com/blog/introducing-netlify-free-plan/) / [Next.js adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)。Freeは無制限ではなく、[クレジット上限でサイト停止](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)の制約があります。月300のうち本番deployは1回15 creditsなので、編集ごとの本番deployを避けPreviewで確認します。月50/75/90%の残量通知とSentry uptimeを推奨。

## 費用の上限

- AI APIは導入しないためAI課金0。診断を増やすより既存の料金・期間・作品詳細から相談へつなぐ方が今回の目的に合います。AIサービスの比較・実装は将来の受注要件が出るまで不要です。
- メールは全体50回/UTC日・900回/30日固定窓、分析20,000回/30日固定窓。Redisの原子カウンターで全インスタンス共通。失敗再送も加算する安全側の設計。
- Free契約を維持し、有料自動アップグレード・auto recharge・PAYGは有効にしない。アプリ上限だけではホスト帯域、Redisへの不正大量アクセス、Sentryの公開DSNへの送信を完全には制限できないため、契約側の無料停止とトラフィック制御を併用。
- Upstash枠が尽きたらフォーム/分析は閉じます。サイトとコピー相談は継続。ホスト枠が尽きるとサイトも停止するので残量監視は必要。
- 最初の有料化候補は実アクセスに応じたNetlify Personal $9のみ。他は無料枠で営業初期に十分。30,000円を使い切る提案はしません。

設定手順と本人操作は [PRODUCTION.md](PRODUCTION.md)。価格変更時はリンク先と契約画面を優先してください。
