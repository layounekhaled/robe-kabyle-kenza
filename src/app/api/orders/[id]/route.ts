import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrder as createEcotrackOrder } from "@/lib/ecotrack";

/**
 * GET /api/orders/[id] - Get order with items (admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                reference: true,
                price: true,
                images: {
                  take: 1,
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la commande" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders/[id] - Update order status (admin)
 * If status changes to "confirmed" and ecotrack is configured, auto-create shipment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes, ecotrackTracking, paymentMethod } = body;

    const existing = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      updateData.status = status;

      // If order is being cancelled, restore stock
      if (status === "cancelled" && existing.status !== "cancelled") {
        for (const item of existing.items) {
          const variant = await db.productVariant.findUnique({
            where: {
              productId_size_color: {
                productId: item.productId,
                size: item.size,
                color: item.color,
              },
            },
          });
          if (variant) {
            await db.productVariant.update({
              where: { id: variant.id },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      // If status changes to "confirmed", try to create Ecotrack shipment
      if (status === "confirmed" && existing.status !== "confirmed") {
        try {
          const ecotrackSettings = await db.ecotrackSettings.findFirst({
            where: { active: true },
          });

          if (ecotrackSettings) {
            // Build product description
            const productDesc = existing.items
              .map((item) => `${item.product.name} (${item.size}/${item.color}) x${item.quantity}`)
              .join(", ");

            // Find wilaya code
            const wilaya = await db.wilaya.findFirst({
              where: { name: { contains: existing.wilaya } },
            });

            if (wilaya) {
              const wilayaCode = wilaya.code;

              // Try to find commune
              const commune = await db.commune.findFirst({
                where: {
                  wilayaId: wilaya.id,
                  name: { contains: existing.commune },
                },
              });

              const ecotrackResult = await createEcotrackOrder({
                nom: existing.customer.name,
                telephone: existing.phone,
                wilaya_id: wilayaCode,
                commune_id: commune?.code || 1,
                adresse: existing.address,
                prix: existing.totalAmount + existing.shippingCost,
                produit: productDesc,
                type: "livraison",
              });

              if (ecotrackResult) {
                updateData.ecotrackId =
                  ecotrackResult.id?.toString() || ecotrackResult.order_id?.toString() || null;
                updateData.ecotrackTracking =
                  ecotrackResult.tracking || ecotrackResult.tracking_number || null;
                updateData.ecotrackStatus = ecotrackResult.status || "created";
              }
            }
          }
        } catch (ecotrackError) {
          console.error("Failed to create Ecotrack shipment:", ecotrackError);
          // Don't fail the order update if Ecotrack fails
        }
      }
    }

    if (notes !== undefined) updateData.notes = notes;
    if (ecotrackTracking !== undefined) updateData.ecotrackTracking = ecotrackTracking;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                reference: true,
                images: { take: 1, orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la commande" },
      { status: 500 }
    );
  }
}
