import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function listPaymentProviders({ container }: ExecArgs) {
  const paymentModule = container.resolve(Modules.PAYMENT);
  const logger = container.resolve("logger");

  const providers = await paymentModule.listPaymentProviders({});
  logger.info(`Payment providers: ${JSON.stringify(providers, null, 2)}`);
}
