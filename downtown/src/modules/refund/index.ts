import { Module } from "@medusajs/framework/utils";
import RefundModuleService from "./service";

export const REFUND_MODULE = "refundModule";

export default Module(REFUND_MODULE, {
  service: RefundModuleService,
});
