import { model } from "@medusajs/framework/utils";

export enum CommissionStatus {
  PENDING = "pending",
  COLLECTED = "collected",
  PAID_OUT = "paid_out",
}

const Commission = model.define("commission", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  vendor_id: model.text(),
  order_total: model.bigNumber(),
  commission_rate: model.number().default(10), // 10% default
  commission_amount: model.bigNumber(),
  vendor_amount: model.bigNumber(), // Amount vendor receives (90%)
  currency_code: model.text().default("ugx"),
  status: model.enum(CommissionStatus).default(CommissionStatus.PENDING),
  collected_at: model.dateTime().nullable(),
  paid_out_at: model.dateTime().nullable(),
});

export default Commission;
