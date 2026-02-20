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

  const secretKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;
  const environment = process.env.AFRICASTALKING_ENVIRONMENT || "production";

  if (!secretKey || !username) {
    await refundService.updateRefundRequests({
      id,
      status: RefundStatus.FAILED,
    });
    return res.status(500).json({
      message: "Africa's Talking not configured",
    });
  }

  try {
    const transferReference = `REFUND_${id}_${Date.now()}`;

    const baseUrl =
      environment === "sandbox"
        ? "https://payments.sandbox.africastalking.com"
        : "https://payments.africastalking.com";

    // Map network to Africa's Talking provider names
    const networkProviders: Record<string, string> = {
      mtn: "Mtn",
      airtel: "Airtel",
    };

    // Process refund via Africa's Talking B2C transfer
    const response = await fetch(`${baseUrl}/mobile/b2c/request`, {
      method: "POST",
      headers: {
        apiKey: secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username: username,
        productName: "Downtown",
        recipients: [
          {
            phoneNumber: refund.refund_phone_number,
            currencyCode: refund.currency_code.toUpperCase(),
            amount: Number(refund.amount),
            providerChannel: networkProviders[refund.refund_network!],
            reason: "SalaryPayment",
            metadata: {
              refund_id: id,
              order_id: refund.order_id,
              reference: transferReference,
            },
          },
        ],
      }),
    });

    const result = await response.json();

    if (!result.errorMessage && result.numQueued > 0 && result.entries[0].status === "Queued") {
      // Update refund with Africa's Talking reference
      const updatedRefund = await refundService.updateRefundRequests({
        id,
        status: RefundStatus.COMPLETED,
        africatalking_reference: transferReference,
        africatalking_transaction_id: result.entries[0].transactionId,
        completed_at: new Date(),
      });

      logger.info(`Refund ${id} processed successfully`);

      res.json({
        message: "Refund processed successfully",
        refund: updatedRefund,
        transfer: {
          reference: transferReference,
          transaction_id: result.entries[0].transactionId,
        },
      });
    } else {
      // Failed to process
      await refundService.updateRefundRequests({
        id,
        status: RefundStatus.FAILED,
      });

      res.status(400).json({
        message: result.errorMessage || "Failed to process refund",
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
