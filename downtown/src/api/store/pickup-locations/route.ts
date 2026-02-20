import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PICKUP_LOCATION_MODULE } from "../../../modules/pickup-location";

/**
 * GET /store/pickup-locations
 * Retrieve all active pickup locations
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pickupLocationService = req.scope.resolve(PICKUP_LOCATION_MODULE);

  try {
    const pickupLocations = await pickupLocationService.listPickupLocations({
      is_active: true,
    });

    res.json({
      pickup_locations: pickupLocations.map((location: any) => ({
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        phone: location.phone,
        opening_hours: location.opening_hours
          ? JSON.parse(location.opening_hours)
          : null,
        metadata: location.metadata,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch pickup locations",
      error: error.message,
    });
  }
}
