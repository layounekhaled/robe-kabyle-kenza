"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroSlideData {
  id: string;
  imageUrl: string;
  alt: string;
  sortOrder: number;
  active: boolean;
}

interface HeroCarouselProps {
  slides: HeroSlideData[];
  fallbackImage: string;
}

export default function HeroCarousel({ slides, fallbackImage }: HeroCarouselProps) {
  const activeSlides = slides.filter((s) => s.active);
  const hasMultiple = activeSlides.length > 1;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-scroll every 4 seconds
  const goToNext = useCallback(() => {
    if (!hasMultiple) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
      setIsTransitioning(false);
    }, 500);
  }, [hasMultiple, activeSlides.length]);

  useEffect(() => {
    if (!hasMultiple) return;
    const timer = setInterval(goToNext, 4000);
    return () => clearInterval(timer);
  }, [hasMultiple, goToNext]);

  const goToPrev = () => {
    if (!hasMultiple) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
      setIsTransitioning(false);
    }, 500);
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 500);
  };

  // If no slides at all, use fallback
  const imagesToShow = activeSlides.length > 0 ? activeSlides : [{ id: "fallback", imageUrl: fallbackImage, alt: "Robe Kabyle - Nouvelle collection", sortOrder: 0, active: true }];

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-white/50 image-reveal group/carousel">
      {/* Images with crossfade */}
      {imagesToShow.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.imageUrl}
            alt={slide.alt}
            fill
            sizes="50vw"
            className="object-cover"
            priority={index === 0}
            unoptimized
          />
        </div>
      ))}

      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-kabyle-dark/30 via-kabyle-dark/5 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-kabyle-gold/5 via-transparent to-kabyle-terracotta/5" />

      {/* Navigation arrows - only show if multiple slides */}
      {hasMultiple && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-all opacity-0 group-hover/carousel:opacity-100"
            aria-label="Photo précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-all opacity-0 group-hover/carousel:opacity-100"
            aria-label="Photo suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? "w-6 h-2 bg-white/90"
                    : "w-2 h-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Aller à la photo ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play indicator */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1 text-white/60 text-[10px]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            Auto
          </div>
        </>
      )}
    </div>
  );
}
