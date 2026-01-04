import { MedusaService } from "@medusajs/framework/utils";
import SupportTicket from "./models/support-ticket";

class SupportModuleService extends MedusaService({
  SupportTicket,
}) {}

export default SupportModuleService;
