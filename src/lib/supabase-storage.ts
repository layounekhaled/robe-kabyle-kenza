/**
 * Supabase Storage Service
 * 
 * Centralized service for all Supabase Storage operations.
 * Handles upload, delete, URL generation, and validation.
 * 
 * Bucket: "products" (public)
 * Accepted formats: JPG, JPEG, PNG, WEBP, AVIF
 * Max file size: 5 MB
 */

import { supabase, supabaseAdmin, SUPABASE_BUCKET, isSupabaseConfigured, isSupabaseAdminConfigured } from "./supabase";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  success: boolean;
  url: string | null;
  path: string | null;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface ImageValidation {
  valid: boolean;
  error?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Validate a file before upload
 * Checks MIME type and file size
 */
export function validateImageFile(file: File): ImageValidation {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé (${file.type}). Formats acceptés : JPG, PNG, WEBP, AVIF.`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Fichier trop volumineux (${sizeMB} Mo). Taille maximum : 5 Mo.`,
    };
  }

  return { valid: true };
}

/**
 * Validate a file by its extension (fallback when MIME type is empty)
 */
export function validateImageExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_EXTENSIONS.includes(ext);
}

// ─── Upload ─────────────────────────────────────────────────────────────────

/**
 * Generate a unique file path for storage
 * Format: products/{year}/{month}/{uuid}.{ext}
 */
function generateFilePath(file: File): string {
  const ext = MIME_TO_EXT[file.type] || file.name.split(".").pop()?.toLowerCase() || "jpg";
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  return `${year}/${month}/${uuid}.${ext}`;
}

/**
 * Upload an image to Supabase Storage
 * 
 * @param file - The file to upload
 * @param onProgress - Optional progress callback (0-100)
 * @returns UploadResult with public URL on success
 */
export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  // Check configuration (server-side needs admin key for writes)
  if (!isSupabaseAdminConfigured()) {
    return {
      success: false,
      url: null,
      path: null,
      error: "Supabase admin n'est pas configuré. Vérifiez SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      url: null,
      path: null,
      error: "Supabase n'est pas configuré. Vérifiez les variables d'environnement.",
    };
  }

  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return {
      success: false,
      url: null,
      path: null,
      error: validation.error,
    };
  }

  // Generate unique path
  const filePath = generateFilePath(file);

  // Simulate progress start
  onProgress?.(10);

  try {
    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error("[SUPABASE STORAGE] Upload error:", error);
      return {
        success: false,
        url: null,
        path: null,
        error: `Erreur d'upload : ${error.message}`,
      };
    }

    onProgress?.(80);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    onProgress?.(100);

    console.log(`[SUPABASE STORAGE] Uploaded: ${data.path} → ${publicUrl}`);

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error("[SUPABASE STORAGE] Unexpected error:", err);
    return {
      success: false,
      url: null,
      path: null,
      error: `Erreur inattendue : ${err instanceof Error ? err.message : "Erreur inconnue"}`,
    };
  }
}

/**
 * Upload multiple images to Supabase Storage
 * 
 * @param files - Array of files to upload
 * @param onProgress - Optional progress callback per file (fileIndex, progress)
 * @returns Array of UploadResult, one per file
 */
export async function uploadMultipleImages(
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], (progress) => {
      onProgress?.(i, progress);
    });
    results.push(result);
  }

  return results;
}

// ─── Delete ─────────────────────────────────────────────────────────────────

/**
 * Extract the storage path from a public URL
 * 
 * Public URL format: https://{project}.supabase.co/storage/v1/object/public/products/{path}
 * We need to extract {path} from the URL
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Path format: /storage/v1/object/public/products/{year}/{month}/{uuid}.{ext}
    const pathMatch = urlObj.pathname.match(
      /\/storage\/v1\/object\/public\/products\/(.+)/
    );
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    // Fallback: if the URL is just a path (e.g., /uploads/...)
    if (url.startsWith("/")) {
      return null; // Local file, not a Supabase URL
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is a Supabase Storage URL
 */
export function isSupabaseUrl(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.includes("/storage/v1/object/public/");
  } catch {
    return url.startsWith("https://") && url.includes("supabase.co");
  }
}

/**
 * Delete an image from Supabase Storage
 * 
 * @param url - The public URL of the image to delete
 * @returns DeleteResult indicating success or failure
 */
export async function deleteImage(url: string): Promise<DeleteResult> {
  if (!isSupabaseAdminConfigured()) {
    return {
      success: false,
      error: "Supabase admin n'est pas configuré.",
    };
  }

  const path = extractPathFromUrl(url);
  if (!path) {
    // Not a Supabase URL — nothing to delete from storage
    return { success: true };
  }

  try {
    // Use admin client for deletion (bypasses RLS)
    const { error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .remove([path]);

    if (error) {
      console.error("[SUPABASE STORAGE] Delete error:", error);
      return {
        success: false,
        error: `Erreur de suppression : ${error.message}`,
      };
    }

    console.log(`[SUPABASE STORAGE] Deleted: ${path}`);
    return { success: true };
  } catch (err) {
    console.error("[SUPABASE STORAGE] Unexpected delete error:", err);
    return {
      success: false,
      error: `Erreur inattendue : ${err instanceof Error ? err.message : "Erreur inconnue"}`,
    };
  }
}

/**
 * Delete multiple images from Supabase Storage
 */
export async function deleteMultipleImages(urls: string[]): Promise<DeleteResult[]> {
  const results: DeleteResult[] = [];

  // Collect Supabase paths for batch deletion
  const pathsToDelete: string[] = [];

  for (const url of urls) {
    const path = extractPathFromUrl(url);
    if (path) {
      pathsToDelete.push(path);
    }
  }

  // Batch delete all Supabase paths at once
  if (pathsToDelete.length > 0 && isSupabaseAdminConfigured()) {
    try {
      // Use admin client for batch deletion (bypasses RLS)
      const { error } = await supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .remove(pathsToDelete);

      if (error) {
        console.error("[SUPABASE STORAGE] Batch delete error:", error);
        // Mark all as failed
        for (let i = 0; i < urls.length; i++) {
          const path = extractPathFromUrl(urls[i]);
          results.push({
            success: !path, // Non-Supabase URLs are "success" (nothing to delete)
            error: path ? `Erreur de suppression : ${error.message}` : undefined,
          });
        }
        return results;
      }

      console.log(`[SUPABASE STORAGE] Batch deleted ${pathsToDelete.length} files`);
    } catch (err) {
      console.error("[SUPABASE STORAGE] Unexpected batch delete error:", err);
    }
  }

  // All deletions successful
  for (const url of urls) {
    results.push({ success: true });
  }

  return results;
}

// ─── URL Generation ─────────────────────────────────────────────────────────

/**
 * Get the public URL for a file in the products bucket
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Generate a thumbnail URL by appending Supabase transform parameters
 * 
 * Uses Supabase Image Transformation API:
 * https://supabase.com/docs/guides/storage/image-transformations
 */
export function getThumbnailUrl(url: string, width: number = 200, height: number = 200): string {
  if (!isSupabaseUrl(url)) return url;
  return `${url}?width=${width}&height=${height}&resize=cover`;
}

/**
 * Generate an optimized image URL with quality and format settings
 */
export function getOptimizedUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number; format?: "origin" | "webp" | "avif" } = {}
): string {
  if (!isSupabaseUrl(url)) return url;

  const params = new URLSearchParams();
  if (options.width) params.set("width", String(options.width));
  if (options.height) params.set("height", String(options.height));
  if (options.quality) params.set("quality", String(options.quality));
  if (options.format) params.set("format", options.format);
  if (options.width || options.height) params.set("resize", "cover");

  const separator = url.includes("?") ? "&" : "?";
  return params.toString() ? `${url}${separator}${params.toString()}` : url;
}
