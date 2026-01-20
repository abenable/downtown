import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SEARCH_MODULE } from "../../../modules/search";
import MeilisearchService from "../../../modules/search/service";

// GET /store/search - Search products
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const searchService: MeilisearchService = req.scope.resolve(SEARCH_MODULE);

  const {
    q = "",
    category_id,
    vendor_id,
    min_price,
    max_price,
    limit = "20",
    offset = "0",
    sort,
  } = req.query;

  try {
    const result = await searchService.search(
      q as string,
      {
        category_id: category_id as string | undefined,
        vendor_id: vendor_id as string | undefined,
        min_price: min_price ? Number(min_price) : undefined,
        max_price: max_price ? Number(max_price) : undefined,
      },
      {
        limit: Number(limit),
        offset: Number(offset),
        sort: sort ? (sort as string).split(",") : undefined,
      }
    );

    res.json({
      products: result.hits,
      query: result.query,
      total: result.estimatedTotalHits,
      limit: result.limit,
      offset: result.offset,
      processing_time_ms: result.processingTimeMs,
    });
  } catch (error: any) {
    // If Meilisearch is not available, return empty results
    res.json({
      products: [],
      query: q,
      total: 0,
      limit: Number(limit),
      offset: Number(offset),
      error: "Search service unavailable",
    });
  }
};
