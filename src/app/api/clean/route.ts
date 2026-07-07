import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/clean - Delete all orders and products (TEMPORARY - remove after use)
 */
export async function GET() {
  try {
    const results: Record<string, number> = {};

    // Delete in order respecting foreign keys
    results.storeSaleItems = (await db.storeSaleItem.deleteMany({})).count;
    results.storeSales = (await db.storeSale.deleteMany({})).count;
    results.orderItems = (await db.orderItem.deleteMany({})).count;
    results.orders = (await db.order.deleteMany({})).count;
    results.customers = (await db.customer.deleteMany({})).count;
    results.productImages = (await db.productImage.deleteMany({})).count;
    results.productVariants = (await db.productVariant.deleteMany({})).count;
    results.products = (await db.product.deleteMany({})).count;

    return NextResponse.json({
      message: "Base de données nettoyée avec succès",
      deleted: results,
    });
  } catch (error) {
    console.error("Clean error:", error);
    return NextResponse.json(
      { error: "Erreur lors du nettoyage", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
