import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /store/vendors/:handle - Get public vendor profile and products
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { handle } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Get vendor by handle
  const { data: vendors } = await query.graph({
    entity: "vendor",
    fields: [
      "id",
      "handle",
      "name",
      "logo",
      "description",
      "status",
      "created_at",
      "products.id",
      "products.title",
      "products.description",
      "products.handle",
      "products.thumbnail",
      "products.status",
      "products.variants.id",
      "products.variants.prices.*",
    ],
    filters: {
      handle,
      status: "approved",
      is_active: true,
    },
  });

  const vendor = vendors[0];
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Filter to only published products
  const products = (vendor.products || []).filter(
    (p: any) => p.status === "published"
  );

  // Get vendor stats (review count, average rating)
  let averageRating = 0;
  let reviewCount = 0;

  try {
    const { data: reviews } = await query.graph({
      entity: "review",
      fields: ["rating", "product_id"],
      filters: {},
    });

    // Filter reviews for this vendor's products
    const productIds = products.map((p: any) => p.id);
    const vendorReviews = reviews.filter((r: any) =>
      productIds.includes(r.product_id)
    );

    reviewCount = vendorReviews.length;
    if (reviewCount > 0) {
      averageRating =
        vendorReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviewCount;
    }
  } catch {
    // Reviews module might not have data
  }

  res.json({
    vendor: {
      id: vendor.id,
      handle: vendor.handle,
      name: vendor.name,
      logo: vendor.logo,
      description: vendor.description,
      created_at: vendor.created_at,
      stats: {
        product_count: products.length,
        review_count: reviewCount,
        average_rating: Math.round(averageRating * 10) / 10,
      },
    },
    products: products.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      handle: p.handle,
      thumbnail: p.thumbnail,
      price: p.variants?.[0]?.prices?.[0]?.amount || 0,
      currency_code: p.variants?.[0]?.prices?.[0]?.currency_code || "ugx",
    })),
  });
};
