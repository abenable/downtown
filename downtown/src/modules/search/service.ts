import { MedusaService } from "@medusajs/framework/utils";

type MeilisearchOptions = {
  host: string;
  apiKey: string;
};

type ProductDocument = {
  id: string;
  title: string;
  description: string | null;
  handle: string;
  thumbnail: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  category_id: string | null;
  category_name: string | null;
  price: number;
  currency_code: string;
  created_at: string;
  updated_at: string;
};

type SearchFilters = {
  category_id?: string;
  vendor_id?: string;
  min_price?: number;
  max_price?: number;
};

type SearchResult = {
  hits: ProductDocument[];
  query: string;
  processingTimeMs: number;
  estimatedTotalHits: number;
  limit: number;
  offset: number;
};

/**
 * Meilisearch Service for product search
 */
class MeilisearchService extends MedusaService({}) {
  protected host_: string;
  protected apiKey_: string;
  protected indexName_ = "products";

  constructor(
    _dependencies: Record<string, unknown>,
    options?: MeilisearchOptions
  ) {
    super(_dependencies);
    this.host_ = options?.host || process.env.MEILISEARCH_HOST || "http://localhost:7700";
    this.apiKey_ = options?.apiKey || process.env.MEILISEARCH_API_KEY || "";
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(`${this.host_}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey_}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Meilisearch request failed" }));
      throw new Error(error.message || `Meilisearch error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Initialize the products index with settings
   */
  async initializeIndex(): Promise<void> {
    try {
      // Create index if it doesn't exist
      await this.makeRequest(`/indexes/${this.indexName_}`, "POST", {
        primaryKey: "id",
      }).catch(() => {
        // Index might already exist
      });

      // Configure searchable attributes
      await this.makeRequest(`/indexes/${this.indexName_}/settings/searchable-attributes`, "PUT",
        ["title", "description", "vendor_name", "category_name"] as unknown as Record<string, unknown>
      );

      // Configure filterable attributes
      await this.makeRequest(`/indexes/${this.indexName_}/settings/filterable-attributes`, "PUT",
        ["vendor_id", "category_id", "price"] as unknown as Record<string, unknown>
      );

      // Configure sortable attributes
      await this.makeRequest(`/indexes/${this.indexName_}/settings/sortable-attributes`, "PUT",
        ["price", "created_at"] as unknown as Record<string, unknown>
      );
    } catch (error: any) {
      console.error("Failed to initialize Meilisearch index:", error.message);
    }
  }

  /**
   * Index a product
   */
  async indexProduct(product: ProductDocument): Promise<void> {
    await this.makeRequest(`/indexes/${this.indexName_}/documents`, "POST", [product] as unknown as Record<string, unknown>);
  }

  /**
   * Index multiple products
   */
  async indexProducts(products: ProductDocument[]): Promise<void> {
    if (products.length === 0) return;
    await this.makeRequest(`/indexes/${this.indexName_}/documents`, "POST", products as unknown as Record<string, unknown>);
  }

  /**
   * Delete a product from the index
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.makeRequest(`/indexes/${this.indexName_}/documents/${productId}`, "DELETE");
  }

  /**
   * Search products
   */
  async search(
    query: string,
    filters?: SearchFilters,
    options?: { limit?: number; offset?: number; sort?: string[] }
  ): Promise<SearchResult> {
    const filterParts: string[] = [];

    if (filters?.category_id) {
      filterParts.push(`category_id = "${filters.category_id}"`);
    }
    if (filters?.vendor_id) {
      filterParts.push(`vendor_id = "${filters.vendor_id}"`);
    }
    if (filters?.min_price !== undefined) {
      filterParts.push(`price >= ${filters.min_price}`);
    }
    if (filters?.max_price !== undefined) {
      filterParts.push(`price <= ${filters.max_price}`);
    }

    const searchParams: Record<string, unknown> = {
      q: query,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    };

    if (filterParts.length > 0) {
      searchParams.filter = filterParts.join(" AND ");
    }

    if (options?.sort && options.sort.length > 0) {
      searchParams.sort = options.sort;
    }

    return this.makeRequest<SearchResult>(
      `/indexes/${this.indexName_}/search`,
      "POST",
      searchParams
    );
  }

  /**
   * Get index stats
   */
  async getStats(): Promise<{ numberOfDocuments: number; isIndexing: boolean }> {
    return this.makeRequest(`/indexes/${this.indexName_}/stats`, "GET");
  }
}

export default MeilisearchService;
export { ProductDocument, SearchFilters, SearchResult };
