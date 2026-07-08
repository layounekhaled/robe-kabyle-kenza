import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage, validateImageFile, deleteImage, isSupabaseUrl, UploadResult } from "@/lib/supabase-storage";
import { isSupabaseConfigured, isSupabaseAdminConfigured } from "@/lib/supabase";
import { uploadToLocal } from "@/lib/local-upload";

interface ImageUploadResult extends UploadResult {
  name?: string;
  size?: number;
  type?: string;
}

/**
 * POST /api/images - Upload image(s) to Supabase Storage or local filesystem
 * 
 * When Supabase is not configured, falls back to local file storage
 * in /public/uploads/ directory.
 * 
 * Accepts FormData with:
 * - file: Single file upload
 * - files: Multiple files upload
 * 
 * Returns: { url, path, name, size, type } for single upload
 *          { results: [...] } for multiple upload
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const supabaseReady = isSupabaseConfigured() && isSupabaseAdminConfigured();

    const formData = await request.formData();

    // Check for multiple files upload
    const files: File[] = [];
    const singleFile = formData.get("file") as File | null;
    
    if (singleFile) {
      files.push(singleFile);
    }

    // Also check for multiple files via "files" key
    const formDataEntries = formData.getAll("files");
    for (const entry of formDataEntries) {
      if (entry instanceof File) {
        files.push(entry);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Upload each file
    const results: ImageUploadResult[] = [];
    for (const file of files) {
      // Validate
      const validation = validateImageFile(file);
      if (!validation.valid) {
        results.push({
          success: false,
          url: null,
          path: null,
          error: validation.error,
          name: file.name,
        });
        continue;
      }

      if (supabaseReady) {
        // Upload to Supabase
        const result = await uploadImage(file);
        results.push({
          ...result,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      } else {
        // Fallback: upload to local filesystem
        const result = await uploadToLocal(file);
        results.push({
          ...result,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }
    }

    // Single file upload — return single result
    if (files.length === 1 && singleFile) {
      const result = results[0];
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({
        url: result.url,
        path: result.path,
        name: result.name,
        size: result.size,
        type: result.type,
      }, { status: 201 });
    }

    // Multiple files — return array
    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload de l'image" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/images - Delete an image from Supabase Storage or local filesystem
 * 
 * Body: { url: string }
 * Returns: { success: boolean }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL requise" },
        { status: 400 }
      );
    }

    // Only delete from Supabase Storage if it's a Supabase URL
    if (isSupabaseUrl(url)) {
      const result = await deleteImage(url);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'image" },
      { status: 500 }
    );
  }
}
