# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Downtown is a multi-vendor marketplace built on Medusa v2. Before refactoring or adding features, consult the [Medusa How-To Tutorials](https://docs.medusajs.com/resources/how-to-tutorials).

## Repository Structure

```
downtown/           # Medusa v2 backend (port 9000)
downtown-storefront/ # Next.js 15 frontend (port 8000)
```

## Commands

### Backend (downtown/)
```bash
npm run dev                    # Start development server
npm run build                  # Production build
npm run seed                   # Seed database
npx medusa db:migrate          # Run database migrations (required after link/model changes)
npm run test:integration:http  # Integration tests
```

### Storefront (downtown-storefront/)
```bash
npm run dev    # Next.js dev on port 8000 (uses Turbopack)
npm run build  # Production build
npm run lint   # Run ESLint
```

## Architecture

### Custom Modules (downtown/src/modules/)

| Module               | Purpose                         | Key Models                 |
|----------------------|---------------------------------|----------------------------|
| `marketplace`        | Multi-vendor core               | `Vendor`, `VendorAdmin`    |
| `payout`             | Vendor payouts                  | `Payout`                   |
| `product-review`     | Product reviews system          | `Review`                   |
| `wishlist`           | Customer wishlist               | `Wishlist`, `WishlistItem` |
| `platform-tax`       | Platform fee tax provider (10%) | -                          |
| `email-notification` | Email notification provider     | -                          |
| `downtown-fulfillment` | Custom fulfillment provider   | -                          |
| `support`            | Vendor support tickets          | -                          |

**Module pattern:**
```typescript
export const MARKETPLACE_MODULE = "marketplace";
// Resolve in workflows/routes:
const service = container.resolve(MARKETPLACE_MODULE);
```

### Data Links (downtown/src/links/)

Custom modules link to Medusa core using `defineLink`. Use `.id` suffix on linkable references:

```typescript
// Correct pattern from Medusa marketplace recipe
export default defineLink(MarketplaceModule.linkable.vendor, {
  linkable: ProductModule.linkable.product.id, // Note: .id suffix
  isList: true, // One vendor has many products
});
```

After defining/modifying links: `npx medusa db:migrate`

### API Routes (downtown/src/api/)

- `/vendors/*` - Vendor-facing API (customer auth)
- `/admin/vendors/*` - Admin management (admin auth)
- `/store/*` - Storefront API

**Vendor Authentication:** Vendors authenticate as customers with vendor status checked via helper:
```typescript
// src/api/vendors/helpers.ts
const { vendorId, isApproved } = await getVendorFromAuth(req);
```

Middleware uses `authenticate(["customer", "vendor"], ["session", "bearer"])`. Validation via Zod schemas in `validators.ts`.

### Workflows (downtown/src/workflows/)

Follow Medusa workflow pattern with compensation (rollback):
```typescript
export const createVendorStep = createStep(
  "create-vendor-step",
  async (input, { container }) => { /* create */ },
  async (vendorId, { container }) => { /* rollback on failure */ }
);
```

### Subscribers (downtown/src/subscribers/)

Event-driven notifications:
- `order.placed` → Order confirmation to customer
- `order.completed` → Order fulfillment notification
- `vendor.approved` / `vendor.rejected` → Vendor status notifications

### Admin UI (downtown/src/admin/)

Widgets extend Medusa admin dashboard using `@medusajs/ui` and `defineWidgetConfig`.

### Storefront (downtown-storefront/)

- Next.js 15 with Turbopack, React 19
- Vendor data fetching: `src/lib/data/vendor.ts`
- Uses `@medusajs/js-sdk` for Medusa API calls
- Styling with Tailwind CSS

## Key Conventions

1. **Vendor Status Flow**: `pending` → `approved` | `rejected`
2. **Platform Fee**: 10% via custom tax provider
3. **File Storage**: Cloudflare R2 (S3-compatible) via `@medusajs/file-s3`
4. **Payments**: Stripe via `@medusajs/payment-stripe`
5. **Testing**: Use `medusaIntegrationTestRunner` from `@medusajs/test-utils`
6. **File Uploads**: Multer with 5MB limit

## CI/CD

GitHub Actions workflow (`.github/workflows/release.yml`) builds and deploys on release:

1. **Triggers**: Release published or manual workflow dispatch
2. **Builds**: Docker images for backend and storefront in parallel
3. **Pushes**: Images to GitHub Container Registry (`ghcr.io`)
4. **Deploys**: Triggers Coolify webhooks

**Required GitHub Secrets:**
- `COOLIFY_BACKEND_WEBHOOK_URL` - Coolify webhook for backend deployment
- `COOLIFY_STOREFRONT_WEBHOOK_URL` - Coolify webhook for storefront deployment
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` - Backend URL for storefront build
- `NEXT_PUBLIC_BASE_URL` - Storefront base URL
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` - Medusa publishable key
- `NEXT_PUBLIC_DEFAULT_REGION` - Default region code
- `NEXT_PUBLIC_STRIPE_KEY` - Stripe publishable key

**Images:**
- Backend: `ghcr.io/abenable/downtown-backend`
- Storefront: `ghcr.io/abenable/downtown-storefront`

## Environment Variables

Backend requires: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, S3/R2 credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_BUCKET_NAME`, `S3_PUBLIC_URL`)
