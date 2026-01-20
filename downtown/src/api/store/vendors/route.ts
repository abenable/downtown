import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /store/vendors - List all approved vendors
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { limit = "20", offset = "0" } = req.query;

  // Get approved vendors
  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "id",
      "handle",
      "name",
      "logo",
      "description",
      "created_at",
      "products.id",
    ],
    filters: {
      status: "approved",
      is_active: true,
    },
  });

  // Map vendors with product count
  const vendorList = vendors.map((vendor: any) => ({
    id: vendor.id,
    handle: vendor.handle,
    name: vendor.name,
    logo: vendor.logo,
    description: vendor.description?.substring(0, 200), // Truncate for listing
    created_at: vendor.created_at,
    product_count: (vendor.products || []).length,
  }));

  // Sort by product count (most active first)
  vendorList.sort((a: any, b: any) => b.product_count - a.product_count);

  // Apply pagination
  const paginatedVendors = vendorList.slice(
    Number(offset),
    Number(offset) + Number(limit)
  );

  res.json({
    vendors: paginatedVendors,
    count: vendorList.length,
    limit: Number(limit),
    offset: Number(offset),
  });
};
