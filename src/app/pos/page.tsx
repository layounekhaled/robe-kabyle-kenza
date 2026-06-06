"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  CreditCard,
  Banknote,
  Printer,
  RefreshCw,
  X,
  Package,
  Loader2,
  Tag,
  Check,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface ProductVariant {
  id: string;
  productId: string;
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
  active: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface CartItem {
  productId: string;
  name: string;
  reference: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  image: string | null;
  variantId: string;
}

interface SaleItem {
  id: string;
  productId: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    reference: string;
    images: ProductImage[];
  };
}

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  paymentMethod: string;
  soldBy: string;
  createdAt: string;
  items: SaleItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-DZ").format(amount) + " DA";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COLOR_MAP: Record<string, string> = {
  Rouge: "bg-red-500",
  Bleu: "bg-blue-500",
  Noir: "bg-gray-800",
  Vert: "bg-green-500",
  Blanc: "bg-white border border-gray-300",
  Or: "bg-yellow-400",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function POSPage() {
  // Product search
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Product selection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [discount, setDiscount] = useState(0);

  // Checkout
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Product Search ──────────────────────────────────────────────────────

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Load all products when search is empty
      try {
        const res = await fetch("/api/products?limit=50");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        // silently fail
      }
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(query)}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      toast.error("Erreur lors de la recherche");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, searchProducts]);

  // Initial load
  useEffect(() => {
    searchProducts("");
  }, [searchProducts]);

  // ─── Keyboard Shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === "F4") {
        e.preventDefault();
        handleCheckout();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (showReceipt) {
          handleNewSale();
        } else {
          handleClearCart();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, showReceipt, paymentMethod, discount]);

  // ─── Product Selection ──────────────────────────────────────────────────

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
  };

  const availableSizes = selectedProduct
    ? [...new Set(selectedProduct.variants.map((v) => v.size))]
    : [];

  const availableColors = selectedProduct && selectedSize
    ? [
        ...new Set(
          selectedProduct.variants
            .filter((v) => v.size === selectedSize)
            .map((v) => v.color)
        ),
      ]
    : selectedProduct
    ? [...new Set(selectedProduct.variants.map((v) => v.color))]
    : [];

  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const variantStock = selectedVariant?.stock ?? 0;

  // ─── Cart Management ────────────────────────────────────────────────────

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedSize || !selectedColor) {
      toast.error("Sélectionnez une taille et une couleur");
      return;
    }
    if (variantStock < quantity) {
      toast.error("Stock insuffisant");
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantité invalide");
      return;
    }

    const existingIndex = cart.findIndex(
      (item) =>
        item.productId === selectedProduct.id &&
        item.size === selectedSize &&
        item.color === selectedColor
    );

    const newQuantity =
      existingIndex >= 0 ? cart[existingIndex].quantity + quantity : quantity;

    // Check total quantity against stock
    if (newQuantity > variantStock) {
      toast.error(
        `Stock insuffisant. Disponible: ${variantStock} - Dans le panier: ${existingIndex >= 0 ? cart[existingIndex].quantity : 0}`
      );
      return;
    }

    const cartItem: CartItem = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      reference: selectedProduct.reference,
      size: selectedSize,
      color: selectedColor,
      quantity: newQuantity,
      unitPrice: selectedProduct.price,
      image: selectedProduct.images[0]?.url || null,
      variantId: selectedVariant!.id,
    };

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex] = cartItem;
      setCart(newCart);
    } else {
      setCart([...cart, cartItem]);
    }

    toast.success(`${selectedProduct.name} ajouté au panier`);
    // Reset selection but keep product selected for quick re-add
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
  };

  const handleUpdateCartItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    const newCart = [...cart];
    newCart[index] = { ...newCart[index], quantity: newQty };
    setCart(newCart);
  };

  const handleRemoveCartItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setDiscount(0);
    toast.info("Panier vidé");
  };

  // ─── Calculations ───────────────────────────────────────────────────────

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const total = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ─── Checkout ───────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Le panier est vide");
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/store-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
          paymentMethod,
          notes: discount > 0 ? `Remise: ${formatPrice(discount)}` : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'encaissement");
        return;
      }

      setLastSale(data.sale);
      setShowReceipt(true);
      toast.success("Vente enregistrée avec succès !");

      // Refresh products to update stock
      searchProducts(searchQuery);
    } catch {
      toast.error("Erreur de connexion au serveur");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleNewSale = () => {
    setShowReceipt(false);
    setLastSale(null);
    setCart([]);
    setDiscount(0);
    setSelectedProduct(null);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    searchInputRef.current?.focus();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row gap-0 overflow-hidden">
      {/* ─── LEFT PANEL: Product Search & Selection (60%) ─── */}
      <div className="flex-1 lg:w-[60%] flex flex-col border-r overflow-hidden">
        {/* Search Bar */}
        <div className="p-3 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher par nom, référence... (F2)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Product Grid */}
          <div
            className={`flex-1 overflow-hidden transition-all ${
              selectedProduct ? "lg:w-1/2" : "w-full"
            }`}
          >
            <ScrollArea className="h-full">
              <div className="p-3">
                {searchLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-kabyle-terracotta" />
                  </div>
                )}

                {!searchLoading && products.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg">Aucun produit trouvé</p>
                    <p className="text-sm mt-1">
                      Essayez un autre terme de recherche
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {products.map((product) => {
                    const totalStock = product.variants.reduce(
                      (sum, v) => sum + v.stock,
                      0
                    );
                    const isSelected =
                      selectedProduct?.id === product.id;

                    return (
                      <Card
                        key={product.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected
                            ? "ring-2 ring-kabyle-terracotta shadow-md"
                            : "hover:ring-1 hover:ring-kabyle-terracotta/30"
                        }`}
                        onClick={() => handleSelectProduct(product)}
                      >
                        <CardContent className="p-3">
                          <div className="aspect-[3/4] rounded-md overflow-hidden bg-muted mb-2 relative">
                            {product.images[0] ? (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            {totalStock === 0 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="destructive" className="text-xs">
                                  Rupture
                                </Badge>
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-kabyle-terracotta text-kabyle-cream flex items-center justify-center">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <p className="font-semibold text-sm truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.reference}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="font-bold text-sm text-kabyle-terracotta">
                              {formatPrice(product.price)}
                            </p>
                            <Badge
                              variant={totalStock > 0 ? "secondary" : "destructive"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {totalStock > 0
                                ? `Stock: ${totalStock}`
                                : "Rupture"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Variant Selector Panel */}
          {selectedProduct && (
            <div className="lg:w-1/2 border-t lg:border-t-0 lg:border-l overflow-y-auto bg-muted/20">
              <div className="p-4">
                {/* Product Info */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-16 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                    {selectedProduct.images[0] ? (
                      <img
                        src={selectedProduct.images[0].url}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Réf: {selectedProduct.reference}
                    </p>
                    <p className="font-bold text-lg text-kabyle-terracotta mt-1">
                      {formatPrice(selectedProduct.price)}
                    </p>
                    {selectedProduct.fabric && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tissu: {selectedProduct.fabric}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Size Selector */}
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Taille</p>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <Button
                        key={size}
                        variant={selectedSize === size ? "default" : "outline"}
                        className={`h-11 min-w-[3rem] text-base ${
                          selectedSize === size
                            ? "bg-kabyle-terracotta text-kabyle-cream hover:bg-kabyle-terracotta/90"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedSize(size);
                          setSelectedColor(null);
                        }}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Couleur</p>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const hasStock =
                        selectedProduct.variants.some(
                          (v) =>
                            v.color === color &&
                            (!selectedSize || v.size === selectedSize) &&
                            v.stock > 0
                        );
                      return (
                        <Button
                          key={color}
                          variant={
                            selectedColor === color ? "default" : "outline"
                          }
                          className={`h-11 text-base gap-2 ${
                            selectedColor === color
                              ? "bg-kabyle-terracotta text-kabyle-cream hover:bg-kabyle-terracotta/90"
                              : ""
                          } ${!hasStock ? "opacity-50" : ""}`}
                          disabled={!hasStock}
                          onClick={() => setSelectedColor(color)}
                        >
                          <span
                            className={`w-4 h-4 rounded-full inline-block ${COLOR_MAP[color] || "bg-gray-400"}`}
                          />
                          {color}
                          {!hasStock && (
                            <Badge
                              variant="destructive"
                              className="text-[9px] px-1 py-0 ml-1"
                            >
                              Rupture
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Stock Info */}
                {selectedSize && selectedColor && (
                  <div className="mb-4 p-3 rounded-lg bg-muted">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Stock disponible</span>
                      <Badge
                        variant={variantStock > 0 ? "secondary" : "destructive"}
                        className="text-sm"
                      >
                        {variantStock > 0
                          ? `${variantStock} en stock`
                          : "Rupture de stock"}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Quantité</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-11 w-11 p-0"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={variantStock || 99}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(val, variantStock || 99)));
                      }}
                      className="h-11 w-20 text-center text-base font-bold"
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-11 w-11 p-0"
                      onClick={() =>
                        setQuantity(Math.min(quantity + 1, variantStock || 99))
                      }
                      disabled={quantity >= (variantStock || 99)}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  {/* Quick quantity buttons */}
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 5].map((qty) => (
                      <Button
                        key={qty}
                        variant={quantity === qty ? "default" : "outline"}
                        size="sm"
                        className={`h-9 min-w-[2.5rem] ${
                          quantity === qty
                            ? "bg-kabyle-terracotta text-kabyle-cream"
                            : ""
                        }`}
                        onClick={() => setQuantity(qty)}
                        disabled={variantStock > 0 && qty > variantStock}
                      >
                        {qty}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  className="w-full h-14 text-lg font-bold bg-kabyle-terracotta hover:bg-kabyle-terracotta/90 text-kabyle-cream"
                  onClick={handleAddToCart}
                  disabled={
                    !selectedSize ||
                    !selectedColor ||
                    variantStock === 0 ||
                    quantity <= 0
                  }
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Ajouter au panier
                  {selectedSize && selectedColor && quantity > 0 && (
                    <span className="ml-2 opacity-80">
                      — {formatPrice(selectedProduct.price * quantity)}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: Cart & Checkout (40%) ─── */}
      <div className="lg:w-[40%] flex flex-col overflow-hidden bg-card">
        {/* Cart Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-kabyle-terracotta" />
            <h2 className="font-bold text-lg">Panier</h2>
            {itemCount > 0 && (
              <Badge className="bg-kabyle-terracotta text-kabyle-cream">
                {itemCount}
              </Badge>
            )}
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-8"
              onClick={handleClearCart}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Vider
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-lg">Panier vide</p>
              <p className="text-sm mt-1">
                Sélectionnez un produit pour commencer
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.map((item, index) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="p-3 rounded-lg border bg-background flex gap-3"
                >
                  <div className="w-12 h-16 rounded overflow-hidden bg-muted shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.size} · {item.color}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            handleUpdateCartItemQuantity(
                              index,
                              item.quantity - 1
                            )
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            handleUpdateCartItemQuantity(
                              index,
                              item.quantity + 1
                            )
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="font-bold text-sm text-kabyle-terracotta">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemoveCartItem(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Cart Footer / Checkout */}
        <div className="border-t p-4 bg-muted/30 space-y-3">
          {/* Subtotal */}
          {cart.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
          )}

          {/* Payment Method Toggle */}
          {cart.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                className={`flex-1 h-11 text-base gap-2 ${
                  paymentMethod === "cash"
                    ? "bg-kabyle-terracotta text-kabyle-cream hover:bg-kabyle-terracotta/90"
                    : ""
                }`}
                onClick={() => setPaymentMethod("cash")}
              >
                <Banknote className="w-5 h-5" />
                Espèces
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                className={`flex-1 h-11 text-base gap-2 ${
                  paymentMethod === "card"
                    ? "bg-kabyle-terracotta text-kabyle-cream hover:bg-kabyle-terracotta/90"
                    : ""
                }`}
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="w-5 h-5" />
                Carte
              </Button>
            </div>
          )}

          {/* Discount */}
          {cart.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                type="number"
                min={0}
                placeholder="Remise (DA)"
                value={discount || ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setDiscount(Math.max(0, Math.min(val, subtotal)));
                }}
                className="h-10 text-sm"
              />
            </div>
          )}

          {/* Total */}
          {cart.length > 0 && (
            <div className="flex items-center justify-between py-2">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-kabyle-terracotta">
                {formatPrice(total)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className="w-full h-14 text-lg font-bold bg-kabyle-olive hover:bg-kabyle-olive/90 text-white"
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
            >
              {checkoutLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <CreditCard className="w-5 h-5 mr-2" />
              )}
              Encaisser (F4)
            </Button>

            {cart.length > 0 && (
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>F2 = Recherche</span>
                <span>F4 = Encaisser</span>
                <span>Esc = Vider</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Receipt Dialog ─── */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-kabyle-terracotta">
              Vente Enregistrée
            </DialogTitle>
          </DialogHeader>

          {lastSale && (
            <div className="space-y-4" id="receipt">
              {/* Receipt Header */}
              <div className="text-center border-b pb-4">
                <h3 className="font-bold text-lg">Boutique Robes Kabyles</h3>
                <p className="text-sm text-muted-foreground">
                  Reçu de vente
                </p>
                <Badge
                  variant="secondary"
                  className="mt-2 text-base font-mono"
                >
                  {lastSale.saleNumber}
                </Badge>
              </div>

              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                </div>
                <div className="text-right">{formatDate(lastSale.createdAt)}</div>
                <div>
                  <span className="text-muted-foreground">Vendeur:</span>
                </div>
                <div className="text-right">{lastSale.soldBy}</div>
                <div>
                  <span className="text-muted-foreground">Paiement:</span>
                </div>
                <div className="text-right">
                  {lastSale.paymentMethod === "cash" ? "Espèces" : "Carte"}
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-2">
                {lastSale.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.size} · {item.color} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold ml-2 shrink-0">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Discount */}
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Remise</span>
                  <span className="text-destructive">-{formatPrice(discount)}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between text-lg font-bold py-2">
                <span>Total</span>
                <span className="text-kabyle-terracotta">
                  {formatPrice(lastSale.totalAmount - discount)}
                </span>
              </div>

              <Separator />

              {/* Footer */}
              <p className="text-center text-xs text-muted-foreground">
                Merci pour votre achat !
                <br />
                Boutique Robes Kabyles vous souhaite une excellente journée.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 h-12 text-base"
              onClick={handlePrintReceipt}
            >
              <Printer className="w-5 h-5 mr-2" />
              Imprimer
            </Button>
            <Button
              className="flex-1 h-12 text-base bg-kabyle-terracotta hover:bg-kabyle-terracotta/90 text-kabyle-cream"
              onClick={handleNewSale}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Nouvelle vente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
