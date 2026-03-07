import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { MARKETPLACE_MODULE } from "../../../modules/marketplace";
import type { UpdateVendorMeType } from "../validators";

const normalizePhoneNumber = (phone?: string | null) => {
  if (!phone) {
    return null;
  }

  const compact = phone.replace(/\s+/g, "");

  if (/^2567\d{8}$/.test(compact)) {
    return compact;
  }

  if (/^\+2567\d{8}$/.test(compact)) {
    return compact.slice(1);
  }

  if (/^07\d{8}$/.test(compact)) {
    return `256${compact.slice(1)}`;
  }

  return compact;
};

const getVendorAdmin = async (req: AuthenticatedMedusaRequest) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { actor_id, actor_type } = req.auth_context;

  if (actor_type === "customer") {
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

    return vendorAdmins[0];
  }

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

  return vendorAdmins[0];
};

// GET /vendors/me - Get current vendor info
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const vendorAdmin = await getVendorAdmin(req);

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

export const PUT = async (
  req: AuthenticatedMedusaRequest<UpdateVendorMeType>,
  res: MedusaResponse
) => {
  const vendorAdmin = await getVendorAdmin(req);

  if (!vendorAdmin?.vendor) {
    return res.status(404).json({
      message: "Vendor not found. You may need to register as a vendor first.",
    });
  }

  const marketplaceService = req.scope.resolve(MARKETPLACE_MODULE);
  const { vendor, admin } = req.validatedBody;

  const updatedVendor = await marketplaceService.updateVendors({
    id: vendorAdmin.vendor.id,
    name: vendor.name.trim(),
    description: vendor.description?.trim() || null,
    phone: normalizePhoneNumber(vendor.phone),
    email: vendor.email?.trim() || null,
  });

  let updatedVendorAdmin: any = vendorAdmin;

  if (admin) {
    updatedVendorAdmin = await marketplaceService.updateVendorAdmins({
      id: vendorAdmin.id,
      first_name: admin.first_name?.trim() || null,
      last_name: admin.last_name?.trim() || null,
      phone: normalizePhoneNumber(admin.phone),
    });
  }

  res.json({
    message: "Vendor profile updated successfully",
    vendor: updatedVendor,
    vendor_admin: {
      ...vendorAdmin,
      ...updatedVendorAdmin,
      vendor: updatedVendor,
    },
    is_vendor: true,
  });
};
