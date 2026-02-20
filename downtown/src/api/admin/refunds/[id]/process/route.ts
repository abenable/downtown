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

  const providerBaseUrl = process.env.MOBILE_MONEY_REFUND_BASE_URL;
  const apiKey = process.env.MOBILE_MONEY_REFUND_API_KEY;

  if (!providerBaseUrl || !apiKey) {
    await refundService.updateRefundRequests({
      id,
      status: RefundStatus.FAILED,
    });
    return res.status(500).json({
      message: "Mobile money refund provider is not configured",
    });
  }

  try {
    const transferReference = `REFUND_${id}_${Date.now()}`;

    const response = await fetch(`${providerBaseUrl}/refunds/mobile-money`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        network: refund.refund_network,
        phone_number: refund.refund_phone_number,
        currency_code: refund.currency_code.toUpperCase(),
        amount: Number(refund.amount),
        reference: transferReference,
        reason: "customer_refund",
        metadata: {
          refund_id: id,
          order_id: refund.order_id,
        },
      }),
    });

    const result = await response.json();

    if (response.ok && (result.status === "queued" || result.status === "success")) {
      const updatedRefund = await refundService.updateRefundRequests({
        id,
        status: RefundStatus.COMPLETED,
        africatalking_reference: transferReference,
        africatalking_transaction_id: result.transaction_id || result.id,
        completed_at: new Date(),
      });

      logger.info(`Refund ${id} processed successfully`);

      res.json({
        message: "Refund processed successfully",
        refund: updatedRefund,
        transfer: {
          reference: transferReference,
          transaction_id: result.transaction_id || result.id,
        },
      });
    } else {
      // Failed to process
      await refundService.updateRefundRequests({
        id,
        status: RefundStatus.FAILED,
      });

      res.status(400).json({
        message: result.error || result.message || "Failed to process refund",
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
