import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

type LinkVendorProductStepInput = {
  vendor_id: string;
  product_id: string;
};

export const linkVendorProductStep = createStep(
  "link-vendor-product-step",
  async (input: LinkVendorProductStepInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    await link.create({
      marketplace: {
        vendor_id: input.vendor_id,
      },
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
    });

    return new StepResponse(undefined, input);
  },
  async (input: LinkVendorProductStepInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    await link.dismiss({
      marketplace: {
        vendor_id: input.vendor_id,
      },
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
    });
  }
);
