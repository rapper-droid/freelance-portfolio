# TSUDOWA — 営業受付とメール契約

更新: 2026-09-17 FINAL MASTER PASS。ローカル検証では `CONTACT_ENABLED=false`。
外部設定変更・実送信・DNS変更・deployは行っていません。

## OWNER確認済みのメール基盤

受信は `contact@tsudowa.com → Cloudflare Email Routing → OWNER Gmail`。
送信は `TSUDOWA <no-reply@tsudowa.com> → Resend`。
ドメインとDKIM/SPF/Return-Path、上記アドレス間の到達はOWNER確認済みという提供情報です。
今回の新しいフォームから2通を送るフローの実配送確認とは別です。

## 受付画面

必須はお名前、返信先メール、ご相談内容(10–2000文字)、同意。
相談種別8択は「まだ決まっていない」を含む。今の状況、予算、希望時期、参考URL、補足、会社は任意。
追加条件はdetailsにまとめ、5段階wizardにしません。スマホには入力欄への短いジャンプリンクがあります。

sourceは既知のrouteだけ。`/works/*`、`/projects/*`、`/demos/*`からカテゴリを初期選択し、利用者が変更できます。
queryや本文をsourceに混ぜず、本文・名前・メール等をURL/analyticsへ入れません。
既に入力中のdraftがある場合はその相談元と入力を優先し、復元を明示します。

同一タブのsessionStorageへ下書きを保存。復元対象は2時間以内。成功時削除。
localStorageへのPII保存、server draft、automatic retryはありません。共有端末では相談後にタブを閉じる案内があります。

## 2通のメール

|          | OWNER通知                                                                                                         | 相談者の自動受付                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| From     | TSUDOWA <no-reply@tsudowa.com>                                                                                    | 同左                                                                     |
| To       | contact@tsudowa.com                                                                                               | 利用者の入力email                                                        |
| Reply-To | 利用者の入力email                                                                                                 | contact@tsudowa.com                                                      |
| 件名     | [TSUDOWA][WEB][5〜10万円] お名前様からのご相談                                                                    | お問い合わせを受け付けました｜TSUDOWA                                    |
| 本文     | 種類・予算・希望時期・状況・名前・会社・email・受付番号を先頭。その後に本文、参考URL、補足、source、ISO日時、UUID | 名前、受付番号、相談種別/予算/時期の短い概要、次の案内、返信可能な連絡先 |
| 形式     | 読みやすいplain text                                                                                              | plain text + escape済みHTML                                              |

第三者への迷惑メール中継を避けるため、受付メールに任意の本文・参考URLをそのまま反射しません。
OWNER通知には必要な全情報を含め、参考URLは未信頼入力であると明記。serverではURLをfetchしません。
production identityは`check-production.mjs`でも固定確認します。secretの値は資料に保存しません。

## 受付番号・idempotency

人用IDは `TSW-YYMMDD-10桁HEX`。UUIDとは別に、Redis SET NXで対応を7日間予約し、衝突時は再生成。
request UUIDごとにpayload fingerprint、固定受信日時、受付番号、OWNER/確認メールの完了markerを保持します。
本文、名前、emailはRedisへ保存しません。IPはsalt付きbucketで扱います。

1. origin、JSON/16KiB/入力、rate、Turnstileを検証。
2. 同じUUIDの異なるpayloadを409で拒否。90秒のtoken付きlockを取得。
3. OWNER通知を送り、成功markerを保存。
4. 受付メールを送り、別markerを保存。
5. 両方providerが受理した場合のみ200 acceptedを返す。

provider keyは `tsudowa-{UUID}-owner` / `tsudowa-{UUID}-confirmation`。
固定receipt/timeから同じbodyを再生成するため、応答消失やmarker書込み失敗後も同じkey/bodyで再試行できます。
完了済みphaseは再送しません。lock解除はLuaでtokenを照合し、別試行のlockを解除しません。
providerの24時間windowを超える重複送信を避け、未完了の再送は23時間で停止。状態TTLは7日であり、永続的な重複排除保証ではありません。

## 部分成功と失敗

OWNERが受理済みで確認メールが失敗した場合は `receipt_pending`。全成功として扱わず、受付番号と「確認メール未送信」を表示。
同じ入力の再試行では残りのphaseだけを処理。入力を変えると新しい相談になるため、部分成功時は変えずに再試行するよう案内。
validation、通信断、rate、依存障害、未設定、処理中、期限切れを分け、入力を消しません。
fetchタイムアウトで自動再送しません。確認メールの「送信」はprovider受理を意味し、Gmail等への到達保証ではありません。

成功画面は受付番号、確認先、内容確認→担当者からメール返信、追加連絡先、作品一覧/TOPリンクを表示し、フォーカスを移します。
受注・納期・会議を自動確約しません。

## 維持する安全境界

- exact Origin、Turnstile success/action/hostname、honeypot、同意。
- JSON 16KiB、各入力の型と長さ、header改行防止、HTTP(S)のみのreference URL。
- IP bucketあたり5回/600秒。メール各attemptに日次50・30日900の共有quota。2通だから消費も2通。
- salt付きfingerprint、UUID、fenced lock、provider idempotency、上流timeout。
- 失敗依存時はfail closed。secretのclient露出・PIIログ出力なし。
- analyticsはcontact_started/category_selected/contact_submitted/contact_success/contact_error。プロパティは既存allowlistのみ。

## 検証と今後

単体テストはAPIの2通・header・retry・quota・Redis失敗・衝突・23時間制限を実行。外部fetch/Redisはmock。
ブラウザテストは3サイズでsuccess・partial・validation・URL・通信断・draft・source・focus/axeを確認。
外側 `outputs/master-pass/email/` のサンプルは `MASTER_CONTACT_EVIDENCE=true npm test` で生成する架空データ。送信しません。
正式公開前には、OWNERが管理する送信可能環境で新しい2通フローの到達と両Reply-Toを最終確認します。
基盤が未構築であるという意味ではありません。今回のローカル送信有効化やsecret提供は不要です。
