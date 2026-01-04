import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http";

export type VendorStatus = "pending" | "approved" | "rejected";

export interface VendorInfo {
  vendorAdmin: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    customer_id: string | null;
    vendor: {
      id: string;
      name: string;
      handle: string;
      status: VendorStatus;
      rejection_reason: string | null;
    };
  } | null;
  vendorId: string | null;
  vendorStatus: VendorStatus | null;
  isApproved: boolean;
}

/**
 * Get vendor info from auth context, supporting both customer and vendor auth
 */
export async function getVendorFromAuth(
  req: AuthenticatedMedusaRequest
): Promise<VendorInfo> {
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
    // Find vendor by vendor_admin id
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

  const vendorStatus = vendorAdmin?.vendor?.status || null;

  return {
    vendorAdmin: vendorAdmin || null,
    vendorId: vendorAdmin?.vendor?.id || null,
    vendorStatus,
    isApproved: vendorStatus === "approved",
  };
}
