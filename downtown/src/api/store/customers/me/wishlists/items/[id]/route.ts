import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { deleteWishlistItemWorkflow } from "../../../../../../../workflows/wishlist";

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { result } = await deleteWishlistItemWorkflow(req.scope).run({
    input: {
      wishlist_item_id: req.params.id,
      customer_id: req.auth_context.actor_id,
    },
  });

  res.json({
    wishlist: result.wishlist,
  });
}
