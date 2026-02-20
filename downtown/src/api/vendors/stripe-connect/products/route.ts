import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { STRIPE_CONNECT_MODULE } from "../../../../modules/stripe-connect";
import StripeConnectService from "../../../../modules/stripe-connect/service";
import Stripe from "stripe";

/**
 * POST /vendors/stripe-connect/products
 *
 * Creates a new product on the Stripe platform.
 *
 * This endpoint creates a product on the Stripe platform level (not on the
 * connected account). The product is associated with the vendor and stores
 * the vendor's Stripe account ID for payment routing.
 *
 * Required environment variables:
 * - STRIPE_API_KEY: Your Stripe secret key (sk_test_... or sk_live_...)
 *
 * Request body:
 * - name: Product name (required)
 * - description: Product description (optional)
 * - price_in_cents: Price in cents (required, e.g., 1000 for $10.00)
 * - currency: Currency code (optional, defaults to 'usd')
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

  // Step 5: Validate request body
  const body = req.body as {
    name?: string;
    description?: string;
    price_in_cents?: number;
    currency?: string;
  };
  const { name, description, price_in_cents, currency = "usd" } = body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({
      message: "Product name is required",
      error: "MISSING_PRODUCT_NAME",
    });
  }

  if (!price_in_cents || typeof price_in_cents !== "number" || price_in_cents <= 0) {
    return res.status(400).json({
      message: "Valid price_in_cents is required (must be a positive number)",
      error: "INVALID_PRICE",
    });
  }

  try {
    // Step 6: Find the vendor's Stripe account
    const stripeAccount = await stripeConnectService.findAccountByVendor(vendorId);

    if (!stripeAccount) {
      return res.status(404).json({
        message: "No Stripe Connect account found. Please create one first.",
        error: "MISSING_STRIPE_ACCOUNT",
      });
    }

    // Step 7: Verify the account is ready to receive payments
    // Fetch the account status from Stripe API
    const account = await stripeClient.accounts.retrieve(
      stripeAccount.stripe_account_id
    );

    const readyToReceivePayments =
      account?.capabilities?.transfers === "active";

    if (!readyToReceivePayments) {
      return res.status(400).json({
        message: "Your Stripe account is not ready to receive payments. Please complete onboarding first.",
        error: "ACCOUNT_NOT_READY",
      });
    }

    // Step 8: Create the product on Stripe platform
    // Note: Products are created on the platform level, not on the connected account
    const stripeProduct = await stripeClient.products.create({
      name: name,
      description: description,
      default_price_data: {
        unit_amount: price_in_cents,
        currency: currency.toLowerCase(),
      },
      // Store the vendor ID and account ID in metadata for reference
      metadata: {
        vendor_id: vendorId,
        stripe_account_id: stripeAccount.stripe_account_id,
      },
    });

    // Step 9: Store the product in the database
    const product = await stripeConnectService.createStripeProducts({
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripeProduct.default_price as string,
      name: name,
      description: description,
      price_in_cents: price_in_cents,
      currency: currency.toLowerCase(),
      vendor_id: vendorId,
      stripe_account_id: stripeAccount.stripe_account_id,
      active: true,
    });

    // Step 10: Return the created product
    return res.status(201).json({
      message: "Product created successfully",
      product: product,
      stripe_product: {
        id: stripeProduct.id,
        name: stripeProduct.name,
        default_price: stripeProduct.default_price,
      },
    });

  } catch (error: any) {
    console.error("[Stripe Connect] Error creating product:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      return res.status(400).json({
        message: "Invalid request to Stripe",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
};

/**
 * GET /vendors/stripe-connect/products
 *
 * Lists all products for the authenticated vendor.
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

  // Step 2: Get the Stripe Connect service from the container
  const stripeConnectService: StripeConnectService = req.scope.resolve(
    STRIPE_CONNECT_MODULE
  );

  try {
    // Step 3: Fetch all products for this vendor
    const products = await stripeConnectService.listProductsByVendor(vendorId);

    // Step 4: Return the products
    return res.status(200).json({
      products: products,
      count: products.length,
    });

  } catch (error: any) {
    console.error("[Stripe Connect] Error fetching products:", error);
    return res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};
