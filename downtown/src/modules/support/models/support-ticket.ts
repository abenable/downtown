import { model } from "@medusajs/framework/utils";

export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum TicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum TicketCategory {
  ORDER_ISSUE = "order_issue",
  PRODUCT_ISSUE = "product_issue",
  PAYOUT_ISSUE = "payout_issue",
  ACCOUNT_ISSUE = "account_issue",
  TECHNICAL_ISSUE = "technical_issue",
  OTHER = "other",
}

const SupportTicket = model.define("support_ticket", {
  id: model.id().primaryKey(),
  vendor_id: model.text(),
  subject: model.text(),
  message: model.text(),
  category: model.enum(TicketCategory).default(TicketCategory.OTHER),
  priority: model.enum(TicketPriority).default(TicketPriority.MEDIUM),
  status: model.enum(TicketStatus).default(TicketStatus.OPEN),
  order_id: model.text().nullable(), // Reference to related order if applicable
  admin_notes: model.text().nullable(), // Internal notes for admin
  resolution: model.text().nullable(), // Resolution message
  resolved_at: model.dateTime().nullable(),
  resolved_by: model.text().nullable(), // Admin user ID who resolved
});

export default SupportTicket;
