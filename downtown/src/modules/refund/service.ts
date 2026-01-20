import { MedusaService } from "@medusajs/framework/utils";
import RefundRequest from "./models/refund-request";

class RefundModuleService extends MedusaService({
  RefundRequest,
}) {}

export default RefundModuleService;
