import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Flutterwave Webhook Handler
 * Receives payment confirmations from Flutterwave for Mobile Money payments
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
      tx_ref: string;
      flw_ref: string;
      amount: number;
      currency: string;
      charged_amount: number;
      status: string;
      payment_type: string;
      customer: {
        email: string;
        phone_number: string;
        name: string;
      };
    };
  };

  const { event, data } = payload;

  // Only process successful charges
  if (event !== "charge.completed" || data.status !== "successful") {
    return res.status(200).json({ message: "Event ignored" });
  }

  try {
    const paymentModule = req.scope.resolve(Modules.PAYMENT);
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

    logger.info(`Flutterwave webhook received for tx_ref: ${data.tx_ref}`);

    // Extract session ID from tx_ref (format: DTN_{sessionId}_{timestamp})
    const txRefParts = data.tx_ref.split("_");
    const sessionId = txRefParts.length >= 2 ? txRefParts[1] : null;

    if (!sessionId) {
      logger.warn(`Could not extract session ID from tx_ref: ${data.tx_ref}`);
      return res.status(200).json({ message: "Session ID not found" });
    }

    // Update payment session with successful status
    await paymentModule.updatePaymentSession({
      id: sessionId,
      data: {
        flw_ref: data.flw_ref,
        flw_charge_id: data.id,
        flw_status: "successful",
        charged_amount: data.charged_amount,
        payment_type: data.payment_type,
      },
    });

    logger.info(`Payment session ${sessionId} updated to successful`);

    return res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error: any) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.error(`Flutterwave webhook error: ${error.message}`);

    // Return 200 to prevent Flutterwave from retrying
    return res.status(200).json({ message: "Webhook received" });
  }
}
