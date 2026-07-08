"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { getThumbnailUrl, getOptimizedUrl, isSupabaseUrl } from "@/lib/supabase-storage";

/**
 * OptimizedImage — Smart image component with:
 * - Automatic Supabase thumbnail generation for small displays
 * - Lazy loading by default
 * - Fallback placeholder when image fails to load
 * - Smooth loading transition
 * - Brand logo shown during loading
 */

interface OptimizedImageProps extends Omit<ImageProps, "onError"> {
  /** Use Supabase thumbnail transformation for this size */
  useThumbnail?: boolean;
  /** Image quality (1-100), only for Supabase images */
  quality?: number;
  /** Fallback image URL when the main image fails */
  fallbackSrc?: string;
}

// Default fallback: FRET.DIRECT logo
const DEFAULT_FALLBACK = "/logo-fret.png";

// Loading placeholder: FRET.DIRECT logo centered on muted background
function LoadingPlaceholder({ fill, width, height }: { fill?: boolean; width?: number; height?: number }) {
  if (fill) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
        <img
          src="/logo-fret.png"
          alt="Chargement..."
          className="w-1/3 h-1/3 object-contain opacity-40"
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center bg-muted/50 rounded-md"
      style={{ width, height }}
    >
      <img
        src="/logo-fret.png"
        alt="Chargement..."
        className="w-12 h-12 object-contain opacity-40"
      />
    </div>
  );
}

export default function OptimizedImage({
  src,
  alt,
  useThumbnail = false,
  quality,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  fill,
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

  // Sync imgSrc when the src prop changes (e.g. switching images in a carousel)
  useEffect(() => {
    let newSrc: string;
    if (typeof src === "string" && useThumbnail && isSupabaseUrl(src)) {
      newSrc = getThumbnailUrl(src);
    } else if (typeof src === "string" && quality && isSupabaseUrl(src)) {
      newSrc = getOptimizedUrl(src, { quality });
    } else {
      newSrc = src as string;
    }
    setImgSrc(newSrc);
    setIsLoading(true);
    setHasError(false);
  }, [src, useThumbnail, quality]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  // When using `fill`, the Image needs a positioned parent with explicit dimensions.
  // We wrap it in a div that fills its parent completely.
  if (fill) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={hasError ? fallbackSrc : imgSrc}
          alt={alt}
          fill
          onLoad={() => setIsLoading(false)}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoading && !hasError ? "opacity-0" : "opacity-100",
            className
          )}
          {...props}
        />
        {isLoading && !hasError && (
          <LoadingPlaceholder fill />
        )}
      </div>
    );
  }

  // Non-fill mode: standard Image rendering
  return (
    <>
      <Image
        src={hasError ? fallbackSrc : imgSrc}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading && !hasError ? "opacity-0" : "opacity-100",
          className
        )}
        {...props}
      />
      {isLoading && !hasError && (
        <LoadingPlaceholder width={props.width as number} height={props.height as number} />
      )}
    </>
  );
}
