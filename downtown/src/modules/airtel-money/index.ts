import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import { AirtelMoneyProviderService } from "../mobile-money-payment/service";

export default ModuleProvider(Modules.PAYMENT, {
  services: [AirtelMoneyProviderService],
});
