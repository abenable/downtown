import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { completeCartWorkflow } from "@medusajs/medusa/core-flows";
import { groupVendorItemsStep } from "./steps/group-vendor-items";

type CompleteVendorCartWorkflowInput = {
  cart_id: string;
};

export const completeVendorCartWorkflow = createWorkflow(
  "complete-vendor-cart-workflow",
  (input: CompleteVendorCartWorkflowInput) => {
    // First, group items by vendor to understand the split
    const vendorGroups = groupVendorItemsStep({
      cart_id: input.cart_id,
    });

    // Complete the cart using standard workflow (creates single order)
    const orderResult = completeCartWorkflow.runAsStep({
      input: {
        id: input.cart_id,
      },
    });

    // Extract order data
    const orderData = transform({ orderResult, vendorGroups }, (data) => {
      // For MVP: Single order with commission tracking per vendor
      // Future: Could create child orders per vendor
      return {
        order: data.orderResult,
        vendorGroups: data.vendorGroups,
      };
    });

    return new WorkflowResponse(orderData);
  }
);
