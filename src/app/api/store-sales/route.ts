import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Generate a unique sale number
 */
async function generateSaleNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `VTE-${year}${month}-`;

  const lastSale = await db.storeSale.findFirst({
    where: { saleNumber: { startsWith: prefix } },
    orderBy: { saleNumber: "desc" },
  });

  let sequence = 1;
  if (lastSale) {
    const lastSeq = parseInt(lastSale.saleNumber.split("-").pop() || "0");
    sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

/**
 * GET /api/store-sales - List store sales (admin only)
 * Query params: page, limit, paymentMethod
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const paymentMethod = searchParams.get("paymentMethod") || undefined;

    const where: Record<string, unknown> = {};
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const [sales, total] = await Promise.all([
      db.storeSale.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  reference: true,
                  images: {
                    take: 1,
                    orderBy: { sortOrder: "asc" },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.storeSale.count({ where }),
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching store sales:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des ventes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/store-sales - Create store sale (POS), auto-deduct stock
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin" && (session.user as { role: string }).role !== "cashier") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { items, paymentMethod, notes } = body;

    if (!items?.length) {
      return NextResponse.json(
        { error: "La vente doit contenir au moins un article" },
        { status: 400 }
      );
    }

    // Validate items and check stock
    const saleItems: {
      productId: string;
      size: string;
      color: string;
      quantity: number;
      unitPrice: number;
      variantId: string;
    }[] = [];

    let totalAmount = 0;

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId, active: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Produit ${item.productId} non trouvé ou inactif` },
          { status: 400 }
        );
      }

      const variant = await db.productVariant.findUnique({
        where: {
          productId_size_color: {
            productId: item.productId,
            size: item.size,
            color: item.color,
          },
        },
      });

      if (!variant) {
        return NextResponse.json(
          { error: `Variante ${item.size}/${item.color} non disponible pour ${product.name}` },
          { status: 400 }
        );
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour ${product.name} (${item.size}/${item.color}). Disponible: ${variant.stock}` },
          { status: 400 }
        );
      }

      saleItems.push({
        productId: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: product.price,
        variantId: variant.id,
      });

      totalAmount += product.price * item.quantity;
    }

    const saleNumber = await generateSaleNumber();

    // Create store sale
    const sale = await db.storeSale.create({
      data: {
        saleNumber,
        totalAmount,
        paymentMethod: paymentMethod || "cash",
        notes: notes || null,
        soldBy: session.user?.name || "Unknown",
        items: {
          create: saleItems.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
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

    // Deduct stock for each item
    for (const item of saleItems) {
      await db.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    console.error("Error creating store sale:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la vente" },
      { status: 500 }
    );
  }
}
