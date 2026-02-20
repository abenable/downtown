# AGENTS.md

## Project identity
- Product: **Campus Downtown**
- Domain: Uganda-focused university marketplace (Kampala)
- Stack: Medusa v2 backend (`downtown`) + Next.js storefront (`downtown-storefront`)

## Repository layout
- `downtown/`: Medusa backend, modules, APIs, workflows, subscribers, scripts.
- `downtown-storefront/`: Next.js storefront, checkout, account, vendor-facing views.
- `docker-compose.yml` (repo root): Full-stack deployment (Postgres, Redis, backend, storefront).

## Architecture overview
- Marketplace logic lives in backend modules:
  - `src/modules/marketplace`
  - `src/modules/payout`
  - `src/modules/refund`
  - `src/modules/support`
  - `src/modules/pickup-location`
  - `src/modules/product-review`
- Payment providers are configured in `downtown/medusa-config.ts`.
- Notification providers are configured in `downtown/medusa-config.ts` and implemented in:
  - `downtown/src/modules/email-notification`
  - `downtown/src/modules/sms-notification`

## Payment rules (current)
- Stripe is removed from active runtime.
- Checkout payment providers:
  - `pp_iotec-pay_iotec`
- Mobile money provider implementation:
  - `downtown/src/modules/iotec-pay`
- Frontend payment UX:
  - customer enters Uganda number
  - `Place order` triggers payment authorization flow (mobile money prompt)

## SMS rules (current)
- SMS provider is UG-SMS v2.
- Backend implementation:
  - `downtown/src/modules/sms-notification/service.ts`
- Required env vars:
  - `UGSMS_API_KEY`
- Optional env vars:
  - `UGSMS_BASE_URL` (default `https://ugsms.com`)
  - `UGSMS_SENDER_ID` (default `Downtown`)
  - `UGSMS_MESSAGE_TYPE` (default `transactional`)

## Development guardrails
- Keep all customer phone flows Uganda-first (`2567XXXXXXXX`).
- Do not reintroduce Stripe dependencies or Stripe env vars unless explicitly requested.
- Prefer adding new marketplace logic as Medusa modules/workflows, not ad-hoc route code.
- Keep checkout payment provider IDs aligned between:
  - backend `medusa-config.ts`
  - region seed scripts
  - storefront `paymentInfoMap`

## Data and migrations
- Some legacy column names still include `africatalking_*` in payout/refund models.
- Treat these as compatibility fields until a planned migration renames them.
- If renaming fields, include backward-safe migrations and update admin APIs in same PR.

## Deployment
- Preferred production entrypoint: repo-root `docker-compose.yml`.
- Build/start:
  - `docker compose build`
  - `docker compose up -d`
- Backend exposed on `:9000`, storefront on `:8000`.

## PR checklist
- Backend builds: `cd downtown && npm run build`
- Storefront builds: `cd downtown-storefront && npm run build`
- Verify checkout for both providers (MTN + Airtel).
- Verify SMS send path with UG-SMS credentials in non-dev env.
- Update env docs and compose files when adding new integrations.
