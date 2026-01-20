import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import DowntownFulfillmentService from "./service";

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [DowntownFulfillmentService],
});

export const DOWNTOWN_FULFILLMENT_ID = "downtown-fulfillment";
