import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { REFUND_MODULE } from "../../../../../modules/refund";
import { RefundStatus } from "../../../../../modules/refund/models/refund-request";

// POST /admin/refunds/:id/process - Process an approved refund
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const refundService = req.scope.resolve(REFUND_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const refund = await refundService.retrieveRefundRequest(id);

  if (!refund) {
    return res.status(404).json({ message: "Refund request not found" });
  }

  if (refund.status !== RefundStatus.APPROVED) {
    return res.status(400).json({
      message: `Cannot process refund with status: ${refund.status}. Must be approved first.`,
    });
  }

  // Check if we have mobile money details for the refund
  if (!refund.refund_phone_number || !refund.refund_network) {
    return res.status(400).json({
      message: "Refund requires phone number and network for mobile money transfer",
    });
  }

  // Update status to processing
  await refundService.updateRefundRequests({
    id,
    status: RefundStatus.PROCESSING,
    processed_at: new Date(),
  });

  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!secretKey) {
    await refundService.updateRefundRequests({
      id,
      status: RefundStatus.FAILED,
    });
    return res.status(500).json({
      message: "Flutterwave not configured",
    });
  }

  try {
    const transferReference = `REFUND_${id}_${Date.now()}`;

    // Process refund via Flutterwave transfer
    const response = await fetch("https://api.flutterwave.com/v3/transfers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_bank: "MPS", // Mobile Money
        account_number: refund.refund_phone_number,
        amount: Number(refund.amount),
        narration: `Refund for order ${refund.order_id}`,
        currency: refund.currency_code.toUpperCase(),
        reference: transferReference,
        callback_url: `${process.env.MEDUSA_BACKEND_URL}/webhooks/flutterwave/refunds`,
        beneficiary_name: "Customer Refund",
        meta: [
          {
            mobile_number: refund.refund_phone_number,
            network: refund.refund_network.toUpperCase(),
          },
        ],
      }),
    });

    const result = await response.json();

    if (result.status === "success" && result.data) {
      // Update refund with Flutterwave reference
      const updatedRefund = await refundService.updateRefundRequests({
        id,
        status: RefundStatus.COMPLETED,
        flutterwave_reference: transferReference,
        flutterwave_refund_id: String(result.data.id),
        completed_at: new Date(),
      });

      logger.info(`Refund ${id} processed successfully`);

      res.json({
        message: "Refund processed successfully",
        refund: updatedRefund,
        transfer: {
          reference: transferReference,
          id: result.data.id,
        },
      });
    } else {
      // Failed to process
      await refundService.updateRefundRequests({
        id,
        status: RefundStatus.FAILED,
      });

      res.status(400).json({
        message: result.message || "Failed to process refund",
      });
    }
  } catch (error: any) {
    logger.error(`Failed to process refund ${id}: ${error.message}`);

    await refundService.updateRefundRequests({
      id,
      status: RefundStatus.FAILED,
    });

    res.status(500).json({
      message: "Failed to process refund",
      error: error.message,
    });
  }
};
