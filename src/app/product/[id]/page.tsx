"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Package,
  Tag,
  Layers,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import ImageCarousel from "@/components/store/ImageCarousel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

interface Product {
  id: string;
  reference: string;
  name: string;
  description: string | null;
  price: number;
  fabric: string | null;
  featured: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
}

const COLOR_MAP: Record<string, string> = {
  Rouge: "bg-red-500",
  Bleu: "bg-blue-500",
  Vert: "bg-green-500",
  Noir: "bg-gray-800",
  Blanc: "bg-white border-2 border-gray-300",
  Or: "bg-yellow-500",
  Rose: "bg-pink-400",
  Violet: "bg-purple-500",
  Marron: "bg-amber-800",
};

function formatPrice(price: number): string {
  return price.toLocaleString("fr-FR") + " DA";
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          // Auto-select first size & color
          if (data.product?.variants?.length > 0) {
            setSelectedSize(data.product.variants[0].size);
            setSelectedColor(data.product.variants[0].color);
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  // Get available sizes and colors
  const sizes = product
    ? [...new Set(product.variants.map((v) => v.size))]
    : [];
  const colors = product
    ? [...new Set(product.variants.map((v) => v.color))]
    : [];

  // Get stock for selected variant
  const selectedVariant = product?.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const currentStock = selectedVariant?.stock ?? 0;

  // Get available colors for selected size (all colors that exist for this size)
  const colorsForSize = selectedSize
    ? [...new Set(product?.variants.filter((v) => v.size === selectedSize).map((v) => v.color))] || []
    : colors;

  // Get colors that have stock for selected size
  const inStockColorsForSize = selectedSize
    ? product?.variants
        .filter((v) => v.size === selectedSize && v.stock > 0)
        .map((v) => v.color) || []
    : colors;

  // Get available sizes for selected color (all sizes that exist for this color)
  const sizesForColor = selectedColor
    ? [...new Set(product?.variants.filter((v) => v.color === selectedColor).map((v) => v.size))] || []
    : sizes;

  // Get sizes that have stock for selected color
  const inStockSizesForColor = selectedColor
    ? product?.variants
        .filter((v) => v.color === selectedColor && v.stock > 0)
        .map((v) => v.size) || []
    : sizes;

  const handleOrder = () => {
    if (!selectedSize || !selectedColor) {
      toast.error("Veuillez sélectionner une taille et une couleur");
      return;
    }
    if (currentStock === 0) {
      toast.error("Ce produit est en rupture de stock");
      return;
    }
    // Navigate to order page with pre-selected product
    router.push(
      `/order?productId=${productId}&size=${selectedSize}&color=${encodeURIComponent(selectedColor)}&qty=${quantity}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="animate-pulse aspect-[3/4] bg-muted rounded-xl" />
            <div className="space-y-4 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-3/4 bg-muted rounded" />
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-kabyle-dark">
              Produit non trouvé
            </h2>
            <p className="text-muted-foreground">
              Ce produit n&apos;existe pas ou n&apos;est plus disponible.
            </p>
            <Link href="/catalog">
              <Button className="bg-kabyle-terracotta hover:bg-kabyle-red text-white">
                Retour au catalogue
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3 w-3" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/catalog">Catalogue</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3 w-3" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Carousel */}
            <ImageCarousel
              images={product.images}
              productName={product.name}
            />

            {/* Product Info */}
            <div className="space-y-6">
              {/* Reference & Featured */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  {product.reference}
                </span>
                {product.featured && (
                  <Badge className="bg-kabyle-gold/10 text-kabyle-gold text-xs">
                    ⭐ Coup de cœur
                  </Badge>
                )}
              </div>

              {/* Name */}
              <h1 className="text-2xl sm:text-3xl font-bold text-kabyle-dark">
                {product.name}
              </h1>

              {/* Price */}
              <p className="text-3xl font-bold text-kabyle-terracotta">
                {formatPrice(product.price)}
              </p>

              {/* Description */}
              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Fabric */}
              {product.fabric && (
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tissu :</span>
                  <span className="font-medium text-kabyle-dark">
                    {product.fabric}
                  </span>
                </div>
              )}

              <Separator />

              {/* Size Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-kabyle-dark">
                    Taille
                  </span>
                  {selectedSize && (
                    <span className="text-sm text-muted-foreground">
                      : {selectedSize}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map((size) => {
                    const isInStock = inStockSizesForColor.includes(size);
                    const exists = sizesForColor.includes(size);
                    return (
                      <Button
                        key={size}
                        variant={selectedSize === size ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "min-w-[48px]",
                          selectedSize === size &&
                            "bg-kabyle-terracotta text-white hover:bg-kabyle-red",
                          exists && !isInStock &&
                            "opacity-50"
                        )}
                        onClick={() => {
                          setSelectedSize(size);
                          // If current color not available for this size, switch to first available
                          const colorsForNewSize = product.variants
                            .filter((v) => v.size === size)
                            .map((v) => v.color);
                          if (
                            selectedColor &&
                            !colorsForNewSize.includes(selectedColor)
                          ) {
                            const firstInStock = product.variants.find(
                              (v) => v.size === size && v.stock > 0
                            );
                            setSelectedColor(firstInStock?.color || colorsForNewSize[0] || null);
                          }
                        }}
                      >
                        {size}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-kabyle-dark">
                    Couleur
                  </span>
                  {selectedColor && (
                    <span className="text-sm text-muted-foreground">
                      : {selectedColor}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {colorsForSize.map((color) => {
                    const isInStock = inStockColorsForSize.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          setQuantity(1);
                          // If current size not available for this color, switch to first available
                          const sizesForNewColor = product.variants
                            .filter((v) => v.color === color)
                            .map((v) => v.size);
                          if (
                            selectedSize &&
                            !sizesForNewColor.includes(selectedSize)
                          ) {
                            const firstInStock = product.variants.find(
                              (v) => v.color === color && v.stock > 0
                            );
                            setSelectedSize(firstInStock?.size || sizesForNewColor[0] || null);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer",
                          selectedColor === color
                            ? "border-kabyle-terracotta bg-kabyle-cream"
                            : isInStock
                            ? "border-transparent bg-muted hover:bg-kabyle-cream/50"
                            : "border-transparent bg-muted opacity-50"
                        )}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full",
                            COLOR_MAP[color] || "bg-gray-400"
                          )}
                        />
                        {color}
                        {!isInStock && <span className="text-xs text-muted-foreground">(épuisé)</span>}
                        {selectedColor === color && (
                          <Check className="h-3 w-3 text-kabyle-terracotta" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock Indicator */}
              {selectedSize && selectedColor && (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      currentStock > 3 && "bg-green-500",
                      currentStock > 0 &&
                        currentStock <= 3 &&
                        "bg-orange-500",
                      currentStock === 0 && "bg-red-500"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      currentStock > 3 && "text-green-700",
                      currentStock > 0 &&
                        currentStock <= 3 &&
                        "text-orange-700",
                      currentStock === 0 && "text-red-700"
                    )}
                  >
                    {currentStock > 3
                      ? "En stock"
                      : currentStock > 0
                      ? `Plus que ${currentStock} en stock`
                      : "Rupture de stock"}
                  </span>
                </div>
              )}

              {/* Quantity */}
              {currentStock > 0 && (
                <div className="space-y-3">
                  <span className="text-sm font-semibold text-kabyle-dark">
                    Quantité
                  </span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-lg font-semibold">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() =>
                        setQuantity((q) => Math.min(currentStock, q + 1))
                      }
                      disabled={quantity >= currentStock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Order Button */}
              <Button
                size="lg"
                className="w-full bg-kabyle-terracotta hover:bg-kabyle-red text-white text-base py-6"
                onClick={handleOrder}
                disabled={currentStock === 0 && !!selectedSize && !!selectedColor}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Commander
              </Button>

              {/* Subtotal */}
              {currentStock > 0 && selectedSize && selectedColor && (
                <p className="text-center text-sm text-muted-foreground">
                  Sous-total :{" "}
                  <span className="font-bold text-kabyle-terracotta">
                    {formatPrice(product.price * quantity)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
