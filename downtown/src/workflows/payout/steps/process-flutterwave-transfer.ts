import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { MobileNetwork } from "../../../modules/payout/models/payout";

type ProcessFlutterwaveTransferInput = {
  payout_id: string;
  amount: number;
  phone_number: string;
  network: MobileNetwork;
  currency_code: string;
  vendor_name: string;
  narration?: string;
};

type FlutterwaveTransferResponse = {
  status: string;
  message: string;
  data?: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    narration: string;
    complete_message: string;
    bank_name: string;
    is_approved: number;
  };
};

export const processFlutterwaveTransferStep = createStep(
  "process-flutterwave-transfer-step",
  async (
    input: ProcessFlutterwaveTransferInput,
    { container }
  ): Promise<StepResponse<{ transfer_reference: string; transfer_id: number }>> => {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Flutterwave secret key not configured"
      );
    }

    // Map network to Flutterwave bank codes for Uganda Mobile Money
    const networkBankCodes: Record<MobileNetwork, string> = {
      [MobileNetwork.MTN]: "MPS", // MTN Mobile Money
      [MobileNetwork.AIRTEL]: "MPS", // Airtel Money
    };

    const transferReference = `PAYOUT_${input.payout_id}_${Date.now()}`;

    const response = await fetch("https://api.flutterwave.com/v3/transfers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_bank: networkBankCodes[input.network],
        account_number: input.phone_number,
        amount: input.amount,
        narration: input.narration || `Downtown payout to ${input.vendor_name}`,
        currency: input.currency_code.toUpperCase(),
        reference: transferReference,
        callback_url: `${process.env.MEDUSA_BACKEND_URL}/webhooks/flutterwave/transfers`,
        beneficiary_name: input.vendor_name,
        // Mobile Money specific
        meta: [
          {
            mobile_number: input.phone_number,
            network: input.network.toUpperCase(),
          },
        ],
      }),
    });

    const result: FlutterwaveTransferResponse = await response.json();

    if (result.status !== "success" || !result.data) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        result.message || "Failed to process transfer"
      );
    }

    return new StepResponse({
      transfer_reference: result.data.reference,
      transfer_id: result.data.id,
    });
  }
);
