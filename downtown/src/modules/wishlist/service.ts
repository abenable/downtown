import {
  MedusaService,
  MedusaContext,
  InjectManager,
} from "@medusajs/framework/utils";
import { Context } from "@medusajs/framework/types";
import { EntityManager } from "@mikro-orm/knex";
import { Wishlist } from "./models/wishlist";
import { WishlistItem } from "./models/wishlist-item";

export default class WishlistModuleService extends MedusaService({
  Wishlist,
  WishlistItem,
}) {
  /**
   * Get the number of wishlists that contain any of the specified variant IDs
   */
  @InjectManager()
  async getWishlistsOfVariants(
    variantIds: string[],
    @MedusaContext() context: Context<EntityManager> = {}
  ): Promise<number> {
    return (
      (
        await context.manager
          ?.createQueryBuilder("wishlist_item", "wi")
          .select(["wi.wishlist_id"], true)
          .where("wi.product_variant_id IN (?)", [variantIds])
          .execute()
      )?.length || 0
    );
  }
}
