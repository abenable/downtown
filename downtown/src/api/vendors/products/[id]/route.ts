import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  updateProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { getVendorFromAuth } from "../../helpers";

// GET /vendors/products/:id - Get a specific product
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { vendorId } = await getVendorFromAuth(req);

  if (!vendorId) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Get vendor's products to verify ownership and get product details
  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "products.*",
      "products.variants.*",
      "products.variants.prices.*",
      "products.images.*",
      "products.options.*",
      "products.options.values.*",
      "products.tags.*",
    ],
    filters: {
      id: vendorId,
    },
  });

  const vendor = vendors[0];
  const product = vendor?.products?.find((p: any) => p.id === id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ product });
};

// PUT /vendors/products/:id - Update a product
export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { vendorId } = await getVendorFromAuth(req);

  if (!vendorId) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Verify ownership by checking vendor's products
  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: ["products.id"],
    filters: {
      id: vendorId,
    },
  });

  const vendor = vendors[0];
  const productIds = vendor?.products?.map((p: any) => p.id) || [];

  if (!productIds.includes(id)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const { result } = await updateProductsWorkflow(req.scope).run({
    input: {
      selector: { id },
      update: req.body as any,
    },
  });

  res.json({ product: result[0] });
};

// DELETE /vendors/products/:id - Delete a product
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { vendorId } = await getVendorFromAuth(req);

  if (!vendorId) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Verify ownership by checking vendor's products
  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: ["products.id"],
    filters: {
      id: vendorId,
    },
  });

  const vendor = vendors[0];
  const productIds = vendor?.products?.map((p: any) => p.id) || [];

  if (!productIds.includes(id)) {
    return res.status(403).json({ message: "Access denied" });
  }

  await deleteProductsWorkflow(req.scope).run({
    input: {
      ids: [id],
    },
  });

  res.status(200).json({
    id,
    object: "product",
    deleted: true,
  });
};
