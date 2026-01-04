import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MARKETPLACE_MODULE } from "../../../modules/marketplace";
import MarketplaceModuleService from "../../../modules/marketplace/service";

type CreateVendorStepInput = {
  handle: string;
  name: string;
  logo?: string;
  description?: string;
  phone?: string;
  email?: string;
};

export const createVendorStep = createStep(
  "create-vendor-step",
  async (input: CreateVendorStepInput, { container }) => {
    const marketplaceService: MarketplaceModuleService =
      container.resolve(MARKETPLACE_MODULE);

    const vendor = await marketplaceService.createVendors(input);

    return new StepResponse(vendor, vendor.id);
  },
  async (vendorId: string, { container }) => {
    const marketplaceService: MarketplaceModuleService =
      container.resolve(MARKETPLACE_MODULE);

    await marketplaceService.deleteVendors(vendorId);
  }
);
