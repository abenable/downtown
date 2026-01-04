import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createVendorProductWorkflow } from "../../../workflows/create-vendor-product";
import { PostVendorProductType } from "../validators";
import { HttpTypes } from "@medusajs/types";
import { getVendorFromAuth } from "../helpers";

// GET /vendors/products - List vendor's products
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { vendorId } = await getVendorFromAuth(req);

  if (!vendorId) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Get products linked to this vendor
  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "products.*",
      "products.variants.*",
      "products.variants.prices.*",
      "products.images.*",
      "products.options.*",
      "products.tags.*",
    ],
    filters: {
      id: vendorId,
    },
  });

  const vendor = vendors[0];

  res.json({
    products: vendor?.products || [],
    count: vendor?.products?.length || 0,
  });
};

// POST /vendors/products - Create a new product for vendor
export const POST = async (
  req: AuthenticatedMedusaRequest<PostVendorProductType>,
  res: MedusaResponse
) => {
  const { vendorId, isApproved, vendorStatus } = await getVendorFromAuth(req);

  if (!vendorId) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  if (!isApproved) {
    return res.status(403).json({
      message:
        vendorStatus === "pending"
          ? "Your vendor application is pending approval. You cannot add products yet."
          : "Your vendor application was rejected. You cannot add products.",
      status: vendorStatus,
    });
  }

  const { result: product } = await createVendorProductWorkflow(req.scope).run({
    input: {
      vendor_id: vendorId,
      product: req.validatedBody as unknown as HttpTypes.AdminCreateProduct,
    },
  });

  res.status(201).json({ product });
};
