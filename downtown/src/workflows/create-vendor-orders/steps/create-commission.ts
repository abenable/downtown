import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMMISSION_MODULE } from "../../../modules/commission";
import CommissionModuleService from "../../../modules/commission/service";
import { CommissionStatus } from "../../../modules/commission/models/commission";

type CreateCommissionStepInput = {
  order_id: string;
  vendor_id: string;
  order_total: number;
  currency_code: string;
};

const COMMISSION_RATE = 10; // 10% platform commission

export const createCommissionStep = createStep(
  "create-commission-step",
  async (input: CreateCommissionStepInput, { container }) => {
    const commissionService: CommissionModuleService =
      container.resolve(COMMISSION_MODULE);

    const commissionAmount = Math.round(
      input.order_total * (COMMISSION_RATE / 100)
    );
    const vendorAmount = input.order_total - commissionAmount;

    const commission = await commissionService.createCommissions({
      order_id: input.order_id,
      vendor_id: input.vendor_id,
      order_total: input.order_total,
      commission_rate: COMMISSION_RATE,
      commission_amount: commissionAmount,
      vendor_amount: vendorAmount,
      currency_code: input.currency_code,
      status: CommissionStatus.PENDING,
    });

    return new StepResponse(commission, commission.id);
  },
  async (commissionId: string, { container }) => {
    const commissionService: CommissionModuleService =
      container.resolve(COMMISSION_MODULE);

    await commissionService.deleteCommissions(commissionId);
  }
);
