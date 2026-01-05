import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { MARKETPLACE_MODULE } from "../../../../../modules/marketplace";
import MarketplaceModuleService from "../../../../../modules/marketplace/service";
import { IEventBusModuleService } from "@medusajs/framework/types";

// POST /admin/vendors/:id/reject - Reject a vendor application
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const { reason, rejection_reason } = req.body as {
    reason?: string;
    rejection_reason?: string;
  };

  const marketplaceService: MarketplaceModuleService =
    req.scope.resolve(MARKETPLACE_MODULE);
  const eventBus: IEventBusModuleService = req.scope.resolve(Modules.EVENT_BUS);

  const vendor = await marketplaceService.retrieveVendor(id);

  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  if (vendor.status === "rejected") {
    return res.status(400).json({ message: "Vendor is already rejected" });
  }

  const finalReason = rejection_reason || reason || "Application not approved";

  const updatedVendor = await marketplaceService.updateVendors({
    id,
    status: "rejected",
    rejection_reason: finalReason,
    approved_at: null,
  });

  // Emit vendor rejected event for notifications
  await eventBus.emit({
    name: "vendor.rejected",
    data: { id: updatedVendor.id, reason: finalReason },
  });

  res.json({
    vendor: updatedVendor,
    message: "Vendor rejected",
  });
};
