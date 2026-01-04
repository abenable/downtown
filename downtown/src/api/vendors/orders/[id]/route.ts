import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /vendors/orders/:id - Get a specific order
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Get vendor from auth context
  const { data: vendorAdmins } = await query.graph({
    entity: "vendor_admin",
    fields: ["vendor.id", "vendor.orders.id"],
    filters: {
      id: req.auth_context.actor_id,
    },
  });

  const vendorAdmin = vendorAdmins[0];
  if (!vendorAdmin?.vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Verify order belongs to this vendor
  const orderIds = vendorAdmin.vendor.orders?.map((o: any) => o.id) || [];
  if (!orderIds.includes(id)) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Get full order details
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "*",
      "items.*",
      "items.product.*",
      "shipping_address.*",
      "billing_address.*",
      "shipping_methods.*",
      "payment_collections.*",
    ],
    filters: {
      id,
    },
  });

  const order = orders[0];

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json({ order });
};
