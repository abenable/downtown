import { MedusaService } from "@medusajs/framework/utils";
import PickupLocation from "./models/pickup-location";

class PickupLocationModuleService extends MedusaService({
  PickupLocation,
}) {}

export default PickupLocationModuleService;
