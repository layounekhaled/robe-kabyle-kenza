import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/stats - Dashboard stats (admin only)
 * Returns: product counts, order counts, store sale counts, revenue totals, low stock alerts
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Product stats
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      totalOrders,
      newOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalStoreSales,
      totalOrderRevenue,
      totalStoreRevenue,
      lowStockVariants,
      outOfStockVariants,
    ] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { active: true } }),
      db.product.count({ where: { featured: true, active: true } }),
      db.order.count(),
      db.order.count({ where: { status: "new" } }),
      db.order.count({ where: { status: "confirmed" } }),
      db.order.count({ where: { status: "shipped" } }),
      db.order.count({ where: { status: "delivered" } }),
      db.order.count({ where: { status: "cancelled" } }),
      db.storeSale.count(),
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: "cancelled" } },
      }),
      db.storeSale.aggregate({ _sum: { totalAmount: true } }),
      db.productVariant.count({ where: { stock: { gt: 0, lte: 3 } } }),
      db.productVariant.count({ where: { stock: 0 } }),
    ]);

    // Recent orders (last 5)
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    // Low stock alerts - get products with variants that have low stock
    const lowStockAlerts = await db.productVariant.findMany({
      where: {
        stock: { lte: 3 },
        product: { active: true },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            reference: true,
          },
        },
      },
      take: 10,
      orderBy: { stock: "asc" },
    });

    // Recent store sales (last 5)
    const recentStoreSales = await db.storeSale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    const orderRevenue = totalOrderRevenue._sum.totalAmount || 0;
    const storeRevenue = totalStoreRevenue._sum.totalAmount || 0;

    return NextResponse.json({
      products: {
        total: totalProducts,
        active: activeProducts,
        featured: featuredProducts,
      },
      orders: {
        total: totalOrders,
        new: newOrders,
        confirmed: confirmedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      storeSales: {
        total: totalStoreSales,
      },
      revenue: {
        online: orderRevenue,
        store: storeRevenue,
        total: orderRevenue + storeRevenue,
      },
      stock: {
        lowStock: lowStockVariants,
        outOfStock: outOfStockVariants,
      },
      recentOrders,
      recentStoreSales,
      lowStockAlerts,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}
