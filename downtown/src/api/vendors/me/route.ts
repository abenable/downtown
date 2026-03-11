import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MARKETPLACE_MODULE } from "../../../modules/marketplace";
import type MarketplaceModuleService from "../../../modules/marketplace/service";
import { getVendorFromAuth } from "../helpers";
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

// GET /vendors/me - Get current vendor info
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { vendorAdmin } = await getVendorFromAuth(req);

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
  const { vendorAdmin } = await getVendorFromAuth(req);

  if (!vendorAdmin?.vendor) {
    return res.status(404).json({
      message: "Vendor not found. You may need to register as a vendor first.",
    });
  }

  const marketplaceService: MarketplaceModuleService =
    req.scope.resolve(MARKETPLACE_MODULE);
  const { vendor, admin } = req.validatedBody;

  const vendorUpdate: Record<string, string | null> = {
    id: vendorAdmin.vendor.id,
    name: vendor.name,
  };

  if ("description" in vendor) {
    vendorUpdate.description = vendor.description == null ? null : vendor.description;
  }

  if ("phone" in vendor) {
    vendorUpdate.phone = normalizePhoneNumber(vendor.phone);
  }

  if ("email" in vendor) {
    vendorUpdate.email = vendor.email == null ? null : vendor.email;
  }

  const updatedVendor = await marketplaceService.updateVendors(vendorUpdate);

  let updatedVendorAdmin: any = vendorAdmin;

  if (admin) {
    const adminUpdate: Record<string, string | null> = {
      id: vendorAdmin.id,
    };

    if ("first_name" in admin) {
      adminUpdate.first_name = admin.first_name == null ? null : admin.first_name;
    }

    if ("last_name" in admin) {
      adminUpdate.last_name = admin.last_name == null ? null : admin.last_name;
    }

    if ("phone" in admin) {
      adminUpdate.phone = normalizePhoneNumber(admin.phone);
    }

    if (Object.keys(adminUpdate).length > 1) {
      updatedVendorAdmin = await marketplaceService.updateVendorAdmins(adminUpdate);
    }
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
