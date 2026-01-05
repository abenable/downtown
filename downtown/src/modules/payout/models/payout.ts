import { model } from "@medusajs/framework/utils";

export enum PayoutStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

const Payout = model.define("payout", {
  id: model.id().primaryKey(),
  vendor_id: model.text(),
  amount: model.bigNumber(),
  currency_code: model.text().default("ugx"),
  period_start: model.dateTime(),
  period_end: model.dateTime(),
  orders_count: model.number().default(0),
  total_sales: model.bigNumber(),
  platform_fee: model.bigNumber(), // Platform fee (tax) amount
  status: model.enum(PayoutStatus).default(PayoutStatus.PENDING),
  processed_at: model.dateTime().nullable(),
  reference: model.text().nullable(), // Payment reference/transaction ID
  notes: model.text().nullable(),
});

export default Payout;
