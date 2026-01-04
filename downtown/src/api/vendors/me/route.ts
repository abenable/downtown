import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /vendors/me - Get current vendor info
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { actor_id, actor_type } = req.auth_context;

  let vendorAdmin;

  if (actor_type === "customer") {
    // Find vendor by customer_id
    const { data: vendorAdmins } = await query.graph({
      entity: "vendor_admin",
      fields: [
        "id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "customer_id",
        "vendor.*",
      ],
      filters: {
        customer_id: actor_id,
      },
    });
    vendorAdmin = vendorAdmins[0];
  } else {
    // Find vendor by vendor_admin id (legacy support)
    const { data: vendorAdmins } = await query.graph({
      entity: "vendor_admin",
      fields: [
        "id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "customer_id",
        "vendor.*",
      ],
      filters: {
        id: actor_id,
      },
    });
    vendorAdmin = vendorAdmins[0];
  }

  if (!vendorAdmin) {
    return res.status(404).json({
      message: "Vendor not found. You may need to register as a vendor first.",
      is_vendor: false,
    });
  }

  res.json({
    vendor_admin: vendorAdmin,
    vendor: vendorAdmin.vendor,
    is_vendor: true,
  });
};
