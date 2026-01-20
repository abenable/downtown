import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { calculateVendorEarningsStep } from "./steps/calculate-vendor-earnings";
import { createPayoutStep } from "./steps/create-payout";
import { MobileNetwork } from "../../modules/payout/models/payout";

type RequestPayoutWorkflowInput = {
  vendor_id: string;
  phone_number: string;
  network: MobileNetwork;
  period_start?: Date;
  period_end?: Date;
};

/**
 * Workflow for vendors to request a payout
 * Calculates earnings and creates a pending payout record
 */
export const requestPayoutWorkflow = createWorkflow(
  "request-payout-workflow",
  (input: RequestPayoutWorkflowInput) => {
    // Default to last 30 days if no period specified
    const periodDates = transform({ input }, (data) => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      return {
        period_start: data.input.period_start || thirtyDaysAgo,
        period_end: data.input.period_end || now,
      };
    });

    // Calculate vendor earnings for the period
    const earnings = calculateVendorEarningsStep({
      vendor_id: input.vendor_id,
      period_start: periodDates.period_start,
      period_end: periodDates.period_end,
    });

    // Create payout input
    const payoutInput = transform(
      { input, earnings, periodDates },
      (data) => ({
        vendor_id: data.input.vendor_id,
        amount: data.earnings.net_amount,
        total_sales: data.earnings.total_sales,
        platform_fee: data.earnings.platform_fee,
        orders_count: data.earnings.orders_count,
        currency_code: data.earnings.currency_code,
        period_start: data.periodDates.period_start,
        period_end: data.periodDates.period_end,
        phone_number: data.input.phone_number,
        network: data.input.network,
      })
    );

    // Create the payout record
    const payout = createPayoutStep(payoutInput);

    return new WorkflowResponse({
      payout,
      earnings,
    });
  }
);
