# Cloudflare-native contact storage — candidate only

## Decision

Use SQLite-backed Durable Objects for the existing contact state operations. A logical Redis key maps to one deterministic `ContactState` object through the private `CONTACT_STATE` binding. This preserves the existing handler's semantics without a new Upstash subscription. Next.js / Netlify retains its existing Redis adapter for rollback.

| Option                 | Decision                                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers KV             | Not the source of truth for leases, counters or deduplication: eventually consistent reads can admit concurrent duplicate operations.                                |
| Rate Limiting binding  | Useful as an optional coarse front-door limit, not exact global send accounting or idempotency. Counters are permissive / eventually consistent and location-scoped. |
| D1                     | Transactions and constraints could implement the requirements, but require a separate schema and expiry cleanup design. Not needed alongside the selected DO model.  |
| SQLite Durable Objects | Selected: serial coordination per state key, durable storage, atomic `transactionSync`, and private RPC.                                                             |

Sources: [KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/), [Rate Limiting accuracy](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [DO SQLite transactions](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

SQLite-backed DOs are available on Workers Free and Paid plans. No paid subscription or upgrade is requested by this implementation. Usage remains subject to the account's existing allowance/limits; it is not a promise of unlimited free operation. Limit/storage failure returns 503, not an in-memory bypass.

## Preserved controls

- Per-IP fixed window: 5 attempts / 600 seconds, HMAC with `RATE_LIMIT_SALT`; only the host-selected trusted IP header is accepted.
- Global mail caps: 50 attempts / day and 900 / fixed 30-day window, including auto-replies. These are fixed buckets, not rolling calendar quotas.
- Submission digest, dated receipt reservation and sent flags retained for 7 days.
- 90-second NX lease; atomic token-checked unlock cannot release another attempt's lease.
- Atomic increments retain their original expiry. Expiry is checked inside the transaction, not dependent on timely alarm delivery.
- Alarms clear expired rows; they never send mail. SQLite schema may remain after row cleanup.
- Stable provider idempotency key for owner and auto-reply phases. Incomplete sends older than 23 hours are not retried, protecting the provider's 24-hour idempotency window.
- No raw form input, raw IP, email address or provider credential is persisted in the state objects.
- Object failures propagate to the existing fail-closed handler. A missing namespace is not replaced by process memory or external Redis.
- No public state mutation API. QA-only probe handlers exist only in in-memory test modules and are never deployed.

This preserves the previous bounded retention contract; it does not promise infinite-lifetime deduplication or mathematically exactly-once external email delivery after arbitrary provider failures.

## Evidence and reproduction

`npm run qa:state:native` tests real workerd / SQLite concurrent NX, atomic counters, expiry, ownership, actual runtime reload, and invalid TTL. It applies four in-memory mutations (remove NX, extend expiry, remove owner check, disable increment); each mutant must fail the safety suite. Mutants never modify production source or deployment artifacts.

`npm run qa:contact:native` executes the built application with real SQLite objects. External Turnstile and Resend requests are intercepted. It tests receipt IDs, owner/auto-reply, Reply-To, retries, conflict, invalid origin/body, token replay, quota, storage outage, concurrent submission, partial send and global caps. These are not actual delivery receipts.

Generated Workers types are checked separately with `npm run typecheck:workers`. Next.js types and build remain separate.

## Remaining external settings

Workers does not require `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN`.

- `RESEND_API_KEY`: owner must supply a sending-only key scoped to the verified domain via protected Cloudflare Secret input. Never paste or commit it.
- `RATE_LIMIT_SALT`: generated once directly into the preview Worker's Secret store; preserve it during candidate updates. No value is stored in the repository or audit logs.
- `TURNSTILE_SECRET`: server-only Secret.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: public runtime configuration returned by GET /api/contact when enabled; do not commit or display its value in the handoff.
- Existing sender, recipient and canonical origin remain unchanged.

The owner has independently verified domain authentication, sending, Email Routing and Gmail delivery. The Resend API also reports the domain verified. That establishes mail infrastructure readiness, not this Worker form's live end-to-end readiness.

## Turnstile and controlled live test — not activated

The existing form embeds Turnstile with action `contact`. The handler checks success, exact action and expected hostname; frontend resets tokens before retries. The new widget must be configured only after the confirmations required by the turnstile-spin skill. Keep the production expected hostname separate from localhost or preview.

Preview widget target: `tsudowa-owner-preview.tetsuyasmile52l.workers.dev` (local test hosts only if explicitly confirmed). Future production widget target: `tsudowa.com`. These are widget allowlists, not DNS changes. Preserve no-clearance / managed behavior; do not introduce a CAPTCHA bypass.

Before the one authorized live submission, provide the missing settings through protected inputs, explicitly configure a preview-only accepted Origin and matching siteverify hostname while keeping canonical `https://tsudowa.com`, and scope activation to a controlled owner test. The current helper deliberately blocks `CONTACT_ENABLED=true`; do not bypass it with an ad-hoc deploy. A reviewed activation step and a real token are required. If Turnstile requests human interaction, the owner must complete it.

Use the exact test label `TSUDOWA Workers 本番前接続テスト`. Verify form success, Resend IDs, owner delivery, Gmail receipt, auto-reply, Reply-To, matching receipt ID, replay rejection and no additional unique provider send on retry. Send only the one logical inquiry. Do not interpret mocked tests, a secret name or a verified domain as proof of this test.

Until that evidence exists, contact remains disabled and CONTACT is BLOCKED. No production DNS, MX, SPF, DKIM, Email Routing, Resend domain or Netlify configuration is changed.
