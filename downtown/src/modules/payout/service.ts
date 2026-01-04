import { MedusaService } from "@medusajs/framework/utils";
import Payout from "./models/payout";

class PayoutModuleService extends MedusaService({
  Payout,
}) {}

export default PayoutModuleService;
