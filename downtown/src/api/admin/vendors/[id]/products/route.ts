import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // First, get the vendor to make sure they exist
    const { data: vendors } = await query.graph({
      entity: "vendor",
      filters: {
        id: id,
      },
      fields: ["id", "name"],
    });

    if (!vendors || vendors.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Get products linked to this vendor
    const { data: vendorProducts } = await query.graph({
      entity: "vendor",
      filters: {
        id: id,
      },
      fields: [
        "id",
        "products.*",
        "products.variants.*",
        "products.variants.prices.*",
      ],
    });

    const products = vendorProducts[0]?.products || [];

    res.json({ products });
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    res.status(500).json({ message: "Failed to fetch vendor products" });
  }
};
