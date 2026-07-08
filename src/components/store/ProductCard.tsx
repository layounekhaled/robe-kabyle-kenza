"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";
import { ArrowRight, Eye } from "lucide-react";

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
    <div className="craft-card group relative rounded-2xl border bg-card overflow-hidden gradient-border-animated">
      {/* Image */}
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-kabyle-cream/30 to-muted">
          <OptimizedImage
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-115"
            useThumbnail
            fallbackSrc="/logo-kabyle.png"
          />

          {/* Multi-layer gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-kabyle-dark/70 via-kabyle-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-kabyle-gold/5 via-transparent to-kabyle-terracotta/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Stock indicator overlay */}
          <div className="absolute top-3 left-3">
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
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out">
            <div className="flex items-center justify-center gap-2 text-white text-sm font-medium bg-white/20 backdrop-blur-sm rounded-full py-2 mx-4">
              <Eye className="h-4 w-4" />
              Voir les détails
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3 relative">
        {/* Subtle decorative top line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-kabyle-terracotta/10 to-transparent" />

        {/* Reference */}
        <p className="text-xs text-muted-foreground/60 font-mono tracking-wide">
          {product.reference}
        </p>

        {/* Name */}
        <Link href={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-kabyle-dark line-clamp-2 hover:text-kabyle-terracotta transition-colors duration-300 leading-snug min-h-[2.5rem]">
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
                className="text-xs px-2 py-0 h-5 bg-kabyle-cream/50 text-kabyle-dark/60 hover:bg-kabyle-cream transition-colors"
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
                  "h-4 w-4 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-125",
                  COLOR_MAP[color] || "bg-gray-400"
                )}
                title={color}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-xs text-muted-foreground">+{colors.length - 5}</span>
            )}
            <span className="text-xs text-muted-foreground/60 ml-1">
              {colors.length} couleur{colors.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/product/${product.id}`}
          className="btn-craft block w-full text-center py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-kabyle-cream to-kabyle-cream/80 text-kabyle-terracotta hover:from-kabyle-terracotta hover:to-kabyle-red hover:text-white transition-all duration-400 border border-kabyle-terracotta/10 hover:border-kabyle-terracotta/0 shadow-sm hover:shadow-md hover:shadow-kabyle-terracotta/10"
        >
          Voir détails
          <ArrowRight className="inline-block ml-1 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>
    </div>
  );
}
