"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  GripVertical,
  Star,
  Loader2,
  AlertCircle,
  ImagePlus,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { validateImageFile } from "@/lib/supabase-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ImageItem {
  id: string; // Local unique ID for drag tracking
  url: string;
  alt?: string;
  sortOrder: number;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadError?: string;
  file?: File; // Temporary reference while uploading
}

interface ImageUploaderProps {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[] | ((prev: ImageItem[]) => ImageItem[])) => void;
  maxFiles?: number;
  disabled?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let imageIdCounter = 0;
function generateLocalId(): string {
  return `img-${Date.now()}-${++imageIdCounter}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ImageUploader({
  images,
  onImagesChange,
  maxFiles = 10,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItemRef = useRef<number | null>(null);

  // ── Upload a single file to /api/images ──
  // Uses FUNCTIONAL state update (prev => ...) to avoid stale closure over `images`

  const uploadFile = useCallback(
    async (file: File, localId: string) => {
      // Client-side validation
      const validation = validateImageFile(file);
      if (!validation.valid) {
        onImagesChange((prev: ImageItem[]) =>
          prev.map((img) =>
            img.id === localId
              ? { ...img, isUploading: false, uploadError: validation.error }
              : img
          )
        );
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/images", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erreur serveur (${response.status})`);
        }

        const data = await response.json();

        // Replace the temporary blob URL with the real uploaded URL
        onImagesChange((prev: ImageItem[]) =>
          prev.map((img) =>
            img.id === localId
              ? {
                  ...img,
                  url: data.url,
                  isUploading: false,
                  uploadProgress: 100,
                  file: undefined,
                }
              : img
          )
        );
      } catch (err) {
        onImagesChange((prev: ImageItem[]) =>
          prev.map((img) =>
            img.id === localId
              ? {
                  ...img,
                  isUploading: false,
                  uploadError:
                    err instanceof Error ? err.message : "Erreur d'upload",
                }
              : img
          )
        );
      }
    },
    [onImagesChange] // ← NO `images` dependency — avoids stale closure
  );

  // ── Handle file selection / drop ──

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setGlobalError(null);

      const fileArray = Array.from(files);
      const remaining = maxFiles - images.length;

      if (fileArray.length > remaining) {
        setGlobalError(
          `Vous pouvez ajouter au maximum ${maxFiles} images. ${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.`
        );
        fileArray.splice(remaining);
      }

      const newImages: ImageItem[] = fileArray.map((file, index) => {
        const localId = generateLocalId();
        return {
          id: localId,
          url: URL.createObjectURL(file),
          alt: file.name,
          sortOrder: images.length + index,
          isUploading: true,
          uploadProgress: 0,
          file,
        };
      });

      // Add new images to state
      onImagesChange([...images, ...newImages]);

      // Start uploading each file (uploadFile uses functional updates, so no stale closure)
      newImages.forEach((img) => {
        if (img.file) {
          uploadFile(img.file, img.id);
        }
      });
    },
    [images, maxFiles, onImagesChange, uploadFile]
  );

  // ── Drag and drop for file upload ──

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      // Check if this is a file drop (not a reordering drag)
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [disabled, handleFiles]
  );

  // ── Reordering drag ──

  const handleReorderDragStart = useCallback((index: number) => {
    dragItemRef.current = index;
  }, []);

  const handleReorderDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragItemRef.current === null) return;
      setDragOverIndex(index);
    },
    []
  );

  const handleReorderDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverIndex(null);

      const sourceIndex = dragItemRef.current;
      if (sourceIndex === null || sourceIndex === targetIndex) return;

      const reordered = [...images];
      const [movedItem] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, movedItem);

      // Update sortOrder
      const updated = reordered.map((img, i) => ({
        ...img,
        sortOrder: i,
      }));

      onImagesChange(updated);
      dragItemRef.current = null;
    },
    [images, onImagesChange]
  );

  const handleReorderDragEnd = useCallback(() => {
    dragItemRef.current = null;
    setDragOverIndex(null);
  }, []);

  // ── Actions ──

  const removeImage = useCallback(
    (id: string) => {
      const imageToRemove = images.find((img) => img.id === id);
      if (imageToRemove?.url && !imageToRemove.isUploading) {
        // Delete from storage if it's an uploaded image
        fetch("/api/images", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: imageToRemove.url }),
        }).catch((err) => {
          console.error("[ImageUploader] Failed to delete image from storage:", err);
        });
      }

      // Revoke object URL to free memory
      if (imageToRemove?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      const updated = images
        .filter((img) => img.id !== id)
        .map((img, i) => ({ ...img, sortOrder: i }));
      onImagesChange(updated);
    },
    [images, onImagesChange]
  );

  const setMainImage = useCallback(
    (id: string) => {
      const index = images.findIndex((img) => img.id === id);
      if (index <= 0) return;

      const reordered = [...images];
      const [item] = reordered.splice(index, 1);
      reordered.unshift(item);

      const updated = reordered.map((img, i) => ({
        ...img,
        sortOrder: i,
      }));
      onImagesChange(updated);
    },
    [images, onImagesChange]
  );

  const addUrlImage = useCallback(
    (url: string) => {
      if (!url.trim()) return;
      const newImage: ImageItem = {
        id: generateLocalId(),
        url: url.trim(),
        sortOrder: images.length,
      };
      onImagesChange([...images, newImage]);
    },
    [images, onImagesChange]
  );

  const retryUpload = useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id);
      if (image?.file) {
        onImagesChange((prev: ImageItem[]) =>
          prev.map((img) =>
            img.id === id
              ? { ...img, isUploading: true, uploadProgress: 0, uploadError: undefined }
              : img
          )
        );
        uploadFile(image.file, id);
      }
    },
    [images, onImagesChange, uploadFile]
  );

  // ── Render ──

  return (
    <div className="space-y-4">
      {/* Global error */}
      {globalError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {globalError}
          <button
            onClick={() => setGlobalError(null)}
            className="ml-auto text-destructive/50 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className={cn(
              "rounded-full p-3 transition-colors",
              isDragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {isDragging ? (
              <ImagePlus className="h-8 w-8" />
            ) : (
              <Upload className="h-8 w-8" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragging ? "Déposez les images ici" : "Glissez-déposez des images ici"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ou cliquez pour sélectionner • JPG, PNG, WEBP, AVIF • Max 5 Mo
            </p>
          </div>
        </div>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable={!image.isUploading && !disabled}
              onDragStart={() => handleReorderDragStart(index)}
              onDragOver={(e) => handleReorderDragOver(e, index)}
              onDrop={(e) => handleReorderDrop(e, index)}
              onDragEnd={handleReorderDragEnd}
              className={cn(
                "group relative aspect-square rounded-lg border-2 overflow-hidden transition-all",
                index === 0
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/30",
                dragOverIndex === index && "border-primary bg-primary/5",
                image.uploadError && "border-destructive",
                image.isUploading && "opacity-80"
              )}
            >
              {/* Image */}
              <Image
                src={image.url}
                alt={image.alt || `Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                unoptimized={image.url.startsWith("blob:")}
              />

              {/* Upload progress overlay */}
              {image.isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <Progress
                    value={image.uploadProgress}
                    className="w-3/4 h-1.5"
                  />
                  <span className="text-xs text-muted-foreground">
                    Upload en cours...
                  </span>
                </div>
              )}

              {/* Error overlay */}
              {image.uploadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-2 text-center">
                  <AlertCircle className="h-5 w-5 text-destructive mb-1" />
                  <span className="text-[10px] text-destructive leading-tight line-clamp-3">
                    {image.uploadError}
                  </span>
                  {image.file && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 h-6 text-[10px] px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        retryUpload(image.id);
                      }}
                    >
                      Réessayer
                    </Button>
                  )}
                </div>
              )}

              {/* Main image badge */}
              {index === 0 && !image.isUploading && (
                <div className="absolute top-1 left-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm">
                  Principale
                </div>
              )}

              {/* Drag handle + action buttons */}
              {!image.isUploading && !disabled && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-1 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/20"
                    title="Glisser pour réordonner"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-white" />
                  </div>

                  <div className="flex items-center gap-0.5">
                    {index > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMainImage(image.id);
                        }}
                        className="p-1 rounded hover:bg-white/20 transition-colors"
                        title="Définir comme image principale"
                      >
                        <Star className="h-3.5 w-3.5 text-white" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                      className="p-1 rounded hover:bg-destructive/80 transition-colors"
                      title="Supprimer l'image"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
          <ImageIcon className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">Aucune image ajoutée</p>
          <p className="text-xs mt-1">
            Glissez-déposez ou cliquez sur la zone ci-dessus
          </p>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        {images.length}/{maxFiles} images • Glissez pour réordonner •{" "}
        <Star className="h-3 w-3 inline" /> = image principale (première position)
      </p>
    </div>
  );
}
