import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export const GetAdminReviewsSchema = createFindParams();

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

  // Build filters from query params
  const filters: Record<string, unknown> = {};
  const queryFilters = req.query.filters as Record<string, string> | undefined;

  if (queryFilters?.product_id) {
    filters.product_id = queryFilters.product_id;
  }

  const {
    data: reviews,
    metadata: { count, take, skip } = {
      count: 0,
      take: 20,
      skip: 0,
    },
  } = await query.graph({
    entity: "review",
    fields: req.queryConfig?.fields ?? [
      "id",
      "title",
      "content",
      "rating",
      "first_name",
      "last_name",
      "product_id",
      "customer_id",
      "created_at",
      "updated_at",
    ],
    filters,
    pagination: req.queryConfig?.pagination,
  });

  res.json({
    reviews,
    count,
    limit: take,
    offset: skip,
  });
};
