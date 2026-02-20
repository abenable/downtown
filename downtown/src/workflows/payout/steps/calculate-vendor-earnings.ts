import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

type CalculateVendorEarningsInput = {
  vendor_id: string;
  period_start: Date;
  period_end: Date;
};

type CalculateVendorEarningsOutput = {
  total_sales: number;
  platform_fee: number;
  net_amount: number;
  orders_count: number;
  currency_code: string;
};

export const calculateVendorEarningsStep = createStep(
  "calculate-vendor-earnings-step",
  async (
    input: CalculateVendorEarningsInput,
    { container }
  ): Promise<StepResponse<CalculateVendorEarningsOutput>> => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Get all completed orders for the vendor in the period
    const { data: vendorOrders } = await query.graph({
      entity: "vendor",
      fields: ["id", "orders.*", "orders.items.*"],
      filters: {
        id: input.vendor_id,
      },
    });

    const vendor = vendorOrders[0];
    if (!vendor || !vendor.orders) {
      return new StepResponse({
        total_sales: 0,
        platform_fee: 0,
        net_amount: 0,
        orders_count: 0,
        currency_code: "ugx",
      });
    }

    // Filter orders by period and status
    const eligibleOrders = vendor.orders.filter((order: any) => {
      const orderDate = new Date(order.created_at);
      const isInPeriod =
        orderDate >= input.period_start && orderDate <= input.period_end;
      const isCompleted = order.status === "completed";
      return isInPeriod && isCompleted;
    });

    // Calculate totals
    let totalSales = 0;
    const platformFeeRate = 0.1; // 10%

    for (const order of eligibleOrders) {
      // Calculate vendor's portion of the order
      if (order?.items) {
        for (const item of order.items) {
          if (item) {
            totalSales += Number(item.unit_price || 0) * Number(item.quantity || 0);
          }
        }
      }
    }

    const platformFee = Math.round(totalSales * platformFeeRate);
    const netAmount = totalSales - platformFee;

    return new StepResponse({
      total_sales: totalSales,
      platform_fee: platformFee,
      net_amount: netAmount,
      orders_count: eligibleOrders.length,
      currency_code: "ugx",
    });
  }
);
