import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/styles/[id] - Get single style section
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const style = await db.styleSection.findUnique({ where: { id } });

    if (!style) {
      return NextResponse.json(
        { error: "Style non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ style });
  } catch (error) {
    console.error("Error fetching style:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du style" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/styles/[id] - Update a style section (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, imageUrl, linkUrl, colorFrom, colorTo, sortOrder, active } = body;

    const existing = await db.styleSection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Style non trouvé" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (colorFrom !== undefined) updateData.colorFrom = colorFrom;
    if (colorTo !== undefined) updateData.colorTo = colorTo;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (active !== undefined) updateData.active = active;

    const style = await db.styleSection.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ style });
  } catch (error) {
    console.error("Error updating style:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du style" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/styles/[id] - Delete a style section (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.styleSection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Style non trouvé" },
        { status: 404 }
      );
    }

    await db.styleSection.delete({ where: { id } });

    return NextResponse.json({ message: "Style supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting style:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du style" },
      { status: 500 }
    );
  }
}
