import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { getVendorFromAuth } from "../helpers";

// GET /vendors/orders - List vendor's orders
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { vendorId } = await getVendorFromAuth(req);

  if (!vendorId) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Get orders linked to this vendor
  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "orders.*",
      "orders.items.*",
      "orders.shipping_address.*",
      "orders.billing_address.*",
      "orders.shipping_methods.*",
    ],
    filters: {
      id: vendorId,
    },
  });

  const vendor = vendors[0];

  res.json({
    orders: vendor?.orders || [],
    count: vendor?.orders?.length || 0,
  });
};
