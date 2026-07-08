"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: {
    id: string;
    url: string;
    alt: string | null;
    sortOrder: number;
  }[];
  productName: string;
}

export default function ImageCarousel({
  images,
  productName,
}: ImageCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex(index);
    setIsZoomed(false);
  }, []);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setIsZoomed(false);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted flex items-center justify-center">
        <OptimizedImage
          src="/logo-kabyle.png"
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-8"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted group"
      >
        <OptimizedImage
          src={images[selectedIndex].url}
          alt={images[selectedIndex].alt || `${productName} - Image ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={cn(
            "object-cover transition-transform duration-300",
            isZoomed && "scale-150 cursor-zoom-out"
          )}
          fallbackSrc="/logo-kabyle.png"
        />

        {/* Zoom button */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-3 right-3 z-10 rounded-full bg-black/40 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          title={isZoomed ? "Réduire" : "Agrandir"}
        >
          {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
        </button>

        {/* Previous arrow — only show if multiple images */}
        {images.length > 1 && (
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            title="Image précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Next arrow — only show if multiple images */}
        {images.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            title="Image suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/40 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleSelect(index)}
              className={cn(
                "relative shrink-0 h-20 w-16 rounded-lg overflow-hidden border-2 transition-all",
                selectedIndex === index
                  ? "border-kabyle-terracotta opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <OptimizedImage
                src={image.url}
                alt={image.alt || `${productName} - Miniature ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
                useThumbnail
                fallbackSrc="/logo-kabyle.png"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
