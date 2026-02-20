import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import { MtnMobileMoneyProviderService } from "../mobile-money-payment/service";

export default ModuleProvider(Modules.PAYMENT, {
  services: [MtnMobileMoneyProviderService],
});
