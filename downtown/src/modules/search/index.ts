import { Module } from "@medusajs/framework/utils";
import MeilisearchService from "./service";

export const SEARCH_MODULE = "searchModule";

export default Module(SEARCH_MODULE, {
  service: MeilisearchService,
});
