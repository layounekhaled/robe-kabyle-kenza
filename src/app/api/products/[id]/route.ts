import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { initDb } from "@/lib/init-db";

/**
 * GET /api/products/[id] - Get single product with images and variants
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "admin" || session?.user?.role === "cashier";

    const where: Record<string, unknown> = { id };
    if (!isAdmin) {
      where.active = true;
    }

    const product = await db.product.findFirst({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du produit" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id] - Update product (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, fabric, featured, active, images, variants } = body;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    // Update product basic fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (fabric !== undefined) updateData.fabric = fabric;
    if (featured !== undefined) updateData.featured = featured;
    if (active !== undefined) updateData.active = active;

    // Update images if provided - delete existing and recreate
    if (images !== undefined) {
      await db.productImage.deleteMany({ where: { productId: id } });
      updateData.images = {
        create: images.map(
          (img: { url: string; alt?: string; sortOrder?: number }, index: number) => ({
            url: img.url,
            alt: img.alt || null,
            sortOrder: img.sortOrder ?? index,
          })
        ),
      };
    }

    // Update variants if provided - delete existing and recreate
    if (variants !== undefined) {
      await db.productVariant.deleteMany({ where: { productId: id } });
      updateData.variants = {
        create: variants.map(
          (v: { size: string; color: string; stock?: number }) => ({
            size: v.size,
            color: v.color,
            stock: v.stock || 0,
          })
        ),
      };
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du produit" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id] - Hard delete product (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    // Hard delete - remove product and all related data (images, variants, order items)
    // OrderItems reference the product, so we need to handle them
    await db.$transaction(async (tx) => {
      // Delete order items referencing this product first
      await tx.orderItem.deleteMany({ where: { productId: id } });
      // Delete store sale items referencing this product
      await tx.storeSaleItem.deleteMany({ where: { productId: id } });
      // Delete product images
      await tx.productImage.deleteMany({ where: { productId: id } });
      // Delete product variants
      await tx.productVariant.deleteMany({ where: { productId: id } });
      // Finally delete the product itself
      await tx.product.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Produit supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du produit" },
      { status: 500 }
    );
  }
}
