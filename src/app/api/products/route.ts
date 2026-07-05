import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteMultipleImages, isSupabaseUrl } from "@/lib/supabase-storage";

/**
 * GET /api/products - List products with optional filters
 * Query params: search, minPrice, maxPrice, size, color, inStock, featured, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "admin" || session?.user?.role === "cashier";

    const search = searchParams.get("search") || undefined;
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;
    const size = searchParams.get("size") || undefined;
    const color = searchParams.get("color") || undefined;
    const inStock = searchParams.get("inStock") === "true";
    const featured = searchParams.get("featured") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    // Non-admin users only see active products
    if (!isAdmin) {
      where.active = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) (where.price as Record<string, unknown>).gte = minPrice;
      if (maxPrice !== undefined) (where.price as Record<string, unknown>).lte = maxPrice;
    }

    if (featured) {
      where.featured = true;
    }

    if (size || color || inStock) {
      where.variants = {
        some: {
          ...(size && { size }),
          ...(color && { color }),
          ...(inStock && { stock: { gt: 0 } }),
        },
      };
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des produits" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products - Bulk delete products (admin only)
 * Body: { ids: string[] }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Veuillez fournir une liste d'IDs de produits à supprimer" },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      // Get image URLs before deleting (for Supabase cleanup)
      const imagesToDelete = await tx.productImage.findMany({
        where: { productId: { in: ids } },
        select: { url: true },
      });

      // Delete order items referencing these products
      await tx.orderItem.deleteMany({ where: { productId: { in: ids } } });
      // Delete store sale items referencing these products
      await tx.storeSaleItem.deleteMany({ where: { productId: { in: ids } } });
      // Delete product images
      await tx.productImage.deleteMany({ where: { productId: { in: ids } } });
      // Delete product variants
      await tx.productVariant.deleteMany({ where: { productId: { in: ids } } });
      // Delete the products
      await tx.product.deleteMany({ where: { id: { in: ids } } });

      // Clean up Supabase Storage images (non-blocking)
      const supabaseUrls = imagesToDelete
        .map(img => img.url)
        .filter(url => isSupabaseUrl(url));
      if (supabaseUrls.length > 0) {
        deleteMultipleImages(supabaseUrls).catch(err => {
          console.error("[STORAGE] Failed to delete some images from Supabase:", err);
        });
      }
    });

    return NextResponse.json({
      message: `${ids.length} produit${ids.length > 1 ? 's' : ''} supprimé${ids.length > 1 ? 's' : ''} avec succès`,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression des produits" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products - Create a new product (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { reference, name, description, price, fabric, featured, images, variants } = body;

    if (!reference || !name || !price) {
      return NextResponse.json(
        { error: "Référence, nom et prix sont requis" },
        { status: 400 }
      );
    }

    // Check if reference already exists
    const existing = await db.product.findUnique({ where: { reference } });
    if (existing) {
      return NextResponse.json(
        { error: "Cette référence existe déjà" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        reference,
        name,
        description: description || null,
        price: parseFloat(price),
        fabric: fabric || null,
        featured: featured || false,
        active: true,
        images: {
          create:
            images?.map((img: { url: string; alt?: string; sortOrder?: number }) => ({
              url: img.url,
              alt: img.alt || null,
              sortOrder: img.sortOrder || 0,
            })) || [],
        },
        variants: {
          create:
            variants?.map(
              (v: { size: string; color: string; stock?: number }) => ({
                size: v.size,
                color: v.color,
                stock: v.stock || 0,
              })
            ) || [],
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du produit" },
      { status: 500 }
    );
  }
}
