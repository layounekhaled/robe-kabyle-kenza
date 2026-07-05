import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWilayas, getCommunes, calculateShipping, getShippingRates, getStopDesks, getFees } from "@/lib/ecotrack";

/**
 * GET /api/ecotrack - Ecotrack API proxy
 * - No action param: Get ecotrack settings (admin)
 * - ?action=wilayas: Fetch wilayas (Ecotrack API → fallback DB locale)
 * - ?action=communes&wilayaId=X: Fetch communes (Ecotrack API → fallback DB locale)
 * - ?action=shipping&wilayaId=X: Calculate shipping (home + stop desk)
 * - ?action=rates&wilayaId=X: Get shipping rates (home + stop desk prices)
 * - ?action=fees: Get all shipping fees at once
 * - ?action=stopdesk&wilayaId=X: Get stop desks for a wilaya
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
          apiToken: settings.apiToken ? "********" : null,
          hasToken: !!settings.apiToken,
          active: settings.active,
        },
      });
    }

    // Public actions: wilayas, communes, shipping, rates, fees, stopdesk (needed for storefront)
    const publicActions = ["wilayas", "communes", "shipping", "rates", "fees", "stopdesk"];

    if (!publicActions.includes(action)) {
      const session = await getServerSession(authOptions);
      if (!session || (session.user as { role: string }).role !== "admin") {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }

    switch (action) {
      case "wilayas": {
        try {
          const wilayas = await getWilayas();
          return NextResponse.json({ wilayas });
        } catch {
          // Fallback: load wilayas from local database
          try {
            const localWilayas = await db.wilaya.findMany({
              orderBy: { code: "asc" },
            });
            return NextResponse.json({
              wilayas: localWilayas.map((w) => ({
                id: w.id,
                code: w.code,
                name: w.name,
              })),
            });
          } catch {
            return NextResponse.json({ wilayas: [] });
          }
        }
      }

      case "communes": {
        const wilayaId = searchParams.get("wilayaId");
        if (!wilayaId) {
          return NextResponse.json(
            { error: "wilayaId est requis" },
            { status: 400 }
          );
        }
        try {
          const communes = await getCommunes(parseInt(wilayaId));
          return NextResponse.json({ communes });
        } catch {
          // Fallback: load communes from local database
          try {
            let localWilaya = await db.wilaya.findFirst({
              where: { code: parseInt(wilayaId) },
            });
            if (!localWilaya) {
              localWilaya = await db.wilaya.findUnique({
                where: { id: wilayaId },
              });
            }
            if (!localWilaya) {
              return NextResponse.json({ communes: [] });
            }
            const localCommunes = await db.commune.findMany({
              where: { wilayaId: localWilaya.id },
              orderBy: { name: "asc" },
            });
            return NextResponse.json({
              communes: localCommunes.map((c) => ({
                id: c.id,
                code: c.code,
                name: c.name,
              })),
            });
          } catch {
            return NextResponse.json({ communes: [] });
          }
        }
      }

      case "fees": {
        try {
          const fees = await getFees();
          return NextResponse.json({ fees });
        } catch {
          return NextResponse.json({ fees: {} });
        }
      }

      case "shipping": {
        const wilayaId = searchParams.get("wilayaId");
        if (!wilayaId) {
          return NextResponse.json(
            { error: "wilayaId est requis" },
            { status: 400 }
          );
        }
        try {
          const shipping = await calculateShipping(parseInt(wilayaId));
          return NextResponse.json({ shipping, source: "api" });
        } catch {
          const code = parseInt(wilayaId);
          const rates = await getShippingRates(code);
          return NextResponse.json({
            shipping: { price: rates.home, prix_domicile: rates.home, prix_stopdesk: rates.stopDesk },
            source: "fallback",
          });
        }
      }

      case "rates": {
        const wilayaId = searchParams.get("wilayaId");
        if (!wilayaId) {
          return NextResponse.json(
            { error: "wilayaId est requis" },
            { status: 400 }
          );
        }
        const code = parseInt(wilayaId);
        const rates = await getShippingRates(code);
        return NextResponse.json({ rates });
      }

      case "stopdesk": {
        const wilayaId = searchParams.get("wilayaId");
        if (!wilayaId) {
          return NextResponse.json(
            { error: "wilayaId est requis" },
            { status: 400 }
          );
        }
        try {
          const stopDesks = await getStopDesks(parseInt(wilayaId));
          return NextResponse.json({ stopDesks });
        } catch {
          return NextResponse.json({ stopDesks: [] });
        }
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
      { error: "Erreur lors de la communication avec FRET.DIRECT" },
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
      { error: "Erreur lors de la mise à jour des paramètres FRET.DIRECT" },
      { status: 500 }
    );
  }
}
