import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SEARCH_MODULE } from "../modules/search";
import MeilisearchService, { ProductDocument } from "../modules/search/service";

/**
 * Sync products to Meilisearch when they are created, updated, or deleted
 */
export default async function productSearchSyncHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  let searchService: MeilisearchService;
  try {
    searchService = container.resolve(SEARCH_MODULE);
  } catch {
    // Search module not available
    return;
  }

  const productId = event.data.id;
  const eventName = event.name;

  logger.info(`Product search sync: ${eventName} for product ${productId}`);

  try {
    if (eventName === "product.deleted") {
      // Remove product from index
      await searchService.deleteProduct(productId);
      logger.info(`Product ${productId} removed from search index`);
      return;
    }

    // Get product details for indexing
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "description",
        "handle",
        "thumbnail",
        "created_at",
        "updated_at",
        "variants.prices.*",
        "categories.id",
        "categories.name",
      ],
      filters: { id: productId },
    });

    const product = products[0];
    if (!product) {
      logger.warn(`Product ${productId} not found for search sync`);
      return;
    }

    // Get vendor info if linked
    let vendorId: string | null = null;
    let vendorName: string | null = null;

    try {
      const { data: vendorLinks } = await query.graph({
        entity: "vendor",
        fields: ["id", "name", "products.id"],
        filters: {},
      });

      for (const vendor of vendorLinks) {
        if (vendor.products?.some((p: any) => p.id === productId)) {
          vendorId = vendor.id;
          vendorName = vendor.name;
          break;
        }
      }
    } catch {
      // Vendor link might not exist
    }

    // Get price (use first variant's first price)
    let price = 0;
    let currencyCode = "ugx";
    if (product.variants?.[0]?.prices?.[0]) {
      price = Number(product.variants[0].prices[0].amount || 0);
      currencyCode = product.variants[0].prices[0].currency_code || "ugx";
    }

    // Build product document
    const productDoc: ProductDocument = {
      id: product.id,
      title: product.title,
      description: product.description,
      handle: product.handle,
      thumbnail: product.thumbnail,
      vendor_id: vendorId,
      vendor_name: vendorName,
      category_id: product.categories?.[0]?.id || null,
      category_name: product.categories?.[0]?.name || null,
      price,
      currency_code: currencyCode,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };

    // Index the product
    await searchService.indexProduct(productDoc);
    logger.info(`Product ${productId} indexed in search`);
  } catch (error: any) {
    logger.error(`Failed to sync product ${productId} to search: ${error.message}`);
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
};
