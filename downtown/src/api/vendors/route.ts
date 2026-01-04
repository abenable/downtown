import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createVendorWorkflow } from "../../workflows/create-vendor";
import { PostVendorCreateType } from "./validators";

// POST /vendors - Create a new vendor (customer becomes vendor)
export const POST = async (
  req: AuthenticatedMedusaRequest<PostVendorCreateType>,
  res: MedusaResponse
) => {
  const { auth_identity_id, actor_id, actor_type } = req.auth_context;

  if (!auth_identity_id) {
    return res.status(401).json({
      message: "Authentication required. Please log in first.",
    });
  }

  const { vendor, admin } = req.validatedBody;

  // Get customer_id if authenticated as customer
  let customer_id: string | undefined;
  if (actor_type === "customer" && actor_id) {
    customer_id = actor_id;

    // Check if customer already has a vendor account
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const { data: existingVendorAdmins } = await query.graph({
      entity: "vendor_admin",
      fields: ["id", "vendor.*"],
      filters: {
        customer_id: customer_id,
      },
    });

    if (existingVendorAdmins.length > 0) {
      return res.status(400).json({
        message: "You already have a vendor account",
        vendor: existingVendorAdmins[0].vendor,
      });
    }
  }

  const { result } = await createVendorWorkflow(req.scope).run({
    input: {
      vendor,
      admin: {
        ...admin,
        customer_id,
      },
      auth_identity_id,
    },
  });

  res.status(201).json({
    vendor: result.vendor,
    admin: result.vendorAdmin,
  });
};
