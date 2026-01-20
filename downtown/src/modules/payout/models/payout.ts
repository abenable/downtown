import { model } from "@medusajs/framework/utils";

export enum PayoutStatus {
  PENDING = "pending",
  APPROVED = "approved",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum MobileNetwork {
  MTN = "mtn",
  AIRTEL = "airtel",
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
  // Mobile Money payout fields
  phone_number: model.text().nullable(), // Recipient phone number
  network: model.enum(MobileNetwork).nullable(), // MTN or Airtel
  flutterwave_reference: model.text().nullable(), // Flutterwave transfer reference
  failed_reason: model.text().nullable(), // Reason for failure if any
  requested_at: model.dateTime().nullable(), // When vendor requested payout
  approved_at: model.dateTime().nullable(), // When admin approved payout
  approved_by: model.text().nullable(), // Admin user ID who approved
});

export default Payout;
