import { Module } from "@medusajs/framework/utils";
import PickupLocationModuleService from "./service";

export const PICKUP_LOCATION_MODULE = "pickupLocation";

export default Module(PICKUP_LOCATION_MODULE, {
  service: PickupLocationModuleService,
});
