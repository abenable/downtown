import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createReviewWorkflow } from "../../../workflows/create-review";
import { z } from "zod";

export const PostStoreReviewSchema = z.object({
  content: z.string(),
  rating: z.preprocess((val) => {
    if (val && typeof val === "string") {
      return parseInt(val);
    }
    return val;
  }, z.number().min(1).max(5)),
  product_id: z.string(),
});

type PostStoreReviewReq = z.infer<typeof PostStoreReviewSchema>;

export const POST = async (
  req: AuthenticatedMedusaRequest<PostStoreReviewReq>,
  res: MedusaResponse
) => {
  const input = req.validatedBody;
  const customerId = req.auth_context?.actor_id;

  if (!customerId) {
    return res.status(401).json({
      message: "You must be logged in to submit a review",
    });
  }

  // Get customer details
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "first_name", "last_name"],
    filters: { id: customerId },
  });

  const customer = customers[0];
  if (!customer) {
    return res.status(404).json({
      message: "Customer not found",
    });
  }

  const { result } = await createReviewWorkflow(req.scope).run({
    input: {
      ...input,
      customer_id: customerId,
      first_name: customer.first_name || "Anonymous",
      last_name: customer.last_name || "",
      status: "approved",
    },
  });

  res.json(result);
};
