import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SUPPORT_MODULE } from "../../../../modules/support";
import SupportModuleService from "../../../../modules/support/service";

// GET /vendors/support/:id - Get a specific support ticket
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
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

  // Get ticket and verify ownership
  const ticket = await supportService.retrieveSupportTicket(id);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (ticket.vendor_id !== vendorAdmin.vendor.id) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json({ ticket });
};
