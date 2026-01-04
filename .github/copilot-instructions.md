# Downtown Marketplace - AI Coding Instructions

> **⚠️ MANDATORY**: Before refactoring or adding new features, consult the [Medusa How-To Tutorials](https://docs.medusajs.com/resources/how-to-tutorials). This is required.

A multi-vendor marketplace built on Medusa v2 with Next.js storefront.

## Architecture Overview

```
downtown/           # Medusa v2 backend (port 9000)
downtown-storefront/ # Next.js 15 frontend (port 8000)
```

### Custom Modules (`src/modules/`)

| Module               | Purpose                         | Key Models                 |
| -------------------- | ------------------------------- | -------------------------- |
| `marketplace`        | Multi-vendor core               | `Vendor`, `VendorAdmin`    |
| `platform-tax`       | Platform fee tax provider (10%) | -                          |
| `payout`             | Vendor payouts                  | `Payout`                   |
| `support`            | Vendor support tickets          | -                          |
| `product-review`     | Product reviews system          | `Review`                   |
| `email-notification` | Email notification provider     | -                          |
| `wishlist`           | Customer wishlist feature       | `Wishlist`, `WishlistItem` |

### Module Pattern

```typescript
// Export constant for dependency injection
export const MARKETPLACE_MODULE = "marketplace";
// Resolve in workflows/routes:
const service = container.resolve(MARKETPLACE_MODULE);
```

### Data Links (`src/links/`)

Custom modules link to Medusa core using `defineLink`. Use `.id` suffix on linkable references:

```typescript
// src/links/vendor-product.ts - Correct pattern from Medusa marketplace recipe
export default defineLink(MarketplaceModule.linkable.vendor, {
  linkable: ProductModule.linkable.product.id, // Note: .id suffix
  isList: true, // One vendor has many products
});
```

After defining/modifying links, run: `npx medusa db:migrate`

## API Routes (`src/api/`)

### Route Structure

- `/vendors/*` - Vendor-facing API (customer auth)
- `/admin/vendors/*` - Admin management (admin auth)
- `/store/*` - Storefront API

### Authentication Pattern

Vendors authenticate as **customers** with vendor status checked via `getVendorFromAuth()` helper:

```typescript
// src/api/vendors/helpers.ts
const { vendorId, isApproved } = await getVendorFromAuth(req);
```

### Middleware Configuration (`src/api/middlewares.ts`)

- Uses `authenticate(["customer", "vendor"], ["session", "bearer"])`
- Validation via Zod schemas in `validators.ts`
- File uploads use `multer` with 5MB limit

## Workflows (`src/workflows/`)

Follow Medusa workflow pattern with compensation (rollback):

```typescript
// Step with compensation
export const createVendorStep = createStep(
  "create-vendor-step",
  async (input, { container }) => {
    /* create */
  },
  async (vendorId, { container }) => {
    /* rollback on failure */
  }
);
```

## Admin UI (`src/admin/`)

- Widgets extend Medusa admin dashboard
- `vendor-applications.tsx` - Approve/reject vendor applications
- Uses `@medusajs/ui` components and `defineWidgetConfig`

## Storefront (`downtown-storefront/`)

- Next.js 15 with Turbopack, React 19
- Vendor data fetching in `src/lib/data/vendor.ts`
- Uses `@medusajs/js-sdk` for Medusa API calls

## Commands

```bash
# Backend (downtown/)
npm run dev          # Start development server
npm run build        # Production build
npm run seed         # Seed database
npm run test:integration:http  # Integration tests

# Storefront (downtown-storefront/)
npm run dev          # Next.js dev on port 8000
```

## Environment Variables

Backend requires: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STRIPE_API_KEY`, S3/R2 credentials

## Key Conventions

1. **Vendor Status Flow**: `pending` → `approved`/`rejected`
2. **Platform Fee**: 10% fee via custom tax provider (`platform-tax` module)
3. **File Storage**: Cloudflare R2 (S3-compatible) via `@medusajs/file-s3`
4. **Payments**: Stripe integration via `@medusajs/payment-stripe`
5. **Notifications**: Email notifications via custom provider (`email-notification` module)
6. **Testing**: Use `medusaIntegrationTestRunner` from `@medusajs/test-utils`

## Subscribers (`src/subscribers/`)

Event-driven notifications:

| Event             | Subscriber           | Description                    |
| ----------------- | -------------------- | ------------------------------ |
| `order.placed`    | `order-placed.ts`    | Order confirmation to customer |
| `order.completed` | `order-completed.ts` | Order fulfillment notification |
| `vendor.approved` | `vendor-approved.ts` | Vendor approval notification   |
| `vendor.rejected` | `vendor-rejected.ts` | Vendor rejection notification  |
