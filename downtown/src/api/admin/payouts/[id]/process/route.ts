import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { processPayoutWorkflow } from "../../../../../workflows/payout";

// POST /admin/payouts/:id/process - Process an approved payout
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;

  try {
    const { result } = await processPayoutWorkflow(req.scope).run({
      input: {
        payout_id: id,
        admin_id: req.auth_context.actor_id,
      },
    });

    res.json({
      message: "Payout processed successfully",
      payout_id: result.payout_id,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || "Failed to process payout",
    });
  }
};
