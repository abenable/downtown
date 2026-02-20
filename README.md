# Campus Downtown

Campus Downtown is a multi-vendor marketplace for university students in Kampala, built with **Medusa v2** (backend) and **Next.js** (storefront).

This repository contains both applications and deployment configuration.

## Repository Structure

- `downtown/` - Medusa backend (API, admin, custom modules, workflows)
- `downtown-storefront/` - Next.js storefront
- `docker-compose.yml` - root full-stack deployment (Postgres, Redis, backend, storefront)
- `AGENTS.md` - contributor and agent implementation guidance

## Core Features

- Multi-vendor marketplace
- Uganda region + UGX support
- Mobile money checkout:
  - MTN Mobile Money
  - Airtel Money
- SMS notifications via UG-SMS v2
- Email notifications via Resend
- Pickup and delivery support
- Product reviews, wishlist, vendor dashboards, payouts/refunds modules

## Current Payment & SMS Integrations

### Payments

Stripe has been removed from runtime flow.

Active payment provider IDs in Medusa:

- `pp_mtn-mobile-money_mtn`
- `pp_airtel-money_airtel`

### SMS

SMS provider is UG-SMS v2.

Backend variables:

- `UGSMS_BASE_URL` (default: `https://ugsms.com`)
- `UGSMS_API_KEY`
- `UGSMS_SENDER_ID`
- `UGSMS_MESSAGE_TYPE` (`transactional` or `promotional`)

## Environment Variables

## Backend (`downtown/.env`)

Required:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `COOKIE_SECRET`
- `STORE_CORS`
- `ADMIN_CORS`
- `AUTH_CORS`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` (used by storefront calls)
- `UGSMS_API_KEY`

Mobile money collection:

- `MTN_MOMO_COLLECTION_URL`
- `MTN_MOMO_API_KEY`
- `MTN_MOMO_AUTH_TOKEN`
- `AIRTEL_MONEY_COLLECTION_URL`
- `AIRTEL_MONEY_API_KEY`
- `AIRTEL_MONEY_AUTH_TOKEN`
- `MOBILE_MONEY_CALLBACK_URL`
- `MOBILE_MONEY_TIMEOUT_MS`

Mobile money refunds:

- `MOBILE_MONEY_REFUND_BASE_URL`
- `MOBILE_MONEY_REFUND_API_KEY`

Optional but common:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_ENDPOINT`
- `S3_BUCKET_NAME`
- `S3_PUBLIC_URL`
- `MEILISEARCH_HOST`
- `MEILISEARCH_API_KEY`

## Storefront (`downtown-storefront/.env.local`)

Required:

- `MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_DEFAULT_REGION` (use `ug`)

Optional:

- `REVALIDATE_SECRET`

## Local Development

## 1. Backend

```bash
cd downtown
npm install
npm run dev
```

Backend runs on `http://localhost:9000`.

## 2. Storefront

```bash
cd downtown-storefront
npm install
npm run dev
```

Storefront runs on `http://localhost:8000`.

## 3. Seed / region provider setup

Seed project data:

```bash
cd downtown
npx medusa exec ./src/scripts/seed-campus-downtown.ts
```

If region providers need correction:

```bash
cd downtown
npx medusa exec ./src/scripts/update-region-payment-providers.ts
npx medusa exec ./src/scripts/check-region-payment-providers.ts
```

## Docker Deployment (General)

From repo root:

```bash
docker compose build
docker compose up -d
```

Exposed services:

- Storefront: `:8000`
- Backend: `:9000`

The backend container runs migrations on startup.

## Coolify Deployment (Recommended for you)

Use this repo as a **Docker Compose** deployment.

## 1. Create resource

- In Coolify, create a new resource using your Git repo
- Deployment type: **Docker Compose**
- Compose path: `docker-compose.yml` (repo root)

## 2. Configure domains

- Attach your storefront domain to service `storefront`
- Attach your API/admin domain to service `backend`

## 3. Configure environment variables in Coolify

Set all variables used by root compose, especially:

- Security: `JWT_SECRET`, `COOKIE_SECRET`
- CORS: `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`
- Medusa publishable key for storefront
- All UG-SMS vars
- All mobile money vars
- Postgres/Redis vars

Use public URLs for:

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `MEDUSA_BACKEND_URL`

## 4. Deploy

- Trigger deploy
- Verify health: `https://<api-domain>/health`
- Verify checkout shows MTN + Airtel
- Verify SMS send path in logs

## Operations Checklist

Before production release:

- Confirm Uganda region uses only mobile money providers
- Confirm CORS is restricted to production domains
- Confirm secrets are only stored in Coolify (not committed)
- Confirm DB backups are configured
- Confirm Redis persistence is enabled

After deployment:

- Place a test order with MTN
- Place a test order with Airtel
- Verify prompt trigger behavior
- Verify order notifications (email + SMS)

## Troubleshooting

### Checkout shows wrong providers

Run:

```bash
cd downtown
npx medusa exec ./src/scripts/list-payment-providers.ts
npx medusa exec ./src/scripts/check-region-payment-providers.ts
```

### Region update fails with provider not found

Use provider IDs returned by `list-payment-providers.ts` and update script/constants accordingly.

### Storefront build fails during static generation

If backend is unavailable, Next static data fetch can fail. Ensure backend URL is reachable during build or use deployment runtime where backend is online.

## Security Note

Rotate exposed credentials immediately if any real keys were committed previously, especially payment, SMS, storage, and email provider keys.
