import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

type GroupVendorItemsStepInput = {
  cart_id: string;
};

type VendorItemGroup = {
  vendor_id: string;
  items: any[];
};

export const groupVendorItemsStep = createStep(
  "group-vendor-items-step",
  async (input: GroupVendorItemsStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Get cart with items and their product links to vendors
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "items.*", "items.product.*", "items.product.vendor.*"],
      filters: {
        id: input.cart_id,
      },
    });

    const cart = carts[0];
    if (!cart) {
      throw new Error(`Cart ${input.cart_id} not found`);
    }

    // Group items by vendor
    const vendorGroups: Map<string, VendorItemGroup> = new Map();

    for (const item of cart.items || []) {
      if (!item) continue;

      const product = (item as any).product;
      const vendorId = product?.vendor?.id || "platform"; // Default to platform if no vendor

      if (!vendorGroups.has(vendorId)) {
        vendorGroups.set(vendorId, {
          vendor_id: vendorId,
          items: [],
        });
      }

      vendorGroups.get(vendorId)!.items.push(item);
    }

    return new StepResponse(Array.from(vendorGroups.values()));
  }
);
