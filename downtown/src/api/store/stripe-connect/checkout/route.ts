import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { STRIPE_CONNECT_MODULE } from "../../../../modules/stripe-connect";
import StripeConnectService from "../../../../modules/stripe-connect/service";
import Stripe from "stripe";

/**
 * POST /store/stripe-connect/checkout
 *
 * Creates a Stripe Checkout session for purchasing a product.
 *
 * This endpoint creates a destination charge where:
 * - The customer's payment goes to the platform account
 * - The funds are automatically transferred to the vendor's connected account
 * - The platform keeps an application fee
 *
 * Request body:
 * - product_id: The Stripe product ID to purchase (required)
 * - quantity: Number of items (optional, defaults to 1)
 * - success_url: URL to redirect after successful payment (required)
 * - cancel_url: URL to redirect if payment is canceled (required)
 *
 * Required environment variables:
 * - STRIPE_API_KEY: Your Stripe secret key
 * - STRIPE_CONNECT_APPLICATION_FEE_PERCENT: Platform fee percentage (e.g., "10" for 10%)
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // Step 1: Validate STRIPE_API_KEY environment variable
  const stripeApiKey = process.env.STRIPE_API_KEY;
  if (!stripeApiKey) {
    console.error("[Stripe Connect] Error: STRIPE_API_KEY environment variable is not set");
    return res.status(500).json({
      message: "Stripe API key is not configured. Please set STRIPE_API_KEY environment variable.",
      error: "MISSING_STRIPE_API_KEY",
    });
  }

  // Step 2: Validate application fee configuration
  const feePercent = parseFloat(process.env.STRIPE_CONNECT_APPLICATION_FEE_PERCENT || "10");
  if (isNaN(feePercent) || feePercent < 1 || feePercent > 100) {
    console.error("[Stripe Connect] Error: Invalid STRIPE_CONNECT_APPLICATION_FEE_PERCENT");
    return res.status(500).json({
      message: "Invalid platform fee configuration",
      error: "INVALID_FEE_CONFIGURATION",
    });
  }

  // Step 3: Initialize Stripe client
  const stripeClient = new Stripe(stripeApiKey);

  // Step 4: Get the Stripe Connect service from the container
  const stripeConnectService: StripeConnectService = req.scope.resolve(
    STRIPE_CONNECT_MODULE
  );

  // Step 5: Validate request body
  const body = req.body as {
    product_id?: string;
    quantity?: number;
    success_url?: string;
    cancel_url?: string;
  };
  const {
    product_id,
    quantity = 1,
    success_url,
    cancel_url,
  } = body;

  if (!product_id || typeof product_id !== "string") {
    return res.status(400).json({
      message: "Product ID is required",
      error: "MISSING_PRODUCT_ID",
    });
  }

  if (!success_url || typeof success_url !== "string") {
    return res.status(400).json({
      message: "Success URL is required",
      error: "MISSING_SUCCESS_URL",
    });
  }

  if (!cancel_url || typeof cancel_url !== "string") {
    return res.status(400).json({
      message: "Cancel URL is required",
      error: "MISSING_CANCEL_URL",
    });
  }

  if (typeof quantity !== "number" || quantity < 1) {
    return res.status(400).json({
      message: "Quantity must be a positive number",
      error: "INVALID_QUANTITY",
    });
  }

  try {
    // Step 6: Find the product in the database
    const products = await stripeConnectService.listStripeProducts({
      stripe_product_id: product_id,
      active: true,
    }, {
      take: 1,
    });

    if (products.length === 0) {
      return res.status(404).json({
        message: "Product not found",
        error: "PRODUCT_NOT_FOUND",
      });
    }

    const product = products[0];

    // Step 7: Verify the connected account is ready to receive payments
    // Fetch the account status from Stripe API
    const account = await stripeClient.accounts.retrieve(
      product.stripe_account_id
    );

    const readyToReceivePayments =
      account?.capabilities?.transfers === "active";

    if (!readyToReceivePayments) {
      return res.status(400).json({
        message: "This vendor is not ready to receive payments",
        error: "VENDOR_NOT_READY",
      });
    }

    // Step 8: Calculate application fee
    // Application fee is calculated as a percentage of the total amount
    const totalAmount = product.price_in_cents * quantity;
    const applicationFeeAmount = Math.round(totalAmount * (feePercent / 100));

    // Step 9: Create the Stripe Checkout session
    // This uses a destination charge model:
    // - Customer pays to the platform
    // - Platform keeps the application fee
    // - Remaining funds are transferred to the connected account
    const session = await stripeClient.checkout.sessions.create({
      // Line items for the checkout
      line_items: [
        {
          // Price data for the product
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description || undefined,
            },
            unit_amount: product.price_in_cents,
          },
          quantity: quantity,
        },
      ],

      // Payment intent data for destination charge
      payment_intent_data: {
        // Application fee to collect (platform fee)
        application_fee_amount: applicationFeeAmount,

        // Transfer data for destination charge
        transfer_data: {
          // The connected account to transfer funds to
          destination: product.stripe_account_id,
        },
      },

      // Checkout mode - one-time payment
      mode: "payment",

      // URLs for success and cancel scenarios
      success_url: success_url,
      cancel_url: cancel_url,

      // Store metadata for reference
      metadata: {
        product_id: product.id,
        vendor_id: product.vendor_id,
        stripe_account_id: product.stripe_account_id,
      },
    });

    // Step 10: Return the checkout session URL
    return res.status(200).json({
      message: "Checkout session created",
      session_id: session.id,
      checkout_url: session.url,
      application_fee: {
        amount: applicationFeeAmount,
        currency: product.currency,
        percentage: feePercent,
      },
    });

  } catch (error: any) {
    console.error("[Stripe Connect] Error creating checkout session:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      return res.status(400).json({
        message: "Invalid request to Stripe",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};
