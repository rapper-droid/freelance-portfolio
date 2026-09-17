# Web cutover simulation and rollback — NOT EXECUTED

Reviewed September 17 UTC / September 18 JST, 2026. Production remains Netlify. This plan requires a separate OWNER approval after real contact delivery and all release gates pass.

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

## Exact future order

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
