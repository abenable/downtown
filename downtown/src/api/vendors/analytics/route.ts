import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

const PLATFORM_FEE_RATE = 10; // 10% platform fee

// GET /vendors/analytics - Get vendor analytics
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Get vendor from auth context with order details
  const { data: vendorAdmins } = await query.graph({
    entity: "vendor_admin",
    fields: [
      "vendor.id",
      "vendor.orders.*",
      "vendor.orders.total",
      "vendor.orders.tax_total",
      "vendor.orders.currency_code",
      "vendor.products.*",
    ],
    filters: {
      id: req.auth_context.actor_id,
    },
  });

  const vendorAdmin = vendorAdmins[0];
  if (!vendorAdmin?.vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  // Calculate analytics from orders
  const orders = vendorAdmin.vendor.orders || [];
  const products = vendorAdmin.vendor.products || [];

  // Calculate totals from order data
  // tax_total includes platform fee calculated by our tax provider
  const totalRevenue = orders.reduce(
    (sum: number, order: any) => sum + Number(order.total || 0),
    0
  );

  // Platform fee is included in tax_total from our tax provider
  const totalPlatformFee = orders.reduce(
    (sum: number, order: any) => sum + Number(order.tax_total || 0),
    0
  );

  // Vendor earnings = total revenue - platform fee
  const totalEarnings = totalRevenue - totalPlatformFee;

  // Group by status
  const ordersByStatus = orders.reduce(
    (acc: Record<string, number>, order: any) => {
      const status = order.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {}
  );

  // Recent orders (last 30 days placeholder - in production, filter by date)
  const recentOrders = orders.slice(0, 10);

  res.json({
    analytics: {
      total_orders: orders.length,
      total_products: products.length,
      total_revenue: totalRevenue,
      platform_fee: totalPlatformFee,
      total_earnings: totalEarnings,
      platform_fee_rate: PLATFORM_FEE_RATE,
      currency_code: orders[0]?.currency_code || "ugx",
      orders_by_status: ordersByStatus,
    },
    recent_orders: recentOrders,
  });
};
