# Campus Downtown

Campus Downtown is a Uganda-first university marketplace for Kampala. The repo contains a Medusa v2 backend, a Next.js storefront, and a root Docker Compose file for full-stack deployment.

## Repo layout

- `downtown/`: Medusa backend, marketplace modules, custom APIs, workflows, subscribers, scripts.
- `downtown-storefront/`: Next.js storefront, checkout, account area, vendor registration, vendor dashboard.
- `docker-compose.yml`: root compose file for Redis, backend, and storefront.
- `AGENTS.md`: implementation guardrails and project-specific agent guidance.

## Current product shape

- Multi-vendor marketplace with vendor registration and vendor dashboard.
- Uganda-first phone flows using `2567XXXXXXXX`.
- Mobile money checkout via iOTEC Pay.
- SMS notifications via UG-SMS v2.
- Email notifications via Resend.
- Pickup locations, reviews, wishlists, payouts, refunds, and support workflows.

## Payments

Stripe is not part of the active runtime.

Current checkout payment provider:

- `pp_iotec-pay_iotec`

Relevant payment code:

- Backend provider: `downtown/src/modules/iotec-pay`
- Backend config: `downtown/medusa-config.ts`
- Storefront payment mapping: `downtown-storefront/src/lib/constants.tsx`

Checkout flow:

- Customer selects mobile money.
- Customer enters a Uganda phone number and network.
- `Place order` triggers the iOTEC authorization prompt.
- Storefront surfaces provider prompt state, but final success confirmation should still be treated as the authoritative payment event.

## Vendor setup

Vendor setup now includes:

- customer-to-vendor registration flow
- vendor status handling: `pending`, `approved`, `rejected`
- vendor settings page for store identity
- payout phone and network setup for mobile money payouts

Relevant files:

- Registration API: `downtown/src/api/vendors/route.ts`
- Vendor self-service API: `downtown/src/api/vendors/me/route.ts`
- Payout settings API: `downtown/src/api/vendors/payment-settings/route.ts`
- Storefront vendor register page: `downtown-storefront/src/app/[countryCode]/(main)/vendor/register`
- Storefront vendor settings page: `downtown-storefront/src/app/[countryCode]/(main)/vendor/dashboard/settings`

## Development

### Backend

```bash
cd downtown
npm install
npm run dev
```

Backend runs on `http://localhost:9000`.

### Storefront

```bash
cd downtown-storefront
npm install
npm run dev
```

Storefront runs on `http://localhost:8000`.

### Build checks

```bash
cd downtown
npm run build

cd ../downtown-storefront
npm run build
```

Note: storefront build-time data fetching expects the backend to be reachable.

## Docker

The root `docker-compose.yml` is the preferred deployment entrypoint.

```bash
docker compose build
docker compose up -d
```

Ports:

- Backend: `9000`
- Storefront: `8000`

Important: the compose file no longer defines application environment variables. Runtime configuration must come from the image, platform-level environment injection, or another external configuration mechanism.
Important: the compose file also assumes an external Postgres database. It does not create a database container.

## Operational checks

- Verify MTN checkout.
- Verify Airtel checkout.
- Verify vendor registration and status flow.
- Verify vendor payout settings save correctly.
- Verify UG-SMS send path in a non-dev environment.

## Guardrails

- Keep all customer and payout phone flows Uganda-first.
- Do not reintroduce Stripe unless explicitly requested.
- Prefer Medusa modules and workflows over ad hoc route logic.
- Keep payment provider IDs aligned across backend config, seed scripts, and storefront constants.
