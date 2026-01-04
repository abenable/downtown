import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace";
import MarketplaceModuleService from "../../../../modules/marketplace/service";

// GET /admin/vendors/:id - Get vendor details
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "id",
      "handle",
      "name",
      "logo",
      "description",
      "phone",
      "email",
      "status",
      "rejection_reason",
      "approved_at",
      "is_active",
      "created_at",
      "admins.*",
      "products.*",
    ],
    filters: { id },
  });

  const vendor = vendors[0];

  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  res.json({ vendor });
};

// POST /admin/vendors/:id/approve - Approve a vendor
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const marketplaceService: MarketplaceModuleService =
    req.scope.resolve(MARKETPLACE_MODULE);

  const vendor = await marketplaceService.retrieveVendor(id);

  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  if (vendor.status === "approved") {
    return res.status(400).json({ message: "Vendor is already approved" });
  }

  const updatedVendor = await marketplaceService.updateVendors({
    id,
    status: "approved",
    approved_at: new Date(),
    rejection_reason: null,
  });

  res.json({
    vendor: updatedVendor,
    message: "Vendor approved successfully",
  });
};
