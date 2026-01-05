import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { INotificationModuleService } from "@medusajs/framework/types";
import { MARKETPLACE_MODULE } from "../modules/marketplace";
import MarketplaceModuleService from "../modules/marketplace/service";

/**
 * Send email notification when a vendor is approved
 */
export default async function vendorApprovedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  const marketplaceService: MarketplaceModuleService =
    container.resolve(MARKETPLACE_MODULE);

  try {
    // Get vendor details with admin contact info
    const vendor = await marketplaceService.retrieveVendor(data.id, {
      relations: ["admins"],
    });

    if (!vendor) {
      return;
    }

    // Get the primary admin's email
    const adminEmail = vendor.admins?.[0]?.email || vendor.email;

    if (!adminEmail) {
      console.warn(`No email found for vendor ${vendor.id}`);
      return;
    }

    // Send approval notification email
    await notificationModuleService.createNotifications({
      to: adminEmail,
      channel: "email",
      template: "vendor-approved",
      data: {
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        vendor_handle: vendor.handle,
        dashboard_url: `${
          process.env.STOREFRONT_URL || "http://localhost:8000"
        }/vendor/dashboard`,
      },
    });
  } catch (error) {
    console.error("Failed to send vendor approved notification:", error);
  }
}

export const config: SubscriberConfig = {
  event: "vendor.approved",
};
