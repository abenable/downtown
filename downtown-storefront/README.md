# Campus Downtown Storefront

This is the Next.js storefront for Campus Downtown.

## Storefront responsibilities

- home, collection, category, product, cart, and checkout flows
- customer account and order views
- vendor registration, vendor dashboard, and vendor settings
- mobile money payment selection and phone capture
- wishlist and review UI

## Tech stack

- Next.js App Router
- Tailwind CSS
- Medusa Store SDK
- server actions for cart, vendor, and customer flows

## Payment UX

The storefront is configured for Campus Downtown mobile money checkout through iOTEC Pay.

Current payment provider mapping:

- `pp_iotec-pay_iotec`

Expected checkout behavior:

- customer selects mobile money
- customer chooses MTN or Airtel
- customer enters a Uganda mobile number
- `Place order` triggers the payment prompt

Important constraint:

- keep all customer-facing phone capture Uganda-first using `2567XXXXXXXX`

## Vendor UX

Current vendor-facing surfaces include:

- `/vendor/register`
- `/vendor/dashboard`
- `/vendor/dashboard/settings`
- vendor product and order management screens

The settings page now supports:

- vendor store identity updates
- vendor admin phone updates
- payout phone and network configuration

## Development

```bash
npm install
npm run dev
```

Default local URL:

- `http://localhost:8000`

The backend must be available during real data-driven flows, typically at `http://localhost:9000`.

## Build

```bash
npm run build
```

Note: build-time page data collection can fail if the Medusa backend is unavailable.

## Implementation guardrails

- do not add Stripe checkout UI unless explicitly requested
- keep payment provider IDs aligned with backend config and seed data
- preserve Uganda-first payment language and phone validation
- prefer improving existing storefront patterns instead of introducing disconnected payment UX
