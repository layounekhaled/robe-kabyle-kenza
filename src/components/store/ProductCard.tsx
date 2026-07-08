"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

interface ProductCardProps {
  product: {
    id: string;
    reference: string;
    name: string;
    price: number;
    images: ProductImage[];
    variants: ProductVariant[];
  };
}

const COLOR_MAP: Record<string, string> = {
  Rouge: "bg-red-500",
  Bleu: "bg-blue-500",
  Vert: "bg-green-500",
  Noir: "bg-gray-800",
  Blanc: "bg-white border border-gray-300",
  Or: "bg-yellow-500",
  Rose: "bg-pink-400",
  Violet: "bg-purple-500",
  Marron: "bg-amber-800",
};

function formatPrice(price: number): string {
  return price.toLocaleString("fr-FR") + " DA";
}

function getStockStatus(
  variants: ProductVariant[]
): "available" | "low" | "out" {
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  if (totalStock === 0) return "out";
  if (totalStock <= 3) return "low";
  return "available";
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl =
    product.images.length > 0 ? product.images[0].url : "/logo-fret.png";
  const imageAlt =
    product.images.length > 0 && product.images[0].alt
      ? product.images[0].alt
      : product.name;

  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];
  const stockStatus = getStockStatus(product.variants);

  return (
    <div className="craft-card group relative rounded-2xl border bg-card overflow-hidden">
      {/* Image */}
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <OptimizedImage
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            useThumbnail
            fallbackSrc="/logo-kabyle.png"
          />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-kabyle-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Stock indicator overlay */}
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm",
                stockStatus === "available" &&
                  "bg-green-100/80 text-green-800",
                stockStatus === "low" &&
                  "bg-orange-100/80 text-orange-800",
                stockStatus === "out" && "bg-red-100/80 text-red-800"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  stockStatus === "available" && "bg-green-500",
                  stockStatus === "low" && "bg-orange-500",
                  stockStatus === "out" && "bg-red-500"
                )}
              />
              {stockStatus === "available"
                ? "En stock"
                : stockStatus === "low"
                ? "Stock limité"
                : "Rupture"}
            </span>
          </div>

          {/* Quick view overlay on hover */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <div className="flex items-center justify-center gap-2 text-white text-sm font-medium">
              Voir les détails
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Reference */}
        <p className="text-xs text-muted-foreground/70 font-mono tracking-wide">
          {product.reference}
        </p>

        {/* Name */}
        <Link href={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-kabyle-dark line-clamp-2 hover:text-kabyle-terracotta transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <p className="text-xl font-bold text-kabyle-terracotta tracking-tight">
          {formatPrice(product.price)}
        </p>

        {/* Size badges */}
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sizes.map((size) => (
              <Badge
                key={size}
                variant="secondary"
                className="text-xs px-2 py-0 h-5 bg-kabyle-cream/60 text-kabyle-dark/70 hover:bg-kabyle-cream"
              >
                {size}
              </Badge>
            ))}
          </div>
        )}

        {/* Color dots */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {colors.slice(0, 5).map((color) => (
              <span
                key={color}
                className={cn(
                  "h-4 w-4 rounded-full border-2 border-white shadow-sm",
                  COLOR_MAP[color] || "bg-gray-400"
                )}
                title={color}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-xs text-muted-foreground">+{colors.length - 5}</span>
            )}
            <span className="text-xs text-muted-foreground ml-1">
              {colors.length} couleur{colors.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/product/${product.id}`}
          className="btn-craft block w-full text-center py-2.5 text-sm font-semibold rounded-xl bg-kabyle-cream text-kabyle-terracotta hover:bg-kabyle-terracotta hover:text-white transition-all duration-300 border border-kabyle-terracotta/10 hover:border-kabyle-terracotta"
        >
          Voir détails
        </Link>
      </div>
    </div>
  );
}
