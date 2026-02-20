import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { STRIPE_CONNECT_MODULE } from "../../../../modules/stripe-connect";
import StripeConnectService from "../../../../modules/stripe-connect/service";
import Stripe from "stripe";

/**
 * POST /vendors/stripe-connect/onboarding
 *
 * Creates an onboarding link for the vendor to complete their Stripe account setup.
 *
 * This endpoint uses the Stripe V2 API to create an account link for onboarding.
 * The vendor will be redirected to Stripe to complete their account verification.
 *
 * Required environment variables:
 * - STRIPE_API_KEY: Your Stripe secret key (sk_test_... or sk_live_...)
 *
 * The return_url should be your frontend URL where the vendor will be redirected
 * after completing (or canceling) the onboarding.
 *
 * The refresh_url should be your frontend URL where the vendor will be redirected
 * if the link expires or they need to retry.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  // Step 1: Check authentication
  if (!req.auth_context?.actor_id || req.auth_context?.actor_type !== "vendor") {
    return res.status(401).json({
      message: "Authentication required. Please log in as a vendor.",
    });
  }

  const vendorId = req.auth_context.actor_id;

  // Step 2: Validate STRIPE_API_KEY environment variable
  const stripeApiKey = process.env.STRIPE_API_KEY;
  if (!stripeApiKey) {
    console.error("[Stripe Connect] Error: STRIPE_API_KEY environment variable is not set");
    return res.status(500).json({
      message: "Stripe API key is not configured. Please set STRIPE_API_KEY environment variable.",
      error: "MISSING_STRIPE_API_KEY",
    });
  }

  // Step 3: Initialize Stripe client
  const stripeClient = new Stripe(stripeApiKey);

  // Step 4: Get the Stripe Connect service from the container
  const stripeConnectService: StripeConnectService = req.scope.resolve(
    STRIPE_CONNECT_MODULE
  );

  try {
    // Step 5: Find the vendor's Stripe account in the database
    const stripeAccount = await stripeConnectService.findAccountByVendor(vendorId);

    if (!stripeAccount) {
      return res.status(404).json({
        message: "No Stripe Connect account found. Please create one first.",
        has_account: false,
      });
    }

    // Step 6: Get return and refresh URLs
    // In production, these should be your actual frontend URLs
    // For this demo, we construct URLs based on the request
    const baseUrl = process.env.STORE_CORS?.split(',')[1] || "http://localhost:8000";

    // URL where the vendor will be redirected after completing onboarding
    const returnUrl = `${baseUrl}/vendor/dashboard/stripe?accountId=${stripeAccount.stripe_account_id}`;

    // URL where the vendor will be redirected if the link expires or they need to retry
    const refreshUrl = `${baseUrl}/vendor/dashboard/stripe/onboarding?retry=true`;

    // Step 7: Create the account link using standard API
    const accountLink = await stripeClient.accountLinks.create({
      // The Stripe account ID to create the link for
      account: stripeAccount.stripe_account_id,
      // URL to redirect to after onboarding (success or cancel)
      return_url: returnUrl,
      // URL to redirect to if the link expires or the vendor needs to retry
      refresh_url: refreshUrl,
      // Type of account link
      type: "account_onboarding",
    });

    // Step 8: Return the account link URL
    return res.status(200).json({
      message: "Onboarding link created successfully",
      url: accountLink.url,
      expires_at: accountLink.expires_at,
    });

  } catch (error: any) {
    console.error("[Stripe Connect] Error creating onboarding link:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      return res.status(400).json({
        message: "Invalid request to Stripe",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create onboarding link",
      error: error.message,
    });
  }
};
