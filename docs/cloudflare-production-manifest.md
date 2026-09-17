# Production Workers manifest — names only

This is an inventory, not authorization to create a production Worker or cut over DNS. No credential values are recorded here.

## Required Secrets

- RESEND_API_KEY
- TURNSTILE_SECRET
- RATE_LIMIT_SALT

## Public/runtime variables

- NEXT_PUBLIC_TURNSTILE_SITE_KEY
- NEXT_PUBLIC_SITE_URL
- CONTACT_ENABLED
- CONTACT_FROM_EMAIL
- CONTACT_TO_EMAIL
- HOSTING_PLATFORM
- STATE_BACKEND
- OWNER_REVIEW
- NEXT_PUBLIC_ANALYTICS_ENABLED

## Required bindings

- CONTACT_STATE
- ASSETS

## Preview only — omit from production

- CONTACT_ORIGIN

## Not required by the Workers native implementation

- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

The Netlify adapter remains intact for rollback. Do not remove existing Netlify environment settings based on this Workers-only inventory. Optional monitoring/analytics integrations remain disabled and are outside this activation.

Use protected Cloudflare Secret input, never a command-line argument, pasted chat value, screenshot, committed file or log. Prefer a sending-only Resend key scoped to the verified domain. Keep preview and production state namespaces separate. Retain each environment's stable rate-limit salt across deployments; do not rotate it casually during a retry window.
