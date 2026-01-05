import { defineLink } from "@medusajs/framework/utils";
import WishlistModule from "..";
import CustomerModule from "@medusajs/medusa/customer";

export default defineLink(
  {
    linkable: WishlistModule.linkable.wishlist.id,
    field: "customer_id",
  },
  CustomerModule.linkable.customer.id,
  {
    readOnly: true,
  }
);
