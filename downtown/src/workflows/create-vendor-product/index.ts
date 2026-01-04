import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { linkVendorProductStep } from "./steps/link-vendor-product";
import { HttpTypes } from "@medusajs/types";

type CreateVendorProductWorkflowInput = {
  vendor_id: string;
  product: HttpTypes.AdminCreateProduct;
};

export const createVendorProductWorkflow = createWorkflow(
  "create-vendor-product-workflow",
  (input: CreateVendorProductWorkflowInput) => {
    // Transform product to ensure it has default options if variants are provided
    const productWithOptions = transform({ product: input.product }, (data) => {
      const product = { ...data.product };

      // Set status to draft by default for vendor products (vendors can publish from product page)
      if (!product.status) {
        product.status = "draft";
      }

      // If variants exist but no options, add a default option
      if (
        product.variants &&
        product.variants.length > 0 &&
        (!product.options || product.options.length === 0)
      ) {
        product.options = [
          {
            title: "Default",
            values: ["Default"],
          },
        ];

        // Add option value to each variant that doesn't have options
        product.variants = product.variants.map((variant: any) => ({
          ...variant,
          options: variant.options || { Default: "Default" },
        }));
      }

      return product;
    });

    const products = createProductsWorkflow.runAsStep({
      input: {
        products: [productWithOptions],
      },
    });

    const product = transform({ products }, (data) => data.products[0]);

    linkVendorProductStep({
      vendor_id: input.vendor_id,
      product_id: product.id,
    });

    return new WorkflowResponse(product);
  }
);
