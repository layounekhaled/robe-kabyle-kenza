import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

/**
 * PUT /api/hero-slides/[id] - Update a hero slide (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();

    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { imageUrl, alt, sortOrder, active } = body;

    const existing = await db.heroSlide.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Slide non trouvé" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (alt !== undefined) updateData.alt = alt;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (active !== undefined) updateData.active = active;

    const slide = await db.heroSlide.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ slide });
  } catch (error) {
    console.error("Error updating hero slide:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du slide" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hero-slides/[id] - Delete a hero slide (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();

    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.heroSlide.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Slide non trouvé" },
        { status: 404 }
      );
    }

    await db.heroSlide.delete({ where: { id } });

    return NextResponse.json({ message: "Slide supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting hero slide:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du slide" },
      { status: 500 }
    );
  }
}
