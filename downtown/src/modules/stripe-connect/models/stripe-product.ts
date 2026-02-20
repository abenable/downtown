import { model } from "@medusajs/framework/utils";

/**
 * Stripe Product Model
 *
 * Stores products created on the Stripe platform level.
 * These products are owned by the platform but linked to vendors
 * so that payments can be routed to the correct connected account.
 *
 * Note: Products are created on the platform, not on the connected account.
 * The connected account ID is stored to route payments via destination charges.
 */
const StripeProduct = model.define("stripe_product", {
  id: model.id().primaryKey(),
  // Stripe Product ID (e.g., prod_1234567890)
  stripe_product_id: model.text(),

  // Stripe Price ID (e.g., price_1234567890)
  stripe_price_id: model.text(),

  // Product name
  name: model.text(),

  // Product description
  description: model.text().nullable(),

  // Price amount in cents (e.g., $10.00 = 1000)
  price_in_cents: model.bigNumber(),

  // Currency code (e.g., 'usd', 'gbp', 'eur')
  currency: model.text(),

  // The vendor ID this product belongs to
  vendor_id: model.text(),

  // The Stripe account ID for the connected account (for payment routing)
  stripe_account_id: model.text(),

  // Whether the product is active
  active: model.boolean().default(true),
});

export default StripeProduct;
