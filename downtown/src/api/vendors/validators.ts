import { z } from "zod";

export const PostVendorCreateSchema = z.object({
  vendor: z.object({
    handle: z.string().min(3).max(50),
    name: z.string().min(2).max(100),
    logo: z.string().url().optional(),
    description: z.string().max(500).optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
  admin: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
});

export type PostVendorCreateType = z.infer<typeof PostVendorCreateSchema>;

export const PostVendorProductSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  handle: z.string().optional(),
  status: z.enum(["draft", "proposed", "published", "rejected"]).optional(),
  thumbnail: z.string().url().optional(),
  images: z.array(z.object({ url: z.string().url() })).optional(),
  options: z
    .array(
      z.object({
        title: z.string(),
        values: z.array(z.string()),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        title: z.string(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        ean: z.string().optional(),
        upc: z.string().optional(),
        inventory_quantity: z.number().optional(),
        manage_inventory: z.boolean().optional(),
        allow_backorder: z.boolean().optional(),
        prices: z
          .array(
            z.object({
              amount: z.number(),
              currency_code: z.string(),
            })
          )
          .optional(),
        options: z.record(z.string()).optional(),
      })
    )
    .optional(),
  weight: z.number().optional(),
  length: z.number().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  categories: z.array(z.object({ id: z.string() })).optional(),
  collection_id: z.string().optional(),
  type_id: z.string().optional(),
  tags: z.array(z.object({ id: z.string() })).optional(),
  metadata: z.record(z.any()).optional(),
});

export type PostVendorProductType = z.infer<typeof PostVendorProductSchema>;

export const PostSupportTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(2000),
  category: z
    .enum([
      "order_issue",
      "product_issue",
      "payout_issue",
      "account_issue",
      "technical_issue",
      "other",
    ])
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  order_id: z.string().optional(),
});

export type PostSupportTicketType = z.infer<typeof PostSupportTicketSchema>;
