import { ExecArgs } from "@medusajs/framework/types";

export default async function checkRegionPaymentProviders({ container }: ExecArgs) {
  const query = container.resolve("query");
  const logger = container.resolve("logger");

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "countries.iso_2", "payment_providers.id"],
  });

  const ugandaRegion = regions.find((region: any) =>
    (region.countries || []).some((country: any) => country.iso_2 === "ug")
  );

  if (!ugandaRegion) {
    logger.warn("Uganda region not found");
    return;
  }

  logger.info(
    `Uganda region providers: ${JSON.stringify(
      (ugandaRegion.payment_providers || []).map((p: any) => p.id)
    )}`
  );
}
