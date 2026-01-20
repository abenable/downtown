import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PAYOUT_MODULE } from "../../../modules/payout";
import { PayoutStatus, MobileNetwork } from "../../../modules/payout/models/payout";

type CreatePayoutInput = {
  vendor_id: string;
  amount: number;
  total_sales: number;
  platform_fee: number;
  orders_count: number;
  currency_code: string;
  period_start: Date;
  period_end: Date;
  phone_number: string;
  network: MobileNetwork;
};

export const createPayoutStep = createStep(
  "create-payout-step",
  async (input: CreatePayoutInput, { container }) => {
    const payoutService = container.resolve(PAYOUT_MODULE);

    const payout = await payoutService.createPayouts({
      vendor_id: input.vendor_id,
      amount: input.amount,
      total_sales: input.total_sales,
      platform_fee: input.platform_fee,
      orders_count: input.orders_count,
      currency_code: input.currency_code,
      period_start: input.period_start,
      period_end: input.period_end,
      phone_number: input.phone_number,
      network: input.network,
      status: PayoutStatus.PENDING,
      requested_at: new Date(),
    });

    return new StepResponse(payout, payout.id);
  },
  // Compensation function - delete payout if workflow fails
  async (payoutId, { container }) => {
    if (!payoutId) return;

    const payoutService = container.resolve(PAYOUT_MODULE);
    await payoutService.deletePayouts(payoutId);
  }
);
