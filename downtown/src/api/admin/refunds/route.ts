import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { REFUND_MODULE } from "../../../modules/refund";

// GET /admin/refunds - List all refund requests
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const refundService = req.scope.resolve(REFUND_MODULE);

  const { status, vendor_id, customer_id, limit = 50, offset = 0 } = req.query;

  const filters: Record<string, unknown> = {};
  if (status) {
    filters.status = status;
  }
  if (vendor_id) {
    filters.vendor_id = vendor_id;
  }
  if (customer_id) {
    filters.customer_id = customer_id;
  }

  const refunds = await refundService.listRefundRequests(filters, {
    take: Number(limit),
    skip: Number(offset),
    order: { requested_at: "DESC" },
  });

  // Calculate summary stats
  const allRefunds = await refundService.listRefundRequests({});
  const summary = {
    total: allRefunds.length,
    requested: allRefunds.filter((r) => r.status === "requested").length,
    approved: allRefunds.filter((r) => r.status === "approved").length,
    processing: allRefunds.filter((r) => r.status === "processing").length,
    completed: allRefunds.filter((r) => r.status === "completed").length,
    rejected: allRefunds.filter((r) => r.status === "rejected").length,
    failed: allRefunds.filter((r) => r.status === "failed").length,
    total_refunded: allRefunds
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + Number(r.amount), 0),
  };

  res.json({
    refunds,
    summary,
    count: refunds.length,
    limit: Number(limit),
    offset: Number(offset),
  });
};
