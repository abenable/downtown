import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PAYOUT_MODULE } from "../../../modules/payout";
import PayoutModuleService from "../../../modules/payout/service";

// GET /vendors/payouts - List vendor's payouts
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const payoutService: PayoutModuleService = req.scope.resolve(PAYOUT_MODULE);

  // Get vendor from auth context
  const { data: vendorAdmins } = await query.graph({
    entity: "vendor_admin",
    fields: ["vendor.id"],
    filters: {
      id: req.auth_context.actor_id,
    },
  });

  const vendorAdmin = vendorAdmins[0];
  if (!vendorAdmin?.vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Get payouts for this vendor
  const payouts = await payoutService.listPayouts({
    vendor_id: vendorAdmin.vendor.id,
  });

  // Calculate summary
  const summary = {
    total_payouts: payouts.length,
    total_paid: payouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pending_amount: payouts
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };

  res.json({
    payouts,
    summary,
    count: payouts.length,
  });
};
