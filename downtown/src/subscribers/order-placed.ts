import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { INotificationModuleService } from "@medusajs/framework/types";

/**
 * Send email notification when an order is placed
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  const query = container.resolve("query");

  try {
    // Get order details with customer info
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "total",
        "currency_code",
        "items.*",
        "shipping_address.*",
      ],
      filters: {
        id: data.id,
      },
    });

    const order = orders[0];
    if (!order || !order.email) {
      return;
    }

    // Send order confirmation email to customer
    await notificationModuleService.createNotifications({
      to: order.email as string,
      channel: "email",
      template: "order-placed",
      data: {
        order_id: order.id,
        display_id: order.display_id,
        total: order.total,
        currency_code: order.currency_code,
        items: order.items,
        shipping_address: order.shipping_address,
      },
    });
  } catch (error) {
    console.error("Failed to send order placed notification:", error);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
