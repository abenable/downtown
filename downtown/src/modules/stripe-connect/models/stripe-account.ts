import { model } from "@medusajs/framework/utils";

/**
 * Stripe Account Model
 *
 * Stores the mapping between a vendor and their Stripe Connect account.
 * This model links the local vendor entity to the Stripe account ID.
 *
 * NOTE: The actual Stripe account status (onboarding_complete, ready_to_receive_payments)
 * is always fetched from the Stripe API in real-time for this demo, not stored here.
 */
const StripeAccount = model.define("stripe_account", {
  id: model.id().primaryKey(),
  // The vendor ID this account belongs to
  vendor_id: model.text(),

  // The Stripe Account ID (e.g., acct_1234567890)
  stripe_account_id: model.text(),

  // The onboarding status - stored for reference but always checked from Stripe API
  onboarding_complete: model.boolean().default(false),

  // Whether the account is ready to receive payments
  ready_to_receive_payments: model.boolean().default(false),

  // The country code for the account (e.g., 'us', 'gb', etc.)
  country: model.text(),

  // The dashboard type (always 'express' in this implementation)
  dashboard_type: model.text().default("express"),
});

export default StripeAccount;
