import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /admin/vendors - List all vendor applications
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const status = req.query.status as string | undefined;

  const filters: Record<string, any> = {};
  if (status) {
    filters.status = status;
  }

  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "id",
      "handle",
      "name",
      "logo",
      "description",
      "phone",
      "email",
      "status",
      "rejection_reason",
      "approved_at",
      "is_active",
      "created_at",
      "admins.*",
    ],
    filters,
  });

  res.json({
    vendors,
    count: vendors.length,
  });
};
