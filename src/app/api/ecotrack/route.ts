import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWilayas, getCommunes, calculateShipping } from "@/lib/ecotrack";

/**
 * GET /api/ecotrack - Ecotrack API proxy
 * - No action param: Get ecotrack settings
 * - ?action=wilayas: Fetch wilayas from ecotrack
 * - ?action=communes&wilayaId=X: Fetch communes
 * - ?action=shipping&wilayaId=X: Calculate shipping
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // No action - return settings
    if (!action) {
      const settings = await db.ecotrackSettings.findFirst();
      if (!settings) {
        return NextResponse.json({
          configured: false,
          settings: null,
        });
      }
      return NextResponse.json({
        configured: true,
        settings: {
          id: settings.id,
          apiUrl: settings.apiUrl,
          apiToken: settings.apiToken ? "********" : null, // Don't expose full token
          hasToken: !!settings.apiToken,
          active: settings.active,
        },
      });
    }

    // Public actions: wilayas, communes, shipping (needed for storefront)
    // Admin-only actions: settings (no action param)
    const publicActions = ["wilayas", "communes", "shipping"];

    if (!publicActions.includes(action)) {
      const session = await getServerSession(authOptions);
      if (!session || (session.user as { role: string }).role !== "admin") {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }

    switch (action) {
      case "wilayas": {
        const wilayas = await getWilayas();
        return NextResponse.json({ wilayas });
      }

      case "communes": {
        const wilayaId = searchParams.get("wilayaId");
        if (!wilayaId) {
          return NextResponse.json(
            { error: "wilayaId est requis" },
            { status: 400 }
          );
        }
        const communes = await getCommunes(parseInt(wilayaId));
        return NextResponse.json({ communes });
      }

      case "shipping": {
        const wilayaId = searchParams.get("wilayaId");
        if (!wilayaId) {
          return NextResponse.json(
            { error: "wilayaId est requis" },
            { status: 400 }
          );
        }
        const shipping = await calculateShipping(parseInt(wilayaId));
        return NextResponse.json({ shipping });
      }

      default:
        return NextResponse.json(
          { error: `Action "${action}" non reconnue` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Ecotrack API error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la communication avec Ecotrack" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ecotrack - Update ecotrack settings (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { apiToken, apiUrl, active } = body;

    const existing = await db.ecotrackSettings.findFirst();

    let settings;
    if (existing) {
      const updateData: Record<string, unknown> = {};
      if (apiToken !== undefined) updateData.apiToken = apiToken;
      if (apiUrl !== undefined) updateData.apiUrl = apiUrl;
      if (active !== undefined) updateData.active = active;

      settings = await db.ecotrackSettings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      settings = await db.ecotrackSettings.create({
        data: {
          id: "ecotrack-default",
          apiToken: apiToken || "",
          apiUrl: apiUrl || "https://fret.ecotrack.dz",
          active: active !== undefined ? active : true,
        },
      });
    }

    return NextResponse.json({
      settings: {
        id: settings.id,
        apiUrl: settings.apiUrl,
        apiToken: "********",
        hasToken: !!settings.apiToken,
        active: settings.active,
      },
    });
  } catch (error) {
    console.error("Error updating ecotrack settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des paramètres Ecotrack" },
      { status: 500 }
    );
  }
}
