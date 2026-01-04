import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  updateProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows";

// GET /vendors/products/:id - Get a specific product
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

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

  // Get product and verify it belongs to this vendor
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "*",
      "variants.*",
      "variants.prices.*",
      "images.*",
      "options.*",
      "options.values.*",
      "tags.*",
      "vendor.*",
    ],
    filters: {
      id,
    },
  });

  const product = products[0];

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Verify product belongs to this vendor
  if (product.vendor?.id !== vendorAdmin.vendor.id) {
    return res.status(403).json({ message: "Access denied" });
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

  // Verify ownership
  const { data: vendorAdmins } = await query.graph({
    entity: "vendor_admin",
    fields: ["vendor.products.id"],
    filters: {
      id: req.auth_context.actor_id,
    },
  });

  const vendorAdmin = vendorAdmins[0];
  const productIds = vendorAdmin?.vendor?.products?.map((p: any) => p.id) || [];

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

  // Verify ownership
  const { data: vendorAdmins } = await query.graph({
    entity: "vendor_admin",
    fields: ["vendor.products.id"],
    filters: {
      id: req.auth_context.actor_id,
    },
  });

  const vendorAdmin = vendorAdmins[0];
  const productIds = vendorAdmin?.vendor?.products?.map((p: any) => p.id) || [];

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
