"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

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
    product.images.length > 0 ? product.images[0].url : "/logo.svg";
  const imageAlt =
    product.images.length > 0 && product.images[0].alt
      ? product.images[0].alt
      : product.name;

  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];
  const stockStatus = getStockStatus(product.variants);

  return (
    <div className="group relative rounded-xl border bg-card shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Image */}
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <OptimizedImage
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            useThumbnail
            fallbackSrc="/logo-kabyle.png"
          />

          {/* Stock indicator overlay */}
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
                stockStatus === "available" &&
                  "bg-green-100/90 text-green-800",
                stockStatus === "low" &&
                  "bg-orange-100/90 text-orange-800",
                stockStatus === "out" && "bg-red-100/90 text-red-800"
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
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Reference */}
        <p className="text-xs text-muted-foreground font-mono">
          {product.reference}
        </p>

        {/* Name */}
        <Link href={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-kabyle-dark line-clamp-2 hover:text-kabyle-terracotta transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <p className="text-lg font-bold text-kabyle-terracotta">
          {formatPrice(product.price)}
        </p>

        {/* Size badges */}
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sizes.map((size) => (
              <Badge
                key={size}
                variant="secondary"
                className="text-xs px-2 py-0 h-5"
              >
                {size}
              </Badge>
            ))}
          </div>
        )}

        {/* Color dots */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {colors.map((color) => (
              <span
                key={color}
                className={cn(
                  "h-4 w-4 rounded-full border border-gray-200",
                  COLOR_MAP[color] || "bg-gray-400"
                )}
                title={color}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              {colors.length} couleur{colors.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/product/${product.id}`}
          className="block w-full text-center py-2 text-sm font-medium rounded-lg bg-kabyle-cream text-kabyle-terracotta hover:bg-kabyle-terracotta hover:text-white transition-colors"
        >
          Voir détails
        </Link>
      </div>
    </div>
  );
}
