import { MedusaService } from "@medusajs/framework/utils";
import Commission from "./models/commission";

class CommissionModuleService extends MedusaService({
  Commission,
}) {}

export default CommissionModuleService;
