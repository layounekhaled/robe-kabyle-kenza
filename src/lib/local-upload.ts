/**
 * Local File Upload Service
 * 
 * When Supabase Storage is not configured, this service stores images
 * in the database as base64 data URLs, or falls back to local filesystem
 * for development.
 * 
 * In production (Vercel serverless): stores in database (ImageStore table)
 * In development: stores in /public/uploads/ directory
 * 
 * Note: Node.js built-ins (fs/promises, path, crypto) are imported dynamically
 * inside function bodies to avoid Turbopack resolution issues during build.
 */

/**
 * Ensure the ImageStore table exists for database-based image storage
 */
async function ensureImageStoreTable() {
  const { db } = await import("./db");
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
}

/**
 * Upload a file - stores in database for production, local fs for development
 */
export async function uploadToLocal(file: File): Promise<{
  success: boolean;
  url: string | null;
  path: string | null;
  error?: string;
}> {
  try {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        url: null,
        path: null,
        error: `Type de fichier non autorisé (${file.type}). Formats acceptés : JPG, PNG, WEBP, AVIF.`,
      };
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        success: false,
        url: null,
        path: null,
        error: `Fichier trop volumineux (${sizeMB} Mo). Taille maximum : 5 Mo.`,
      };
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Dynamically import Node.js built-ins (avoids Turbopack resolution issues)
    const crypto = await import("crypto");

    // Generate unique ID
    const id = crypto.randomUUID();

    // Check if we're in Vercel production (serverless, read-only filesystem)
    const isVercelProduction = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (isVercelProduction) {
      // Store in database for Vercel
      await ensureImageStoreTable();
      const { db } = await import("./db");
      await db.$executeRawUnsafe(
        `INSERT INTO "ImageStore" ("id", "filename", "mimeType", "data", "createdAt") VALUES ($1, $2, $3, $4, NOW())`,
        id,
        file.name,
        file.type,
        dataUrl
      );

      const publicUrl = `/api/serve-image/${id}`;
      console.log(`[DB UPLOAD] Stored: ${id} → ${publicUrl}`);

      return {
        success: true,
        url: publicUrl,
        path: id,
      };
    } else {
      // Store in local filesystem for development
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");

      const ext = file.type.split("/")[1] || "jpg";
      const uuid = crypto.randomUUID();
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      const relativePath = `${year}/${month}/${uuid}.${ext}`;
      const fullPath = path.join(uploadDir, relativePath);
      
      // Ensure directory exists
      await mkdir(path.dirname(fullPath), { recursive: true });
      await writeFile(fullPath, buffer);

      const publicUrl = `/uploads/${relativePath}`;
      console.log(`[LOCAL UPLOAD] Saved: ${fullPath} → ${publicUrl}`);

      return {
        success: true,
        url: publicUrl,
        path: relativePath,
      };
    }
  } catch (err) {
    console.error("[LOCAL UPLOAD] Error:", err);
    return {
      success: false,
      url: null,
      path: null,
      error: `Erreur d'upload : ${err instanceof Error ? err.message : "Erreur inconnue"}`,
    };
  }
}

/**
 * Check if a URL is a database-served image
 */
export function isDbImage(url: string): boolean {
  return url.startsWith("/api/serve-image/");
}

/**
 * Check if a URL is a local upload
 */
export function isLocalUpload(url: string): boolean {
  return url.startsWith("/uploads/");
}
