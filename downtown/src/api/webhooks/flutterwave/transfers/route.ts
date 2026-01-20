import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PAYOUT_MODULE } from "../../../../modules/payout";
import { PayoutStatus } from "../../../../modules/payout/models/payout";

/**
 * Flutterwave Transfer Webhook Handler
 * Receives payout/transfer status updates from Flutterwave
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

  // Verify webhook signature
  const signature = req.headers["verif-hash"];
  if (webhookSecret && signature !== webhookSecret) {
    return res.status(401).json({ message: "Invalid webhook signature" });
  }

  const payload = req.body as {
    event: string;
    data: {
      id: number;
      reference: string;
      status: string;
      complete_message: string;
      amount: number;
      currency: string;
    };
  };

  const { event, data } = payload;

  // Only process transfer events
  if (!event.startsWith("transfer.")) {
    return res.status(200).json({ message: "Event ignored" });
  }

  try {
    const payoutService = req.scope.resolve(PAYOUT_MODULE);
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

    logger.info(`Flutterwave transfer webhook: ${event} for ref: ${data.reference}`);

    // Extract payout ID from reference (format: PAYOUT_{payout_id}_{timestamp})
    const refParts = data.reference.split("_");
    const payoutId = refParts.length >= 2 ? refParts[1] : null;

    if (!payoutId) {
      logger.warn(`Could not extract payout ID from reference: ${data.reference}`);
      return res.status(200).json({ message: "Payout ID not found" });
    }

    // Get payout
    const payout = await payoutService.retrievePayout(payoutId);
    if (!payout) {
      logger.warn(`Payout not found: ${payoutId}`);
      return res.status(200).json({ message: "Payout not found" });
    }

    // Update based on transfer status
    if (data.status === "SUCCESSFUL") {
      await payoutService.updatePayouts({
        id: payoutId,
        status: PayoutStatus.COMPLETED,
        flutterwave_reference: data.reference,
        processed_at: new Date(),
      });
      logger.info(`Payout ${payoutId} completed successfully`);
    } else if (data.status === "FAILED") {
      await payoutService.updatePayouts({
        id: payoutId,
        status: PayoutStatus.FAILED,
        failed_reason: data.complete_message || "Transfer failed",
      });
      logger.info(`Payout ${payoutId} failed: ${data.complete_message}`);
    }

    return res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error: any) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.error(`Flutterwave transfer webhook error: ${error.message}`);

    return res.status(200).json({ message: "Webhook received" });
  }
}
