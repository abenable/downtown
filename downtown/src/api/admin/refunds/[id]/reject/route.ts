import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { z } from "zod";
import { REFUND_MODULE } from "../../../../../modules/refund";
import { RefundStatus } from "../../../../../modules/refund/models/refund-request";
import type RefundModuleService from "../../../../../modules/refund/service";

const RejectRefundSchema = z.object({
  rejection_reason: z.string().min(1),
});

// POST /admin/refunds/:id/reject - Reject a refund request
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const refundService: RefundModuleService = req.scope.resolve(REFUND_MODULE);

  // Validate input
  const validatedBody = RejectRefundSchema.safeParse(req.body);
  if (!validatedBody.success) {
    return res.status(400).json({
      message: "Rejection reason is required",
      errors: validatedBody.error.errors,
    });
  }

  const { rejection_reason } = validatedBody.data;

  const refund = await refundService.retrieveRefundRequest(id);

  if (!refund) {
    return res.status(404).json({ message: "Refund request not found" });
  }

  if (refund.status !== RefundStatus.REQUESTED) {
    return res.status(400).json({
      message: `Cannot reject refund with status: ${refund.status}`,
    });
  }

  const updatedRefund = await refundService.updateRefundRequests({
    id,
    status: RefundStatus.REJECTED,
    rejection_reason,
  });

  res.json({
    message: "Refund rejected",
    refund: updatedRefund,
  });
};
