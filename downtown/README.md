# Campus Downtown Backend

This is the Medusa v2 backend for Campus Downtown, a Kampala-focused university marketplace.

## Backend responsibilities

- marketplace vendor model and vendor admin relationships
- vendor registration and vendor self-service APIs
- iOTEC mobile money payment provider
- payout, refund, support, wishlist, review, and pickup-location modules
- email and SMS notifications
- vendor product and vendor order APIs

## Key modules

- `src/modules/marketplace`
- `src/modules/payout`
- `src/modules/refund`
- `src/modules/support`
- `src/modules/pickup-location`
- `src/modules/product-review`
- `src/modules/iotec-pay`
- `src/modules/email-notification`
- `src/modules/sms-notification`

## Payment implementation

Configured in `medusa-config.ts`.

Active provider:

- `pp_iotec-pay_iotec`

iOTEC implementation:

- token flow against `https://id.iotec.io/connect/token`
- collections initiation for mobile money
- provider status mapping and external ID reconciliation

Important constraint:

- Uganda mobile numbers must remain normalized to `2567XXXXXXXX`.

## Vendor APIs

- `POST /vendors` creates a vendor profile from an authenticated customer.
- `GET /vendors/me` returns current vendor info.
- `PUT /vendors/me` updates vendor identity and vendor admin phone details.
- `GET /vendors/payment-settings` returns payout settings.
- `POST /vendors/payment-settings` updates payout phone and network.

## Development

```bash
npm install
npm run dev
```

Backend default local URL:

- `http://localhost:9000`

## Build

```bash
npm run build
```

## Scripts

Useful scripts live under `src/scripts`, including:

- payment provider listing and verification
- region payment provider correction
- seed scripts for Campus Downtown setup
- shipping and pickup location support scripts

## Current integration notes

- Stripe is not active in runtime.
- UG-SMS v2 is the SMS provider.
- Some payout/refund compatibility fields still use legacy `africatalking_*` names and should be treated as migration-sensitive.

## Implementation guardrails

- keep phone-number handling Uganda-first
- keep provider IDs aligned with the storefront
- prefer module/workflow changes over route-only business logic
- if renaming compatibility fields, include safe migrations and API updates in the same change
