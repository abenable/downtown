import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function listCarts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "region_id", "email", "shipping_address.*", "items.*"],
  });
  logger.info(`Carts: ${JSON.stringify(data.slice(0, 3), null, 2)}`);
}
