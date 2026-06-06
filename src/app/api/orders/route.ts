import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Generate a unique order number
 */
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `CMD-${year}${month}-`;

  const lastOrder = await db.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.split("-").pop() || "0");
    sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

/**
 * GET /api/orders - List orders (admin only)
 * Query params: status, search, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { ecotrackTracking: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          customer: true,
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
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des commandes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders - Create new order from storefront (public)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerWilaya,
      customerCommune,
      customerAddress,
      items,
      notes,
      shippingCost,
    } = body;

    if (!customerName || !customerPhone || !customerWilaya || !customerCommune || !customerAddress || !items?.length) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Validate items and check stock
    const orderItems: {
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

      orderItems.push({
        productId: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: product.price,
        variantId: variant.id,
      });

      totalAmount += product.price * item.quantity;
    }

    const orderNumber = await generateOrderNumber();
    const shipping = shippingCost || 0;

    // Find or create customer
    let customer = await db.customer.findFirst({
      where: { phone: customerPhone },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          wilaya: customerWilaya,
          commune: customerCommune,
          address: customerAddress,
        },
      });
    } else {
      // Update customer info
      customer = await db.customer.update({
        where: { id: customer.id },
        data: {
          name: customerName,
          wilaya: customerWilaya,
          commune: customerCommune,
          address: customerAddress,
        },
      });
    }

    // Create order with items
    const order = await db.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: "new",
        totalAmount,
        shippingCost: shipping,
        wilaya: customerWilaya,
        commune: customerCommune,
        address: customerAddress,
        phone: customerPhone,
        notes: notes || null,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
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

    // Deduct stock for each item
    for (const item of orderItems) {
      await db.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la commande" },
      { status: 500 }
    );
  }
}
