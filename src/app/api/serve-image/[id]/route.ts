import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/serve-image/[id] - Serve an image stored in the database
 * 
 * This route is used when Supabase Storage is not configured.
 * Images are stored as base64 data URLs in the ImageStore table.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await import("@/lib/db");

    // Ensure table exists
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ImageStore" (
          "id" TEXT NOT NULL,
          "filename" TEXT NOT NULL,
          "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
          "data" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ImageStore_pkey" PRIMARY KEY ("id")
        );
      `);
    } catch {
      // Table may already exist
    }

    // Fetch image data from database
    const rows = await db.$queryRawUnsafe<{
      id: string;
      filename: string;
      mimeType: string;
      data: string;
    }[]>(
      `SELECT "id", "filename", "mimeType", "data" FROM "ImageStore" WHERE "id" = $1`,
      id
    );

    if (!rows || rows.length === 0) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const image = rows[0];
    
    // Parse the base64 data URL
    const dataUrl = image.data;
    const matches = dataUrl.match(/^data:(.+?);base64,(.+)$/);
    
    if (!matches) {
      return new NextResponse("Invalid image data", { status: 500 });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${image.filename}"`,
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Error serving image", { status: 500 });
  }
}
