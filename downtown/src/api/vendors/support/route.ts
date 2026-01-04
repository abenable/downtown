import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SUPPORT_MODULE } from "../../../modules/support";
import SupportModuleService from "../../../modules/support/service";
import { PostSupportTicketType } from "../validators";
import {
  TicketCategory,
  TicketPriority,
} from "../../../modules/support/models/support-ticket";

// Helper to map string to TicketCategory enum
const mapCategory = (category?: string): TicketCategory => {
  const categoryMap: Record<string, TicketCategory> = {
    order_issue: TicketCategory.ORDER_ISSUE,
    product_issue: TicketCategory.PRODUCT_ISSUE,
    payout_issue: TicketCategory.PAYOUT_ISSUE,
    account_issue: TicketCategory.ACCOUNT_ISSUE,
    technical_issue: TicketCategory.TECHNICAL_ISSUE,
    other: TicketCategory.OTHER,
  };
  return categoryMap[category || "other"] || TicketCategory.OTHER;
};

// Helper to map string to TicketPriority enum
const mapPriority = (priority?: string): TicketPriority => {
  const priorityMap: Record<string, TicketPriority> = {
    low: TicketPriority.LOW,
    medium: TicketPriority.MEDIUM,
    high: TicketPriority.HIGH,
    urgent: TicketPriority.URGENT,
  };
  return priorityMap[priority || "medium"] || TicketPriority.MEDIUM;
};

// GET /vendors/support - List vendor's support tickets
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const supportService: SupportModuleService =
    req.scope.resolve(SUPPORT_MODULE);

  // Get vendor from auth context
  const { data: vendorAdmins } = await query.graph({
    entity: "vendor_admin",
    fields: ["vendor.id"],
    filters: {
      id: req.auth_context.actor_id,
    },
  });

  const vendorAdmin = vendorAdmins[0];
  if (!vendorAdmin?.vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Get support tickets for this vendor
  const tickets = await supportService.listSupportTickets({
    vendor_id: vendorAdmin.vendor.id,
  });

  res.json({
    tickets,
    count: tickets.length,
  });
};

// POST /vendors/support - Create a new support ticket
export const POST = async (
  req: AuthenticatedMedusaRequest<PostSupportTicketType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const supportService: SupportModuleService =
    req.scope.resolve(SUPPORT_MODULE);

  // Get vendor from auth context
  const { data: vendorAdmins } = await query.graph({
    entity: "vendor_admin",
    fields: ["vendor.id"],
    filters: {
      id: req.auth_context.actor_id,
    },
  });

  const vendorAdmin = vendorAdmins[0];
  if (!vendorAdmin?.vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  const { category, priority, ...rest } = req.validatedBody;

  const ticket = await supportService.createSupportTickets({
    vendor_id: vendorAdmin.vendor.id,
    category: mapCategory(category),
    priority: mapPriority(priority),
    ...rest,
  });

  res.status(201).json({ ticket });
};
