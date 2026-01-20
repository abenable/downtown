import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "zod";
import { MARKETPLACE_MODULE } from "../../../modules/marketplace";

const PaymentSettingsSchema = z.object({
  payout_phone_number: z.string().min(10).max(15),
  payout_network: z.enum(["mtn", "airtel"]),
});

// GET /vendors/payment-settings - Get vendor's payment settings
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Get vendor from auth context
  const { data: vendorAdmins } = await query.graph({
    entity: "vendor_admin",
    fields: [
      "vendor.id",
      "vendor.name",
      "vendor.payout_phone_number",
      "vendor.payout_network",
    ],
    filters: {
      id: req.auth_context.actor_id,
    },
  });

  const vendorAdmin = vendorAdmins[0];
  if (!vendorAdmin?.vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  res.json({
    payment_settings: {
      payout_phone_number: vendorAdmin.vendor.payout_phone_number,
      payout_network: vendorAdmin.vendor.payout_network,
    },
  });
};

// POST /vendors/payment-settings - Update vendor's payment settings
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const marketplaceService = req.scope.resolve(MARKETPLACE_MODULE);

  // Validate input
  const validatedBody = PaymentSettingsSchema.safeParse(req.body);
  if (!validatedBody.success) {
    return res.status(400).json({
      message: "Invalid request body",
      errors: validatedBody.error.errors,
    });
  }

  const { payout_phone_number, payout_network } = validatedBody.data;

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

  // Format phone number to ensure it starts with 256
  let formattedPhone = payout_phone_number.replace(/\s/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "256" + formattedPhone.substring(1);
  }
  if (!formattedPhone.startsWith("256")) {
    formattedPhone = "256" + formattedPhone;
  }

  // Update vendor payment settings
  const updatedVendor = await marketplaceService.updateVendors({
    id: vendorAdmin.vendor.id,
    payout_phone_number: formattedPhone,
    payout_network: payout_network,
  });

  res.json({
    message: "Payment settings updated successfully",
    payment_settings: {
      payout_phone_number: updatedVendor.payout_phone_number,
      payout_network: updatedVendor.payout_network,
    },
  });
};
