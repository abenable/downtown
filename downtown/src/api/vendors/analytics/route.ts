import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { COMMISSION_MODULE } from "../../../modules/commission";
import CommissionModuleService from "../../../modules/commission/service";

// GET /vendors/analytics - Get vendor analytics
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const commissionService: CommissionModuleService =
    req.scope.resolve(COMMISSION_MODULE);

  // Get vendor from auth context
  const { data: vendorAdmins } = await query.graph({
    entity: "vendor_admin",
    fields: ["vendor.id", "vendor.orders.*", "vendor.products.*"],
    filters: {
      id: req.auth_context.actor_id,
    },
  });

  const vendorAdmin = vendorAdmins[0];
  if (!vendorAdmin?.vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  const vendorId = vendorAdmin.vendor.id;

  // Get commissions for this vendor
  const commissions = await commissionService.listCommissions({
    vendor_id: vendorId,
  });

  // Calculate analytics
  const orders = vendorAdmin.vendor.orders || [];
  const products = vendorAdmin.vendor.products || [];

  const totalRevenue = commissions.reduce(
    (sum, c) => sum + Number(c.order_total),
    0
  );
  const totalCommission = commissions.reduce(
    (sum, c) => sum + Number(c.commission_amount),
    0
  );
  const totalEarnings = commissions.reduce(
    (sum, c) => sum + Number(c.vendor_amount),
    0
  );

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
      total_commission: totalCommission,
      total_earnings: totalEarnings,
      commission_rate: 10, // Fixed 10%
      currency_code: "ugx",
      orders_by_status: ordersByStatus,
    },
    recent_orders: recentOrders,
  });
};
