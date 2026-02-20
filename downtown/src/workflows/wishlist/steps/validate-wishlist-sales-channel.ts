import { createStep } from "@medusajs/framework/workflows-sdk";

type ValidateWishlistSalesChannelStepInput = {
  wishlist: any;
  sales_channel_id: string;
};

export const validateWishlistSalesChannelStep = createStep(
  "validate-wishlist-sales-channel",
  async (input: ValidateWishlistSalesChannelStepInput) => {
    const { wishlist, sales_channel_id } = input;

    if (wishlist.sales_channel_id !== sales_channel_id) {
      throw new Error("Wishlist does not belong to the current sales channel");
    }
  }
);
