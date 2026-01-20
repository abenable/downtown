import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Seed marketplace product categories for Downtown
 * Run with: npx medusa exec src/scripts/seed-categories.ts
 */
export default async function seedCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Checking existing categories...");

  // Check if we already have marketplace categories
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"],
  });

  // Check if Electronics category exists (our marker for seeded data)
  const hasMarketplaceCategories = existingCategories.some(
    (cat: any) => cat.handle === "electronics"
  );

  if (hasMarketplaceCategories) {
    logger.info(`Found existing marketplace categories. Skipping seeding.`);
    existingCategories.forEach((cat: any) => {
      logger.info(`  - ${cat.name} (${cat.handle})`);
    });
    return;
  }

  logger.info("Seeding Downtown marketplace categories...");

  // Main categories for a campus/downtown marketplace
  const { result: mainCategories } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Electronics",
          handle: "electronics",
          is_active: true,
          is_internal: false,
        },
        {
          name: "Fashion",
          handle: "fashion",
          is_active: true,
          is_internal: false,
        },
        {
          name: "Books & Stationery",
          handle: "books-stationery",
          is_active: true,
          is_internal: false,
        },
        {
          name: "Food & Beverages",
          handle: "food-beverages",
          is_active: true,
          is_internal: false,
        },
        {
          name: "Health & Beauty",
          handle: "health-beauty",
          is_active: true,
          is_internal: false,
        },
        {
          name: "Home & Living",
          handle: "home-living",
          is_active: true,
          is_internal: false,
        },
        {
          name: "Sports & Fitness",
          handle: "sports-fitness",
          is_active: true,
          is_internal: false,
        },
        {
          name: "Services",
          handle: "services",
          is_active: true,
          is_internal: false,
        },
      ],
    },
  });

  logger.info(`Created ${mainCategories.length} main categories`);

  // Create subcategories for Electronics
  const electronicsCategory = mainCategories.find(
    (cat) => cat.handle === "electronics"
  );
  if (electronicsCategory) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: "Phones & Accessories",
            handle: "phones-accessories",
            parent_category_id: electronicsCategory.id,
            is_active: true,
          },
          {
            name: "Laptops & Computers",
            handle: "laptops-computers",
            parent_category_id: electronicsCategory.id,
            is_active: true,
          },
          {
            name: "Audio & Headphones",
            handle: "audio-headphones",
            parent_category_id: electronicsCategory.id,
            is_active: true,
          },
          {
            name: "Gaming",
            handle: "gaming",
            parent_category_id: electronicsCategory.id,
            is_active: true,
          },
        ],
      },
    });
  }

  // Create subcategories for Fashion
  const fashionCategory = mainCategories.find(
    (cat) => cat.handle === "fashion"
  );
  if (fashionCategory) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: "Men's Clothing",
            handle: "mens-clothing",
            parent_category_id: fashionCategory.id,
            is_active: true,
          },
          {
            name: "Women's Clothing",
            handle: "womens-clothing",
            parent_category_id: fashionCategory.id,
            is_active: true,
          },
          {
            name: "Shoes & Footwear",
            handle: "shoes-footwear",
            parent_category_id: fashionCategory.id,
            is_active: true,
          },
          {
            name: "Bags & Accessories",
            handle: "bags-accessories",
            parent_category_id: fashionCategory.id,
            is_active: true,
          },
        ],
      },
    });
  }

  // Create subcategories for Books & Stationery
  const booksCategory = mainCategories.find(
    (cat) => cat.handle === "books-stationery"
  );
  if (booksCategory) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: "Textbooks",
            handle: "textbooks",
            parent_category_id: booksCategory.id,
            is_active: true,
          },
          {
            name: "Novels & Fiction",
            handle: "novels-fiction",
            parent_category_id: booksCategory.id,
            is_active: true,
          },
          {
            name: "Stationery & Supplies",
            handle: "stationery-supplies",
            parent_category_id: booksCategory.id,
            is_active: true,
          },
        ],
      },
    });
  }

  // Create subcategories for Food & Beverages
  const foodCategory = mainCategories.find(
    (cat) => cat.handle === "food-beverages"
  );
  if (foodCategory) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: "Snacks",
            handle: "snacks",
            parent_category_id: foodCategory.id,
            is_active: true,
          },
          {
            name: "Drinks",
            handle: "drinks",
            parent_category_id: foodCategory.id,
            is_active: true,
          },
          {
            name: "Fresh & Organic",
            handle: "fresh-organic",
            parent_category_id: foodCategory.id,
            is_active: true,
          },
        ],
      },
    });
  }

  logger.info("✅ Successfully seeded Downtown marketplace categories!");
}
