import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { z } from "zod";
import { REFUND_MODULE } from "../../../../../modules/refund";
import { RefundStatus, RefundReason } from "../../../../../modules/refund/models/refund-request";

const RefundRequestSchema = z.object({
  amount: z.number().positive(),
  reason: z.enum(["damaged", "wrong_item", "not_as_described", "defective", "changed_mind", "other"]),
  reason_details: z.string().optional(),
  refund_phone_number: z.string().min(10).max(15).optional(),
  refund_network: z.enum(["mtn", "airtel"]).optional(),
});

// POST /store/orders/:id/refund - Request a refund
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id: orderId } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const refundService = req.scope.resolve(REFUND_MODULE);

  // Validate input
  const validatedBody = RefundRequestSchema.safeParse(req.body);
  if (!validatedBody.success) {
    return res.status(400).json({
      message: "Invalid request body",
      errors: validatedBody.error.errors,
    });
  }

  const { amount, reason, reason_details, refund_phone_number, refund_network } = validatedBody.data;

  // Get order and verify ownership
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "total", "currency_code", "status"],
    filters: { id: orderId },
  });

  const order = orders[0];
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Verify customer owns this order
  if (order.customer_id !== req.auth_context.actor_id) {
    return res.status(403).json({ message: "Not authorized to request refund for this order" });
  }

  // Check if order is eligible for refund (must be completed)
  if (order.status !== "completed") {
    return res.status(400).json({
      message: "Only completed orders can be refunded",
    });
  }

  // Check if refund amount is valid
  if (amount > Number(order.total)) {
    return res.status(400).json({
      message: "Refund amount cannot exceed order total",
    });
  }

  // Check if there's already a pending refund for this order
  const existingRefunds = await refundService.listRefundRequests({
    order_id: orderId,
    status: [RefundStatus.REQUESTED, RefundStatus.APPROVED, RefundStatus.PROCESSING],
  });

  if (existingRefunds.length > 0) {
    return res.status(400).json({
      message: "There is already a pending refund request for this order",
    });
  }

  // Get vendor ID from order
  let vendorId: string | null = null;
  try {
    const { data: vendorLinks } = await query.graph({
      entity: "vendor",
      fields: ["id", "orders.id"],
      filters: {},
    });

    for (const vendor of vendorLinks) {
      if (vendor.orders?.some((o: any) => o.id === orderId)) {
        vendorId = vendor.id;
        break;
      }
    }
  } catch {
    // Vendor link might not exist
  }

  // Format phone number if provided
  let formattedPhone = refund_phone_number;
  if (formattedPhone) {
    formattedPhone = formattedPhone.replace(/\s/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "256" + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith("256")) {
      formattedPhone = "256" + formattedPhone;
    }
  }

  // Create refund request
  const refundRequest = await refundService.createRefundRequests({
    order_id: orderId,
    customer_id: req.auth_context.actor_id,
    vendor_id: vendorId,
    amount,
    currency_code: order.currency_code,
    reason: reason as RefundReason,
    reason_details,
    status: RefundStatus.REQUESTED,
    refund_phone_number: formattedPhone,
    refund_network: refund_network,
    requested_at: new Date(),
  });

  res.status(201).json({
    message: "Refund request submitted successfully",
    refund: refundRequest,
  });
};

// GET /store/orders/:id/refund - Get refund status for an order
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id: orderId } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const refundService = req.scope.resolve(REFUND_MODULE);

  // Get order and verify ownership
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id"],
    filters: { id: orderId },
  });

  const order = orders[0];
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Verify customer owns this order
  if (order.customer_id !== req.auth_context.actor_id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // Get refund requests for this order
  const refunds = await refundService.listRefundRequests({
    order_id: orderId,
  });

  res.json({
    refunds,
    count: refunds.length,
  });
};
