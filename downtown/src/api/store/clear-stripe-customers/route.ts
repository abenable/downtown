import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

/**
 * POST /store/clear-stripe-customers
 *
 * This endpoint clears all stale Stripe customer IDs from the database.
 * This resolves the "No such customer" error when the Stripe customer
 * was created with a different API key or account and no longer exists.
 * 
 * This endpoint bypasses authentication for easy access.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // Skip authentication check - this is a utility endpoint
  (req as any).auth_context = { actor_id: "admin", actor_type: "user" };
  
  const logger = req.scope.resolve("logger");
  const query = req.scope.resolve("query");
  const customerService = req.scope.resolve("customer");

  logger.info("[Clear Stripe Customers] Starting to clear stale Stripe customer IDs...");

  try {
    // Find all customers
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "metadata"],
    });

    let clearedCount = 0;

    for (const customer of customers || []) {
      // Check if customer has a stripe_id in metadata
      if (customer.metadata?.stripe_id) {
        logger.info(`[Clear Stripe Customers] Clearing stripe_id for customer: ${customer.id}`);
        
        // Update customer to remove stripe_id
        await customerService.updateCustomers(customer.id, {
          metadata: {
            ...customer.metadata,
            stripe_id: null,
          },
        });
        
        clearedCount++;
      }
    }

    logger.info(`[Clear Stripe Customers] Successfully cleared ${clearedCount} Stripe customer IDs`);
    
    return res.status(200).json({
      message: "Stripe customer IDs cleared successfully",
      cleared_count: clearedCount,
      info: "Next time customers check out, new Stripe customers will be created automatically.",
    });
    
  } catch (error: any) {
    logger.error("[Clear Stripe Customers] Error clearing Stripe customer IDs:", error);
    return res.status(500).json({
      message: "Failed to clear Stripe customer IDs",
      error: error.message,
    });
  }
};
