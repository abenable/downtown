import { Module } from "@medusajs/framework/utils";
import StripeConnectService from "./service";

/**
 * Stripe Connect Module
 *
 * This module provides Stripe Connect integration for a multi-vendor marketplace.
 * It handles:
 * - Creating connected accounts for vendors
 * - Onboarding flows with account links
 * - Platform product creation
 * - Payment processing with destination charges
 * - Webhook handling for account updates
 *
 * Note: The platform (you) is responsible for pricing and fee collection
 * as specified in the account configuration.
 */

export const STRIPE_CONNECT_MODULE = "stripeConnect";

export default Module(STRIPE_CONNECT_MODULE, {
  service: StripeConnectService,
});
