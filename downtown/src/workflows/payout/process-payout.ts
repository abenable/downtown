import {
  createWorkflow,
  transform,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { PAYOUT_MODULE } from "../../modules/payout";
import { PayoutStatus } from "../../modules/payout/models/payout";
import { MedusaError } from "@medusajs/framework/utils";
import type PayoutModuleService from "../../modules/payout/service";

type ProcessPayoutWorkflowInput = {
  payout_id: string;
  admin_id: string;
};

// Step to validate and fetch payout
const validatePayoutStep = createStep(
  "validate-payout-step",
  async (input: { payout_id: string }, { container }) => {
    const payoutService: PayoutModuleService = container.resolve(PAYOUT_MODULE);

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

// Step to update payout to processing status
const setPayoutProcessingStep = createStep(
  "set-payout-processing-step",
  async (
    input: {
      payout_id: string;
    },
    { container }
  ) => {
    const payoutService: PayoutModuleService = container.resolve(PAYOUT_MODULE);

    await payoutService.updatePayouts([{
      id: input.payout_id,
      status: PayoutStatus.PROCESSING,
    }]);

    return new StepResponse(input.payout_id, input.payout_id);
  },
  // Compensation - revert to approved status
  async (payoutId, { container }) => {
    if (!payoutId) return;

    const payoutService: PayoutModuleService = container.resolve(PAYOUT_MODULE);
    await payoutService.updatePayouts([{
      id: payoutId,
      status: PayoutStatus.APPROVED,
    }]);
  }
);

// Step to complete payout
const completePayoutStep = createStep(
  "complete-payout-step",
  async (
    input: {
      payout_id: string;
      status: PayoutStatus;
      failed_reason?: string;
    },
    { container }
  ) => {
    const payoutService: PayoutModuleService = container.resolve(PAYOUT_MODULE);

    const updateData: any = {
      id: input.payout_id,
      status: input.status,
    };

    if (input.status === PayoutStatus.COMPLETED) {
      updateData.processed_at = new Date();
    }

    if (input.status === PayoutStatus.FAILED) {
      updateData.failed_reason = input.failed_reason;
    }

    await payoutService.updatePayouts([updateData]);

    return new StepResponse(input.payout_id);
  },
  // Compensation - revert to approved status
  async (payoutId, { container }) => {
    if (!payoutId) return;

    const payoutService: PayoutModuleService = container.resolve(PAYOUT_MODULE);
    await payoutService.updatePayouts([{
      id: payoutId,
      status: PayoutStatus.APPROVED,
    }]);
  }
);

/**
 * Workflow to process an approved payout
 * Note: Actual payout transfer via mobile money provider should be handled separately
 * This workflow manages the payout status transitions
 */
export const processPayoutWorkflow = createWorkflow(
  "process-payout-workflow",
  (input: ProcessPayoutWorkflowInput) => {
    // Validate payout exists and is approved
    const payout = validatePayoutStep({ payout_id: input.payout_id });

    // Set status to processing
    setPayoutProcessingStep({
      payout_id: input.payout_id,
    });

    // Complete the payout
    // TODO: Integrate with the mobile money payout processor
    const updatedPayout = completePayoutStep({
      payout_id: input.payout_id,
      status: PayoutStatus.COMPLETED,
    });

    return new WorkflowResponse({
      payout_id: input.payout_id,
    });
  }
);
