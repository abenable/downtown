import {
  Modules,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils";
import { ExecArgs } from "@medusajs/framework/types";

export default async function listProviders({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  // List fulfillment providers
  const providers = await fulfillmentModuleService.listFulfillmentProviders({});
  logger.info(`Fulfillment providers: ${JSON.stringify(providers, null, 2)}`);

  // List shipping options
  const shippingOptions = await fulfillmentModuleService.listShippingOptions(
    {},
    { relations: ["type"] }
  );
  logger.info(
    `Shipping options: ${JSON.stringify(
      shippingOptions.map((o) => ({
        id: o.id,
        name: o.name,
        price_type: o.price_type,
        type: o.type,
      })),
      null,
      2
    )}`
  );
}
