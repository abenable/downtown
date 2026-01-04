import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MARKETPLACE_MODULE } from "../../../../../modules/marketplace";
import MarketplaceModuleService from "../../../../../modules/marketplace/service";

// POST /admin/vendors/:id/reject - Reject a vendor application
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const { reason, rejection_reason } = req.body as {
    reason?: string;
    rejection_reason?: string;
  };

  const marketplaceService: MarketplaceModuleService =
    req.scope.resolve(MARKETPLACE_MODULE);

  const vendor = await marketplaceService.retrieveVendor(id);

  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  if (vendor.status === "rejected") {
    return res.status(400).json({ message: "Vendor is already rejected" });
  }

  const updatedVendor = await marketplaceService.updateVendors({
    id,
    status: "rejected",
    rejection_reason: rejection_reason || reason || "Application not approved",
    approved_at: null,
  });

  res.json({
    vendor: updatedVendor,
    message: "Vendor rejected",
  });
};
