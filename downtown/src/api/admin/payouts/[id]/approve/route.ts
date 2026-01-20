import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { PAYOUT_MODULE } from "../../../../../modules/payout";
import PayoutModuleService from "../../../../../modules/payout/service";
import { PayoutStatus } from "../../../../../modules/payout/models/payout";

// POST /admin/payouts/:id/approve - Approve a payout
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const payoutService: PayoutModuleService = req.scope.resolve(PAYOUT_MODULE);

  const payout = await payoutService.retrievePayout(id);

  if (!payout) {
    return res.status(404).json({ message: "Payout not found" });
  }

  if (payout.status !== PayoutStatus.PENDING) {
    return res.status(400).json({
      message: `Cannot approve payout with status: ${payout.status}`,
    });
  }

  const updatedPayout = await payoutService.updatePayouts({
    id,
    status: PayoutStatus.APPROVED,
    approved_at: new Date(),
    approved_by: req.auth_context.actor_id,
  });

  res.json({
    message: "Payout approved successfully",
    payout: updatedPayout,
  });
};
