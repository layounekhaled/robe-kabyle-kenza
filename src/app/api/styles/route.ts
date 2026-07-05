import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/styles - List all active style sections (public)
 * Admin sees all, public sees only active ones
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";

    const where: Record<string, unknown> = {};
    if (!admin) {
      where.active = true;
    }

    const styles = await db.styleSection.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ styles });
  } catch (error) {
    console.error("Error fetching styles:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des styles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/styles - Create a new style section (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, imageUrl, linkUrl, colorFrom, colorTo, sortOrder, active } = body;

    if (!title || !description || !imageUrl) {
      return NextResponse.json(
        { error: "Titre, description et image sont requis" },
        { status: 400 }
      );
    }

    const style = await db.styleSection.create({
      data: {
        title,
        description,
        imageUrl,
        linkUrl: linkUrl || "/catalog",
        colorFrom: colorFrom || "from-kabyle-terracotta/80",
        colorTo: colorTo || "to-kabyle-gold/80",
        sortOrder: sortOrder ?? 0,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json({ style }, { status: 201 });
  } catch (error) {
    console.error("Error creating style:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du style" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/styles - Bulk reorder styles (admin only)
 * Body: { orders: [{ id: string, sortOrder: number }] }
 */
export async function PUT(request: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { orders } = body;

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { error: "Format invalide" },
        { status: 400 }
      );
    }

    for (const item of orders) {
      await db.styleSection.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      });
    }

    return NextResponse.json({ message: "Ordre mis à jour" });
  } catch (error) {
    console.error("Error reordering styles:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'ordre" },
      { status: 500 }
    );
  }
}
