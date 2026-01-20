import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /store/categories - List all active product categories
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: [
      "id",
      "name",
      "handle",
      "description",
      "is_active",
      "rank",
      "parent_category.id",
      "parent_category.name",
      "category_children.id",
      "category_children.name",
    ],
    filters: {
      is_active: true,
      is_internal: false,
    },
  });

  // Organize categories into a tree structure
  const rootCategories = categories.filter(
    (cat: any) => !cat.parent_category?.id
  );
  const categoriesWithChildren = rootCategories.map((parent: any) => ({
    ...parent,
    children: categories.filter(
      (child: any) => child.parent_category?.id === parent.id
    ),
  }));

  res.json({
    categories: categoriesWithChildren,
    flat_categories: categories,
    count: categories.length,
  });
};
