import {
  createWorkflow,
  transform,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { processFlutterwaveTransferStep } from "./steps/process-flutterwave-transfer";
import { PAYOUT_MODULE } from "../../modules/payout";
import { PayoutStatus } from "../../modules/payout/models/payout";
import { MedusaError } from "@medusajs/framework/utils";

type ProcessPayoutWorkflowInput = {
  payout_id: string;
  admin_id: string;
};

// Step to validate and fetch payout
const validatePayoutStep = createStep(
  "validate-payout-step",
  async (input: { payout_id: string }, { container }) => {
    const payoutService = container.resolve(PAYOUT_MODULE);

    const payout = await payoutService.retrievePayout(input.payout_id);

    if (!payout) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Payout not found"
      );
    }

    if (payout.status !== PayoutStatus.APPROVED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Payout must be approved before processing"
      );
    }

    if (!payout.phone_number || !payout.network) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Payout missing mobile money details"
      );
    }

    return new StepResponse(payout);
  }
);

// Step to update payout status
const updatePayoutStatusStep = createStep(
  "update-payout-status-step",
  async (
    input: {
      payout_id: string;
      status: PayoutStatus;
      flutterwave_reference?: string;
      failed_reason?: string;
    },
    { container }
  ) => {
    const payoutService = container.resolve(PAYOUT_MODULE);

    const updateData: Record<string, unknown> = {
      status: input.status,
    };

    if (input.status === PayoutStatus.COMPLETED) {
      updateData.processed_at = new Date();
      updateData.flutterwave_reference = input.flutterwave_reference;
    }

    if (input.status === PayoutStatus.FAILED) {
      updateData.failed_reason = input.failed_reason;
    }

    const payout = await payoutService.updatePayouts({
      id: input.payout_id,
      ...updateData,
    });

    return new StepResponse(payout);
  },
  // Compensation - revert to approved status
  async (payoutId, { container }) => {
    if (!payoutId) return;

    const payoutService = container.resolve(PAYOUT_MODULE);
    await payoutService.updatePayouts({
      id: payoutId,
      status: PayoutStatus.APPROVED,
      flutterwave_reference: null,
      failed_reason: null,
    });
  }
);

/**
 * Workflow to process an approved payout via Flutterwave
 */
export const processPayoutWorkflow = createWorkflow(
  "process-payout-workflow",
  (input: ProcessPayoutWorkflowInput) => {
    // Validate payout exists and is approved
    const payout = validatePayoutStep({ payout_id: input.payout_id });

    // Set status to processing
    updatePayoutStatusStep({
      payout_id: input.payout_id,
      status: PayoutStatus.PROCESSING,
    });

    // Prepare transfer input
    const transferInput = transform({ payout }, (data) => ({
      payout_id: data.payout.id,
      amount: Number(data.payout.amount),
      phone_number: data.payout.phone_number,
      network: data.payout.network,
      currency_code: data.payout.currency_code,
      vendor_name: `Vendor ${data.payout.vendor_id}`,
      narration: `Payout for period ${data.payout.period_start} to ${data.payout.period_end}`,
    }));

    // Process the transfer via Flutterwave
    const transferResult = processFlutterwaveTransferStep(transferInput);

    // Update payout with success status
    const updatedPayout = updatePayoutStatusStep(
      transform({ input, transferResult }, (data) => ({
        payout_id: data.input.payout_id,
        status: PayoutStatus.COMPLETED,
        flutterwave_reference: data.transferResult.transfer_reference,
      }))
    );

    return new WorkflowResponse({
      payout: updatedPayout,
      transfer: transferResult,
    });
  }
);
