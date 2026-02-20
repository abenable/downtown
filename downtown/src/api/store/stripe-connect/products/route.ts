import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { STRIPE_CONNECT_MODULE } from "../../../../modules/stripe-connect";
import StripeConnectService from "../../../../modules/stripe-connect/service";

/**
 * GET /store/stripe-connect/products
 *
 * Lists all active products from all vendors.
 *
 * This endpoint is public and can be accessed by anyone browsing the store.
 * It returns products with their Stripe information for checkout.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Step 1: Get the Stripe Connect service from the container
  const stripeConnectService: StripeConnectService = req.scope.resolve(
    STRIPE_CONNECT_MODULE
  );

  try {
    // Step 2: Fetch all active products
    const products = await stripeConnectService.listAllActiveProducts();

    // Step 3: Return the products
    // Note: In a real implementation, you might want to transform the data
    // to exclude internal fields like stripe_price_id from the public API
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
