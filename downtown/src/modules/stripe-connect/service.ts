import { MedusaService } from "@medusajs/framework/utils";
import StripeAccount from "./models/stripe-account";
import StripeProduct from "./models/stripe-product";

/**
 * Stripe Connect Service
 *
 * This service provides business logic for the Stripe Connect integration.
 * It handles CRUD operations for Stripe accounts and products.
 */
class StripeConnectService extends MedusaService({
  StripeAccount,
  StripeProduct,
}) {
  /**
   * Find a Stripe account by vendor ID
   *
   * @param vendorId - The vendor ID to search for
   * @returns The Stripe account or null if not found
   */
  async findAccountByVendor(vendorId: string) {
    const accounts = await this.listStripeAccounts({
      vendor_id: vendorId,
    }, {
      take: 1,
    });

    return accounts.length > 0 ? accounts[0] : null;
  }

  /**
   * Find a Stripe account by Stripe account ID
   *
   * @param stripeAccountId - The Stripe account ID to search for
   * @returns The Stripe account or null if not found
   */
  async findAccountByStripeId(stripeAccountId: string) {
    const accounts = await this.listStripeAccounts({
      stripe_account_id: stripeAccountId,
    }, {
      take: 1,
    });

    return accounts.length > 0 ? accounts[0] : null;
  }

  /**
   * List all products for a vendor
   *
   * @param vendorId - The vendor ID to filter by
   * @param filters - Additional filters (active status)
   * @returns Array of products
   */
  async listProductsByVendor(
    vendorId: string,
    filters: { active?: boolean } = {}
  ) {
    const where: any = { vendor_id: vendorId };

    if (filters.active !== undefined) {
      where.active = filters.active;
    }

    return this.listStripeProducts(where);
  }

  /**
   * List all active products with their vendor's Stripe account
   *
   * @returns Array of products with account info
   */
  async listAllActiveProducts() {
    return this.listStripeProducts({
      active: true,
    });
  }
}

export default StripeConnectService;
