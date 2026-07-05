"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { getThumbnailUrl, getOptimizedUrl, isSupabaseUrl } from "@/lib/supabase-storage";

/**
 * OptimizedImage — Smart image component with:
 * - Automatic Supabase thumbnail generation for small displays
 * - Lazy loading by default
 * - Fallback placeholder when image fails to load
 * - Smooth loading transition
 */

interface OptimizedImageProps extends Omit<ImageProps, "onError"> {
  /** Use Supabase thumbnail transformation for this size */
  useThumbnail?: boolean;
  /** Image quality (1-100), only for Supabase images */
  quality?: number;
  /** Fallback image URL when the main image fails */
  fallbackSrc?: string;
}

// Default fallback: a simple gray placeholder SVG
const DEFAULT_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23f3f4f6'%3E%3Crect width='400' height='400' rx='8'/%3E%3Ctext x='200' y='200' text-anchor='middle' dominant-baseline='middle' fill='%239ca3af' font-family='sans-serif' font-size='16'%3EImage indisponible%3C/text%3E%3C/svg%3E";

export default function OptimizedImage({
  src,
  alt,
  useThumbnail = false,
  quality,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (typeof src === "string" && useThumbnail && isSupabaseUrl(src)) {
      return getThumbnailUrl(src);
    }
    if (typeof src === "string" && quality && isSupabaseUrl(src)) {
      return getOptimizedUrl(src, { quality });
    }
    return src as string;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={hasError ? fallbackSrc : imgSrc}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading && !hasError ? "opacity-0" : "opacity-100",
          props.className
        )}
        {...props}
      />
      {isLoading && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
    </div>
  );
}
