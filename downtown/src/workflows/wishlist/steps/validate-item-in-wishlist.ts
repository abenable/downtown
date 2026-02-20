import { createStep } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";

type ValidateItemInWishlistStepInput = {
  wishlist: any;
  wishlist_item_id: string;
};

export const validateItemInWishlistStep = createStep(
  "validate-item-in-wishlist",
  async ({ wishlist, wishlist_item_id }: ValidateItemInWishlistStepInput) => {
    const item = wishlist.items?.find((item: any) => item?.id === wishlist_item_id);

    if (!item) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Item does not exist in customer's wishlist"
      );
    }
  }
);
