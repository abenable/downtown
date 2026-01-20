import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { z } from "zod";
import { requestPayoutWorkflow } from "../../../../workflows/payout";
import { MobileNetwork } from "../../../../modules/payout/models/payout";

const RequestPayoutSchema = z.object({
  phone_number: z.string().min(10).max(15),
  network: z.enum(["mtn", "airtel"]),
  period_start: z.string().datetime().optional(),
  period_end: z.string().datetime().optional(),
});

// POST /vendors/payouts/request - Request a payout
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Validate input
  const validatedBody = RequestPayoutSchema.safeParse(req.body);
  if (!validatedBody.success) {
    return res.status(400).json({
      message: "Invalid request body",
      errors: validatedBody.error.errors,
    });
  }

  const { phone_number, network, period_start, period_end } = validatedBody.data;

  // Get vendor from auth context
  const { data: vendorAdmins } = await query.graph({
    entity: "vendor_admin",
    fields: ["vendor.id", "vendor.name", "vendor.status"],
    filters: {
      id: req.auth_context.actor_id,
    },
  });

  const vendorAdmin = vendorAdmins[0];
  if (!vendorAdmin?.vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  if (vendorAdmin.vendor.status !== "approved") {
    return res.status(403).json({
      message: "Only approved vendors can request payouts",
    });
  }

  try {
    // Run the request payout workflow
    const { result } = await requestPayoutWorkflow(req.scope).run({
      input: {
        vendor_id: vendorAdmin.vendor.id,
        phone_number,
        network: network as MobileNetwork,
        period_start: period_start ? new Date(period_start) : undefined,
        period_end: period_end ? new Date(period_end) : undefined,
      },
    });

    if (result.earnings.net_amount <= 0) {
      return res.status(400).json({
        message: "No earnings available for payout",
        earnings: result.earnings,
      });
    }

    res.status(201).json({
      message: "Payout request submitted successfully",
      payout: result.payout,
      earnings: result.earnings,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to request payout",
    });
  }
};
