import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MARKETPLACE_MODULE } from "../../../modules/marketplace";
import MarketplaceModuleService from "../../../modules/marketplace/service";

type CreateVendorAdminStepInput = {
  vendor_id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  customer_id?: string;
};

export const createVendorAdminStep = createStep(
  "create-vendor-admin-step",
  async (input: CreateVendorAdminStepInput, { container }) => {
    const marketplaceService: MarketplaceModuleService =
      container.resolve(MARKETPLACE_MODULE);

    const vendorAdmin = await marketplaceService.createVendorAdmins(input);

    return new StepResponse(vendorAdmin, vendorAdmin.id);
  },
  async (vendorAdminId: string, { container }) => {
    const marketplaceService: MarketplaceModuleService =
      container.resolve(MARKETPLACE_MODULE);

    await marketplaceService.deleteVendorAdmins(vendorAdminId);
  }
);
