import { ExecArgs } from "@medusajs/framework/types";
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows";

export default async function updateRegionPaymentProviders({
  container,
}: ExecArgs) {
  const logger = container.resolve("logger");
  const query = container.resolve("query");

  const providers = [
    "pp_mtn-mobile-money_mtn",
    "pp_airtel-money_airtel",
  ];

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2"],
  });

  if (!regions?.length) {
    throw new Error("No regions found in database.");
  }

  const ugandaRegion = regions.find((region: any) => {
    const hasUgCountry = (region.countries || []).some(
      (country: any) => country.iso_2 === "ug"
    );

    return (
      hasUgCountry ||
      String(region.name || "").toLowerCase() === "uganda" ||
      String(region.currency_code || "").toLowerCase() === "ugx"
    );
  });

  if (!ugandaRegion) {
    throw new Error(
      "Could not find Uganda region. Seed region first, then rerun this script."
    );
  }

  logger.info(
    `Updating region ${ugandaRegion.name} (${ugandaRegion.id}) payment providers...`
  );

  await updateRegionsWorkflow(container).run({
    input: {
      selector: {
        id: ugandaRegion.id,
      },
      update: {
        payment_providers: providers,
      },
    },
  });

  logger.info(
    `Region ${ugandaRegion.name} updated with providers: ${providers.join(", ")}`
  );
}
