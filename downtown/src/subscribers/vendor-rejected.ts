import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { INotificationModuleService } from "@medusajs/framework/types";
import { MARKETPLACE_MODULE } from "../modules/marketplace";
import MarketplaceModuleService from "../modules/marketplace/service";

/**
 * Send email notification when a vendor is rejected
 */
export default async function vendorRejectedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; reason: string }>) {
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

    // Send rejection notification email
    await notificationModuleService.createNotifications({
      to: adminEmail,
      channel: "email",
      template: "vendor-rejected",
      data: {
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        rejection_reason: data.reason,
        support_email:
          process.env.SUPPORT_EMAIL || "support@campusdowntown.com",
      },
    });
  } catch (error) {
    console.error("Failed to send vendor rejected notification:", error);
  }
}

export const config: SubscriberConfig = {
  event: "vendor.rejected",
};
