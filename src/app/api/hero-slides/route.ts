import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

/**
 * GET /api/hero-slides - List all active hero slides (public)
 * Admin sees all, public sees only active ones
 */
export async function GET(request: NextRequest) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";

    const where: Record<string, unknown> = {};
    if (!admin) {
      where.active = true;
    }

    const slides = await db.heroSlide.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ slides });
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des slides" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hero-slides - Create a new hero slide (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, alt, sortOrder, active } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "L'image est requise" },
        { status: 400 }
      );
    }

    const slide = await db.heroSlide.create({
      data: {
        imageUrl,
        alt: alt || "Robe Kabyle",
        sortOrder: sortOrder ?? 0,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json({ slide }, { status: 201 });
  } catch (error) {
    console.error("Error creating hero slide:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du slide" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/hero-slides - Bulk reorder slides (admin only)
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

    // Support both bulk reorder and single update
    if (body.orders && Array.isArray(body.orders)) {
      for (const item of body.orders) {
        await db.heroSlide.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        });
      }
      return NextResponse.json({ message: "Ordre mis à jour" });
    }

    return NextResponse.json(
      { error: "Format invalide" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error reordering hero slides:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'ordre" },
      { status: 500 }
    );
  }
}
