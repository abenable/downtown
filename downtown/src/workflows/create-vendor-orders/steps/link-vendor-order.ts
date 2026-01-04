import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

type LinkVendorOrderStepInput = {
  vendor_id: string;
  order_id: string;
};

export const linkVendorOrderStep = createStep(
  "link-vendor-order-step",
  async (input: LinkVendorOrderStepInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    await link.create({
      marketplace: {
        vendor_id: input.vendor_id,
      },
      [Modules.ORDER]: {
        order_id: input.order_id,
      },
    });

    return new StepResponse(undefined, input);
  },
  async (input: LinkVendorOrderStepInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    await link.dismiss({
      marketplace: {
        vendor_id: input.vendor_id,
      },
      [Modules.ORDER]: {
        order_id: input.order_id,
      },
    });
  }
);
