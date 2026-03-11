import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { REFUND_MODULE } from "../../../../../modules/refund";
import { RefundStatus } from "../../../../../modules/refund/models/refund-request";
import type RefundModuleService from "../../../../../modules/refund/service";

// POST /admin/refunds/:id/approve - Approve a refund request
export const POST = async (
  req: AuthenticatedMedusaRequest<{
    admin_notes?: string;
  }>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const refundService: RefundModuleService = req.scope.resolve(REFUND_MODULE);
  const { admin_notes } = req.body || {};

  const refund = await refundService.retrieveRefundRequest(id);

  if (!refund) {
    return res.status(404).json({ message: "Refund request not found" });
  }

  if (refund.status !== RefundStatus.REQUESTED) {
    return res.status(400).json({
      message: `Cannot approve refund with status: ${refund.status}`,
    });
  }

  const updatedRefund = await refundService.updateRefundRequests({
    id,
    status: RefundStatus.APPROVED,
    approved_at: new Date(),
    approved_by: req.auth_context.actor_id,
    admin_notes,
  });

  res.json({
    message: "Refund approved successfully",
    refund: updatedRefund,
  });
};
