import { defineLink } from "@medusajs/framework/utils";
import WishlistModule from "../modules/wishlist";
import ProductModule from "@medusajs/medusa/product";

export default defineLink(WishlistModule.linkable.wishlistItem, {
  linkable: ProductModule.linkable.productVariant.id,
});
