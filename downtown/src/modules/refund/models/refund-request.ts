import { model } from "@medusajs/framework/utils";

export enum RefundStatus {
  REQUESTED = "requested",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum RefundReason {
  DAMAGED = "damaged",
  WRONG_ITEM = "wrong_item",
  NOT_AS_DESCRIBED = "not_as_described",
  DEFECTIVE = "defective",
  CHANGED_MIND = "changed_mind",
  OTHER = "other",
}

const RefundRequest = model.define("refund_request", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  customer_id: model.text(),
  vendor_id: model.text().nullable(),
  // Amount details
  amount: model.bigNumber(),
  currency_code: model.text().default("ugx"),
  // Refund details
  reason: model.enum(RefundReason),
  reason_details: model.text().nullable(),
  status: model.enum(RefundStatus).default(RefundStatus.REQUESTED),
  // Admin response
  admin_notes: model.text().nullable(),
  rejection_reason: model.text().nullable(),
  // Africa's Talking refund details
  africatalking_transaction_id: model.text().nullable(),
  africatalking_reference: model.text().nullable(),
  // Mobile money refund details
  refund_phone_number: model.text().nullable(),
  refund_network: model.enum(["mtn", "airtel"]).nullable(),
  // Timestamps
  requested_at: model.dateTime(),
  approved_at: model.dateTime().nullable(),
  approved_by: model.text().nullable(),
  processed_at: model.dateTime().nullable(),
  completed_at: model.dateTime().nullable(),
});

export default RefundRequest;
