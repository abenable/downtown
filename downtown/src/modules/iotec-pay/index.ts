import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import IotecPayProviderService from "./service";

export default ModuleProvider(Modules.PAYMENT, {
  services: [IotecPayProviderService],
});
