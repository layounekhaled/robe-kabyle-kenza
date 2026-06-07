"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ProductCard from "@/components/store/ProductCard";

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
  price: number;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface CatalogClientProps {
  initialProducts: Product[];
  initialTotalPages: number;
}

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const ALL_COLORS = [
  "Rouge",
  "Bleu",
  "Vert",
  "Noir",
  "Blanc",
  "Or",
];

const COLOR_SWATCHES: Record<string, string> = {
  Rouge: "bg-red-500",
  Bleu: "bg-blue-500",
  Vert: "bg-green-500",
  Noir: "bg-gray-800",
  Blanc: "bg-white border border-gray-300",
  Or: "bg-yellow-500",
};

export default function CatalogClient({
  initialProducts,
  initialTotalPages,
}: CatalogClientProps) {
  // Products & pagination - initialize with server-fetched data
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Mobile filter panel
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Track if filters have changed from initial state
  const [hasFilterChanges, setHasFilterChanges] = useState(false);

  // Build query string from filters
  const buildQuery = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedSizes.length > 0) params.set("size", selectedSizes[0]);
      if (selectedColors.length > 0) params.set("color", selectedColors[0]);
      if (priceRange[0] > 0) params.set("minPrice", String(priceRange[0]));
      if (priceRange[1] < 20000) params.set("maxPrice", String(priceRange[1]));
      if (inStockOnly) params.set("inStock", "true");
      params.set("page", String(page));
      params.set("limit", "12");
      if (sortBy) params.set("sort", sortBy);

      return params.toString();
    },
    [search, selectedSizes, selectedColors, priceRange, inStockOnly, sortBy]
  );

  // Fetch products when filters change (not on initial load)
  useEffect(() => {
    if (!hasFilterChanges) return;

    async function loadProducts() {
      setLoading(true);
      try {
        const query = buildQuery(currentPage);
        const res = await fetch(`/api/products?${query}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [currentPage, buildQuery, hasFilterChanges]);

  // Mark filter changes and reset page
  useEffect(() => {
    if (search || selectedSizes.length > 0 || selectedColors.length > 0 ||
        priceRange[0] > 0 || priceRange[1] < 20000 || inStockOnly) {
      setHasFilterChanges(true);
    }
    setCurrentPage(1);
  }, [search, selectedSizes, selectedColors, priceRange, inStockOnly]);

  // Handle sort change
  useEffect(() => {
    setHasFilterChanges(true);
  }, [sortBy]);

  // Handle page change
  useEffect(() => {
    if (currentPage > 1) {
      setHasFilterChanges(true);
    }
  }, [currentPage]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 20000]);
    setInStockOnly(false);
    setHasFilterChanges(false);
    setProducts(initialProducts);
    setTotalPages(initialTotalPages);
    setCurrentPage(1);
  };

  const activeFilterCount =
    (selectedSizes.length > 0 ? 1 : 0) +
    (selectedColors.length > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 20000 ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  // Filter sidebar content (shared between mobile and desktop)
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <span className="text-sm font-semibold text-kabyle-dark">Prix</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-3 space-y-3">
            <Slider
              value={priceRange}
              min={0}
              max={20000}
              step={500}
              onValueChange={(val) => setPriceRange(val as [number, number])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{priceRange[0].toLocaleString("fr-FR")} DA</span>
              <span>{priceRange[1].toLocaleString("fr-FR")} DA</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Sizes */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <span className="text-sm font-semibold text-kabyle-dark">
            Tailles
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-3 space-y-2">
            {ALL_SIZES.map((size) => (
              <div key={size} className="flex items-center gap-2">
                <Checkbox
                  id={`size-${size}`}
                  checked={selectedSizes.includes(size)}
                  onCheckedChange={() => toggleSize(size)}
                />
                <Label
                  htmlFor={`size-${size}`}
                  className="text-sm cursor-pointer"
                >
                  {size}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Colors */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <span className="text-sm font-semibold text-kabyle-dark">
            Couleurs
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-3 flex flex-wrap gap-2">
            {ALL_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
                  selectedColors.includes(color)
                    ? "border-kabyle-terracotta bg-kabyle-cream text-kabyle-terracotta"
                    : "border-transparent bg-muted text-muted-foreground hover:bg-kabyle-cream/50"
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full ${
                    COLOR_SWATCHES[color] || "bg-gray-400"
                  }`}
                />
                {color}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* In Stock */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-semibold text-kabyle-dark">
          En stock uniquement
        </span>
        <Switch
          checked={inStockOnly}
          onCheckedChange={setInStockOnly}
        />
      </div>

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="w-full text-kabyle-terracotta hover:text-kabyle-red"
        >
          <X className="h-3 w-3 mr-1" />
          Effacer les filtres ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une robe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Plus récent</SelectItem>
              <SelectItem value="price-asc">Prix croissant</SelectItem>
              <SelectItem value="price-desc">Prix décroissant</SelectItem>
              <SelectItem value="name">Nom A-Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile filter toggle */}
          <Button
            variant="outline"
            className="lg:hidden relative"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-kabyle-terracotta text-white text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Active filters badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedSizes.map((size) => (
            <Badge
              key={size}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => toggleSize(size)}
            >
              Taille: {size} <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {selectedColors.map((color) => (
            <Badge
              key={color}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => toggleColor(color)}
            >
              Couleur: {color} <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {(priceRange[0] > 0 || priceRange[1] < 20000) && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setPriceRange([0, 20000])}
            >
              Prix: {priceRange[0].toLocaleString("fr-FR")} -{" "}
              {priceRange[1].toLocaleString("fr-FR")} DA{" "}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {inStockOnly && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setInStockOnly(false)}
            >
              En stock <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 bg-white rounded-xl border p-5">
            <h3 className="text-sm font-bold text-kabyle-dark mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </h3>
            <FilterContent />
          </div>
        </aside>

        {/* Mobile filter sheet */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-kabyle-dark flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtres
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFiltersOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <FilterContent />
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border bg-muted overflow-hidden"
                >
                  <Skeleton className="aspect-[3/4]" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                Aucun produit trouvé
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Essayez de modifier vos filtres
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                Effacer les filtres
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                  >
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(totalPages, 5) },
                      (_, i) => {
                        let page: number;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            className={
                              currentPage === page
                                ? "bg-kabyle-terracotta text-white"
                                : ""
                            }
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
