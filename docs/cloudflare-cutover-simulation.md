# Web cutover simulation and rollback — NOT EXECUTED

Reviewed September 17 UTC / September 18 JST, 2026. Production remains Netlify. This plan requires a separate OWNER approval after real contact delivery and all release gates pass. The isolated candidate Worker `tsudowa-production` now exists with no Custom Domain; see [production candidate state](cloudflare-production-candidate.md) for its configuration and remaining blockers.

## Current verified web state

| Surface               | Current state                                                   | Effect of a later approved cutover                                             |
| --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Apex                  | DNS-only A record to Netlify; HTTPS 200                         | An approved production Worker Custom Domain becomes the web origin             |
| www                   | DNS-only CNAME to Netlify; 301 preserves path and query to apex | Must explicitly retain this redirect; attaching apex alone does not handle www |
| Worker Custom Domains | None for this zone                                              | Create only for explicitly approved web hostnames, never wildcard mail hosts   |
| SSL                   | Valid Netlify certificate covers apex and www                   | Wait for Cloudflare-managed certificate coverage/status; do not weaken TLS     |
| Email Routing MX      | Three existing apex MX records                                  | No changes required                                                            |
| Resend DKIM           | Existing resend selector TXT                                    | No changes required                                                            |
| SPF                   | Separate apex routing SPF and send-subdomain SPF                | No changes required; do not combine or replace them during web migration       |
| Return-Path           | Existing send-subdomain MX/SPF infrastructure                   | No changes required; envelope behavior still needs actual delivery evidence    |

Other protected records: Cloudflare DKIM and rsend CNAME. There are nine mail-related records and two web records. Compare by record ID/type/name/content/priority/TTL/proxy before and after any future web operation.

The live Netlify certificate expires December 16, 2026, 10:01:15 UTC, as observed in this run. This is a snapshot, not a guarantee about future renewal. The Workers preview has its own workers.dev certificate; that does not prove future custom-domain SSL readiness.

## Final staged cutover plan — awaiting OWNER approval

Supersedes the general order kept below. State verified 2026-09-18; see
[production candidate state](cloudflare-production-candidate.md). Steps 1, 3 and
5 of that older list are already satisfied: the Resend Secret is stored, the
isolated candidate Worker exists, and the www redirect is implemented and tested.
Nothing in this plan has been executed.

### Stage 0 — checkpoint before any change

Re-read and record, stopping on any drift: candidate Worker name, deployed
version and 100% split; the three Secret names present and no Secret name as a
plain variable; `CONTACT_STATE` and `ASSETS` bindings; `GET /api/contact`
reporting enabled; all 11 DNS records with IDs; apex and www HTTPS status and
certificate expiry; the known-good Netlify deploy over its permalink; Email
Routing rule enabled; Git HEAD clean and the deployed build matching it. Rebuild
with `TSUDOWA_WORKERS_TARGET=production` if the candidate is redeployed, because
the working `dist/` may hold a preview-target build and the boundary guard
refuses a mismatch.

### Stage 1 — apex Custom Domain

Attach `tsudowa.com` as a Custom Domain on `tsudowa-production`. Cloudflare
replaces the apex A record with its managed mapping; record the removed record
so the rollback table below stays accurate. Wait for the managed certificate to
report active before judging anything. Do not delete the Netlify site, deploy,
environment or certificate.

### Stage 2 — www

Attach `www.tsudowa.com` as a second Custom Domain, deliberately resolving the
existing CNAME to `tsudowa.netlify.app`. The Worker answers www with a 308 to the
apex, preserving encoded path and query; Netlify currently answers 301. Both are
permanent redirects, so link equity is preserved, but the status code changes and
308 additionally preserves the request method. Verify a path-and-query redirect on
the real hostname, not only in unit tests.

### Stage 3 — mail must not move

No MX, SPF, DKIM, Return-Path, Email Routing rule or Resend DNS record is touched
at any stage. Custom Domains create web hostname mappings only. After both web
changes, re-read all nine protected mail records and confirm they are unchanged
in every functional field, and that the Email Routing rule for
`contact@tsudowa.com` is still enabled.

### Stage 4 — web verification before the inquiry

On the real apex: all 10 audited routes 200, assets and images, fonts, no console
or page errors, canonical, OGP, Twitter, JSON-LD, robots and sitemap, axe A/AA,
internal links and anchors, three widths. Confirm the candidate `noindex` applies
only to `.workers.dev` and that the apex is indexable again. Re-measure TTFB,
LCP, CLS, TBT and Lighthouse on the apex and compare against the pre-cutover
Netlify medians.

### Stage 5 — one real production inquiry

Send exactly one inquiry through `/contact/general` on `https://tsudowa.com`,
with a human-solved Turnstile challenge. Never bypass Turnstile, never use a test
key, never substitute a fixture token, and never send directly through Resend as
a stand-in for browser delivery. Then confirm, recording IDs only:

1. Success UI, displayed receipt and internal request ID.
2. Resend acceptance and `delivered` for both messages.
3. Owner mail into `contact@tsudowa.com`, Cloudflare Email Routing transit, and
   arrival in OWNER Gmail, with SPF and DKIM passing.
4. Automatic acknowledgement to the sender.
5. From is `TSUDOWA <no-reply@tsudowa.com>` on both; owner Reply-To is the
   sender address; acknowledgement Reply-To is `contact@tsudowa.com`.
6. Subjects, body details, source page and receipt consistent across UI and mail.
7. Production Durable Object records for this receipt: receipt mapping, payload
   fingerprint, receipt metadata, owner-sent and acknowledgement-sent flags.

Then resubmit the same payload and identity with a fresh single-use Turnstile
token and confirm the existing receipt is returned with zero additional mail.
This is the first and only inquiry that proves production contact.

### Stage 6 — hold and observe

Keep the Netlify project, deployment, environment and certificate until OWNER
separately approves retirement. Watch errors and contact behavior. Make no
promise of zero downtime or immediate DNS convergence.

### Rollback conditions — any one triggers Stage 7

Apex or www failing HTTPS or serving 5xx; the managed certificate not active in a
reasonable window; any protected mail record or the Email Routing rule altered;
the production inquiry failing to deliver either message; mail arriving with a
wrong From, Reply-To or receipt; duplicate mail on the fresh-token replay; a
route, asset or metadata regression not present on Netlify; or a performance
regression clearly worse than the pre-cutover medians.

### Stage 7 — rollback

Detach the Custom Domains and restore exactly the two web records in the table
below, then re-verify against the known-good Netlify deploy. Mail configuration is
independent of the web origin and is never part of a rollback. Do not re-cut over
automatically after a rollback; diagnose first and obtain a fresh approval.

## Exact future order — earlier general plan, retained as history

1. Obtain the missing credential through protected input and complete the single logical real inquiry, owner receipt via routing, auto-reply, header/ID comparison, and duplicate check. Keep contact disabled if any required setting or evidence is absent. Review the exact commit and deployed version.
2. Obtain separate OWNER authorization for production cutover. Re-read DNS, Worker mappings, Netlify deploy/environment and certificate status; stop on unexpected drift. Check the known-good fallback over HTTPS.
3. Prepare a separate production Worker from the reviewed code. Use the names-only production manifest. Remove preview-only noindex in the production build, omit CONTACT_ORIGIN, retain apex canonical, use production secrets and a production state namespace. Do not expose the preview's test state as production history.
4. Review and attach the apex Custom Domain. This can replace/conflict with the existing web DNS record; it is a production mutation and is not performed in this phase.
5. For www, use an explicitly approved www Custom Domain with a tested path/query-preserving permanent redirect to apex. Resolve the existing www CNAME conflict deliberately. The current candidate does not yet implement a production www redirect; implement and verify it in the separately approved production preparation. Do not assume wildcard matching or that apex covers www.
6. Confirm managed certificate readiness and HTTPS on both names. Check all routes, images, canonical, robots/sitemap, preview noindex isolation and the www redirect. Confirm the nine protected mail records are byte-for-byte equivalent in their functional fields.
7. Retain Netlify project, deployment, environment and certificate resources until OWNER separately approves retirement. Continue observing errors and contact behavior; do not promise zero downtime or immediate DNS convergence.

[Cloudflare Custom Domains documentation](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) documents exact-hostname matching, CNAME conflicts and managed DNS/certificates. None of these changes has been made in this phase.

## Known-good fallback

- Netlify project: tsudowa
- Site ID: 728f34ef-949c-446c-aab2-e5d69f32521e
- Published deploy: 6aabc4aec1247183915ad890
- HTTPS permalink: https://6aabc4aec1247183915ad890--tsudowa.netlify.app
- Production project, environment and certificates must not be deleted.

## Web-only rollback

On approved rollback, stop the newly introduced www redirect / Worker hostname mappings as necessary, detach the newly introduced Custom Domains, then restore exactly the two web records below. Confirm no conflicting record remains; restore by verified name/type if Cloudflare assigned a new ID during cutover.

| Name            | Type  | Target              | Proxy | TTL | Original record ID               |
| --------------- | ----- | ------------------- | ----- | --- | -------------------------------- |
| tsudowa.com     | A     | 75.2.60.5           | false | 300 | 8ec5b01dcdad56408ac4aec94b41957b |
| www.tsudowa.com | CNAME | tsudowa.netlify.app | false | 300 | f0f66819d01af9b06a434c8c2ee9ca32 |

Verify apex HTTPS, www path/query redirect and key routes against the known-good Netlify deploy. Leave all MX/SPF/DKIM/Return-Path/routing configuration untouched. Keep both environments' state and secret stores; do not replay pending submissions automatically or purge idempotency state.

The retained Netlify baseline has direct form submission disabled. A web rollback therefore restores the known-good website and its contact email link, not a claim that the new Workers form continues to run on Netlify. Existing mail routing remains independent of the web origin.
