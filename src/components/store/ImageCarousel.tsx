"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
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
  }, []);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">Aucune image</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted cursor-zoom-in"
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <Image
          src={images[selectedIndex].url}
          alt={images[selectedIndex].alt || `${productName} - Image ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={cn(
            "object-cover transition-transform duration-300",
            isZoomed && "scale-150 cursor-zoom-out"
          )}
          priority
        />
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
              <Image
                src={image.url}
                alt={image.alt || `${productName} - Miniature ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
