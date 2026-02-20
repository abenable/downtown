import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { STRIPE_CONNECT_MODULE } from "../../../../modules/stripe-connect";
import StripeConnectService from "../../../../modules/stripe-connect/service";
import Stripe from "stripe";

/**
 * POST /vendors/stripe-connect/account
 *
 * Creates a new Stripe Connect account for the authenticated vendor.
 *
 * This endpoint uses the Stripe V2 API to create an Express account
 * where the platform is responsible for pricing and fee collection.
 *
 * Required environment variables:
 * - STRIPE_API_KEY: Your Stripe secret key (sk_test_... or sk_live_...)
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
  // The Stripe SDK automatically uses the latest API version
  const stripeClient = new Stripe(stripeApiKey);

  // Step 4: Get the Stripe Connect service from the container
  const stripeConnectService: StripeConnectService = req.scope.resolve(
    STRIPE_CONNECT_MODULE
  );

  try {
    // Step 5: Check if vendor already has a Stripe account
    const existingAccount = await stripeConnectService.findAccountByVendor(vendorId);
    if (existingAccount) {
      return res.status(400).json({
        message: "You already have a Stripe Connect account",
        account: existingAccount,
      });
    }

    // Step 6: Create the Stripe Connect account using V2 API
    // Note: This creates an Express account where the platform is responsible
    // for pricing and fee collection (fees_collector: 'application')
    // Step 6: Create the Stripe Connect account using standard API
    // Note: This creates an Express account where the platform is responsible
    // for pricing and fee collection
    const account = await stripeClient.accounts.create({
      type: "express",
      country: "US",
      capabilities: {
        transfers: { requested: true },
      },
      business_profile: {
        name: "New Vendor Account",
      },
    });

    // Step 7: Store the account mapping in the database
    const stripeAccount = await stripeConnectService.createStripeAccounts({
      vendor_id: vendorId,
      stripe_account_id: account.id,
      country: "us", // Store the country for reference
      dashboard_type: "express",
      // Note: onboarding_complete and ready_to_receive_payments are always
      // fetched from the Stripe API in real-time for this demo
    });

    // Step 8: Return the created account
    return res.status(201).json({
      message: "Stripe Connect account created successfully",
      account: stripeAccount,
      stripe_account_id: account.id,
    });

  } catch (error: any) {
    console.error("[Stripe Connect] Error creating account:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      return res.status(400).json({
        message: "Invalid request to Stripe",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create Stripe Connect account",
      error: error.message,
    });
  }
};

/**
 * GET /vendors/stripe-connect/account
 *
 * Retrieves the current account status from Stripe.
 * This always fetches fresh data from the Stripe API.
 */
export const GET = async (
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

    // Step 6: Fetch the account status from Stripe API
    // We always fetch fresh data from Stripe for this demo
    const account = await stripeClient.accounts.retrieve(
      stripeAccount.stripe_account_id
    );

    // Step 7: Check if the account is ready to receive payments
    // The transfers capability must be active
    const readyToReceivePayments =
      account?.capabilities?.transfers === "active";

    // Step 8: Check onboarding status
    // If there are no pending requirements, onboarding is complete
    const hasPendingRequirements =
      (account.requirements?.currently_due?.length ?? 0) > 0 ||
      (account.requirements?.past_due?.length ?? 0) > 0;
    const onboardingComplete = !hasPendingRequirements;

    // Step 9: Return the account status
    return res.status(200).json({
      has_account: true,
      stripe_account_id: stripeAccount.stripe_account_id,
      onboarding_complete: onboardingComplete,
      ready_to_receive_payments: readyToReceivePayments,
      requirements_status: hasPendingRequirements ? "pending" : "complete",
      account_details: {
        display_name: account.business_profile?.name,
        email: account.email,
        country: account.country,
      },
    });

  } catch (error: any) {
    console.error("[Stripe Connect] Error fetching account:", error);
    return res.status(500).json({
      message: "Failed to fetch Stripe Connect account",
      error: error.message,
    });
  }
};
