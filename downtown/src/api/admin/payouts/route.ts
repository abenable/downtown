import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { PAYOUT_MODULE } from "../../../modules/payout";
import PayoutModuleService from "../../../modules/payout/service";

// GET /admin/payouts - List all payouts
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const payoutService: PayoutModuleService = req.scope.resolve(PAYOUT_MODULE);

  const { status, vendor_id, limit = 50, offset = 0 } = req.query;

  const filters: Record<string, unknown> = {};
  if (status) {
    filters.status = status;
  }
  if (vendor_id) {
    filters.vendor_id = vendor_id;
  }

  const payouts = await payoutService.listPayouts(filters, {
    take: Number(limit),
    skip: Number(offset),
    order: { created_at: "DESC" },
  });

  // Calculate summary stats
  const allPayouts = await payoutService.listPayouts({});
  const summary = {
    total_payouts: allPayouts.length,
    pending: allPayouts.filter((p) => p.status === "pending").length,
    approved: allPayouts.filter((p) => p.status === "approved").length,
    processing: allPayouts.filter((p) => p.status === "processing").length,
    completed: allPayouts.filter((p) => p.status === "completed").length,
    failed: allPayouts.filter((p) => p.status === "failed").length,
    total_paid: allPayouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pending_amount: allPayouts
      .filter((p) => ["pending", "approved"].includes(p.status))
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };

  res.json({
    payouts,
    summary,
    count: payouts.length,
    limit: Number(limit),
    offset: Number(offset),
  });
};
