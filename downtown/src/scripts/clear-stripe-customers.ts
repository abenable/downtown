/**
 * Script to clear stale Stripe customer IDs from Medusa customers
 * 
 * This resolves the "No such customer" error when the Stripe customer
 * was created with a different API key or account and no longer exists.
 */

export default async function clearStripeCustomers(container: any) {
  const logger = container.resolve("logger");
  
  logger.info("Starting to clear stale Stripe customer IDs...");

  try {
    // Get the query tool to execute raw SQL
    const query = container.resolve("query");
    
    // Find all customers with a stripe_id in their metadata
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "metadata"],
      filters: {
        metadata: {
          stripe_id: { $ne: null }
        }
      }
    });

    logger.info(`Found ${customers?.length || 0} customers with Stripe IDs`);

    // Get the customer service
    const customerService = container.resolve("customer");
    
    let clearedCount = 0;

    for (const customer of customers || []) {
      if (customer.metadata?.stripe_id) {
        logger.info(`Clearing stripe_id for customer: ${customer.id}`);
        
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

    logger.info(`Successfully cleared Stripe customer IDs for ${clearedCount} customers`);
    logger.info("Next time a customer checks out, a new Stripe customer will be created automatically.");
    
  } catch (error) {
    logger.error("Error clearing Stripe customer IDs:", error);
    throw error;
  }
}
