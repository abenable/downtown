import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { INotificationModuleService } from "@medusajs/framework/types";

/**
 * Send email notification when an order is completed/fulfilled
 */
export default async function orderCompletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  const query = container.resolve("query");

  try {
    // Get order details
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "email", "total", "currency_code"],
      filters: {
        id: data.id,
      },
    });

    const order = orders[0];
    if (!order || !order.email) {
      return;
    }

    // Send order completed email to customer
    await notificationModuleService.createNotifications({
      to: order.email as string,
      channel: "email",
      template: "order-completed",
      data: {
        order_id: order.id,
        display_id: order.display_id,
        total: order.total,
        currency_code: order.currency_code,
      },
    });
  } catch (error) {
    console.error("Failed to send order completed notification:", error);
  }
}

export const config: SubscriberConfig = {
  event: "order.completed",
};
