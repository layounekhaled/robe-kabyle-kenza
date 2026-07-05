"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Minus,
  Plus,
  ShoppingBag,
  User,
  MapPin,
  Package,
  Phone,
  Loader2,
  PartyPopper,
  ArrowLeft,
  Check,
  X,
  Search,
  Home,
  MapPinned,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
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

interface Wilaya {
  id: number;
  name: string;
  code: number;
}

interface Commune {
  id: number;
  name: string;
  wilayaId: number;
  codePostal: string;
  hasStopDesk: boolean;
}

const COLOR_MAP: Record<string, string> = {
  Rouge: "bg-red-500",
  Bleu: "bg-blue-500",
  Vert: "bg-green-500",
  Noir: "bg-gray-800",
  Blanc: "bg-white border border-gray-300",
  Or: "bg-yellow-500",
};

function formatPrice(price: number): string {
  return price.toLocaleString("fr-FR") + " DA";
}

const customerSchema = z.object({
  name: z.string().min(2, "Le nom est requis (min. 2 caractères)"),
  phone: z
    .string()
    .min(10, "Numéro de téléphone invalide")
    .regex(/^(0|\+213)[5-7]\d{8}$/, "Format: 05XXXXXXXX ou +2135XXXXXXXX"),
  wilayaId: z.string().min(1, "Veuillez sélectionner une wilaya"),
  communeId: z.string().min(1, "Veuillez sélectionner une commune"),
  address: z.string().min(5, "L'adresse est requise (min. 5 caractères)"),
  notes: z.string().optional(),
  deliveryType: z.enum(["home", "stopdesk"]).default("home"),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

function OrderFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const preselectedProductId = searchParams.get("productId");
  const preselectedSize = searchParams.get("size");
  const preselectedColor = searchParams.get("color");
  const preselectedQty = searchParams.get("qty");

  // Product selection
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    preselectedProductId
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    preselectedSize
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    preselectedColor
  );
  const [quantity, setQuantity] = useState(
    preselectedQty ? parseInt(preselectedQty) : 1
  );
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Customer info
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingWilayas, setLoadingWilayas] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  // Shipping
  const [deliveryType, setDeliveryType] = useState<"home" | "stopdesk">("home");
  const [shippingRates, setShippingRates] = useState<{ home: number; stopDesk: number; source: string } | null>(null);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [allFees, setAllFees] = useState<Record<number, { home: number; stopDesk: number }> | null>(null);

  // Order result
  const [orderResult, setOrderResult] = useState<{
    orderNumber: string;
    totalAmount: number;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      wilayaId: "",
      communeId: "",
      address: "",
      notes: "",
    },
  });

  // Selected product details
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const sizes = selectedProduct
    ? [...new Set(selectedProduct.variants.map((v) => v.size))]
    : [];
  const colorsForSize = selectedProduct && selectedSize
    ? [...new Set(selectedProduct.variants.filter((v) => v.size === selectedSize).map((v) => v.color))]
    : selectedProduct
    ? [...new Set(selectedProduct.variants.map((v) => v.color))]
    : [];
  const inStockColorsForSize = selectedSize
    ? selectedProduct?.variants
        .filter((v) => v.size === selectedSize && v.stock > 0)
        .map((v) => v.color) || []
    : colorsForSize;
  const sizesForColor = selectedColor
    ? [...new Set(selectedProduct?.variants.filter((v) => v.color === selectedColor).map((v) => v.size))] || []
    : sizes;
  const inStockSizesForColor = selectedColor
    ? selectedProduct?.variants
        .filter((v) => v.color === selectedColor && v.stock > 0)
        .map((v) => v.size) || []
    : sizes;

  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const currentStock = selectedVariant?.stock ?? 0;

  // Filtered products for search
  const filteredProducts = products.filter(
    (p) =>
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load products
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products?limit=100");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  // Load wilayas and shipping fees
  useEffect(() => {
    async function loadWilayas() {
      setLoadingWilayas(true);
      try {
        const res = await fetch("/api/ecotrack?action=wilayas");
        if (res.ok) {
          const data = await res.json();
          setWilayas(data.wilayas || []);
        }
      } catch {
        toast.error("Impossible de charger les wilayas. Veuillez réessayer.");
      } finally {
        setLoadingWilayas(false);
      }
    }
    async function loadFees() {
      try {
        const res = await fetch("/api/ecotrack?action=fees");
        if (res.ok) {
          const data = await res.json();
          setAllFees(data.fees || null);
        }
      } catch {
        // Fees will be fetched per wilaya as fallback
      }
    }
    loadWilayas();
    loadFees();
  }, []);

  // Load communes when wilaya changes
  const selectedWilayaId = form.watch("wilayaId");
  useEffect(() => {
    if (!selectedWilayaId) {
      setCommunes([]);
      return;
    }
    async function loadCommunes() {
      setLoadingCommunes(true);
      try {
        const res = await fetch(
          `/api/ecotrack?action=communes&wilayaId=${selectedWilayaId}`
        );
        if (res.ok) {
          const data = await res.json();
          setCommunes(data.communes || []);
        }
      } catch {
        toast.error("Impossible de charger les communes");
      } finally {
        setLoadingCommunes(false);
      }
    }
    loadCommunes();
    form.setValue("communeId", "");
  }, [selectedWilayaId, form]);

  // Reset commune when delivery type changes (stop desk requires specific communes)
  useEffect(() => {
    form.setValue("communeId", "");
  }, [deliveryType, form]);

  // Filtered communes based on delivery type
  const filteredCommunes = deliveryType === "stopdesk"
    ? communes.filter((c) => c.hasStopDesk)
    : communes;

  // Check if stop desk is available in the selected wilaya
  const hasStopDeskInWilaya = communes.some((c) => c.hasStopDesk);

  // Calculate shipping rates when wilaya is selected
  useEffect(() => {
    if (!selectedWilayaId) {
      setShippingCost(null);
      setShippingRates(null);
      return;
    }
    async function calcShipping() {
      setLoadingShipping(true);
      try {
        const wilayaCode = parseInt(selectedWilayaId);
        // First try to use cached fees
        if (allFees && allFees[wilayaCode]) {
          const rates = allFees[wilayaCode];
          setShippingRates({ home: rates.home, stopDesk: rates.stopDesk, source: "api" });
          setShippingCost(deliveryType === "home" ? rates.home : rates.stopDesk);
          setLoadingShipping(false);
          return;
        }
        // Fallback: fetch rates for this specific wilaya
        const res = await fetch(
          `/api/ecotrack?action=rates&wilayaId=${selectedWilayaId}`
        );
        if (res.ok) {
          const data = await res.json();
          const rates = data.rates;
          setShippingRates(rates);
          // Set shipping cost based on current delivery type
          setShippingCost(deliveryType === "home" ? rates.home : rates.stopDesk);
        }
      } catch {
        setShippingCost(null);
        setShippingRates(null);
      } finally {
        setLoadingShipping(false);
      }
    }
    calcShipping();
  }, [selectedWilayaId, deliveryType, allFees]);

  // Submit handler
  const handleSubmitOrder = async () => {
    if (!selectedProduct || !selectedSize || !selectedColor) {
      toast.error("Veuillez sélectionner un produit, une taille et une couleur");
      return;
    }
    if (currentStock === 0) {
      toast.error("Ce produit est en rupture de stock");
      return;
    }

    const formValid = await form.trigger();
    if (!formValid) return;

    setSubmitting(true);
    try {
      const formValues = form.getValues();
      // wilayaId is the wilaya code (e.g., "16" for Alger)
      const selectedWilaya = wilayas.find(
        (w) => String(w.code) === formValues.wilayaId
      );
      // communeId is the commune name (e.g., "Alger Centre")
      const selectedCommune = communes.find(
        (c) => c.name === formValues.communeId
      );

      const payload = {
        customerName: formValues.name,
        customerPhone: formValues.phone,
        customerWilaya: selectedWilaya?.name || formValues.wilayaId,
        customerWilayaCode: formValues.wilayaId,
        customerCommune: selectedCommune?.name || formValues.communeId,
        customerAddress: formValues.address,
        items: [
          {
            productId: selectedProduct.id,
            size: selectedSize,
            color: selectedColor,
            quantity,
          },
        ],
        notes: formValues.notes || undefined,
        shippingCost: shippingCost || 0,
        deliveryType,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderResult({
          orderNumber: data.order.orderNumber,
          totalAmount: data.order.totalAmount,
        });
        setSubmitted(true);
        toast.success("Commande créée avec succès !");
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de la commande");
      }
    } catch {
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const itemTotal = selectedProduct ? selectedProduct.price * quantity : 0;
  const totalWithShipping = itemTotal + (shippingCost || 0);

  // ─────────── Confirmation screen ───────────
  if (submitted && orderResult) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md w-full">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <PartyPopper className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-kabyle-dark">
              Commande Confirmée !
            </h2>
            <p className="text-muted-foreground">
              Votre commande a été enregistrée avec succès. Vous recevrez une
              confirmation par téléphone.
            </p>
            <Card className="border-kabyle-terracotta/20">
              <CardContent className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Numéro de commande</p>
                  <p className="text-xl font-bold text-kabyle-terracotta">
                    {orderResult.orderNumber}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="text-xl font-bold text-kabyle-dark">
                    {formatPrice(orderResult.totalAmount + (shippingCost || 0))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/catalog">
                <Button variant="outline" className="border-kabyle-terracotta text-kabyle-terracotta">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continuer les achats
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-kabyle-terracotta hover:bg-kabyle-red text-white">
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─────────── Main unified form ───────────
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-kabyle-cream/50 kabyle-pattern border-b">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-kabyle-dark">
              <ShoppingBag className="inline-block mr-2 h-7 w-7 text-kabyle-terracotta" />
              Commander
            </h1>
            <p className="mt-1 text-muted-foreground">
              Remplissez le formulaire ci-dessous pour passer votre commande
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitOrder)}>
              <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">

                {/* ═══════ LEFT: Product Selection (3 cols) ═══════ */}
                <div className="lg:col-span-3 space-y-6">

                  {/* ── Section: Produit ── */}
                  <Card>
                    <CardContent className="p-5 space-y-5">
                      <h2 className="text-lg font-semibold text-kabyle-dark flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-kabyle-terracotta" />
                        Produit
                      </h2>

                      {!selectedProductId ? (
                        <>
                          {/* Search */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Rechercher par nom ou référence..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>

                          {loadingProducts ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="animate-pulse rounded-lg border bg-muted h-44" />
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto custom-scrollbar pr-1">
                              {filteredProducts.map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedProductId(product.id);
                                    setSelectedSize(null);
                                    setSelectedColor(null);
                                    setQuantity(1);
                                  }}
                                  className="group text-left rounded-lg border overflow-hidden hover:border-kabyle-terracotta hover:shadow-md transition-all"
                                >
                                  <div className="relative aspect-[3/4] bg-muted">
                                    <Image
                                      src={product.images.length > 0 ? product.images[0].url : "/logo.svg"}
                                      alt={product.name}
                                      fill
                                      sizes="33vw"
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  <div className="p-2">
                                    <p className="text-xs text-muted-foreground font-mono">{product.reference}</p>
                                    <p className="text-sm font-medium text-kabyle-dark line-clamp-1">{product.name}</p>
                                    <p className="text-sm font-bold text-kabyle-terracotta">{formatPrice(product.price)}</p>
                                  </div>
                                </button>
                              ))}
                              {filteredProducts.length === 0 && (
                                <p className="col-span-full text-center text-muted-foreground py-8">
                                  Aucun produit trouvé
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-5">
                          {/* Selected product banner */}
                          <div className="flex gap-4 p-4 rounded-xl border bg-kabyle-cream/20">
                            <div className="relative h-24 w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                              <Image
                                src={selectedProduct?.images?.[0]?.url || "/logo.svg"}
                                alt={selectedProduct?.name || ""}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground font-mono">{selectedProduct?.reference}</p>
                              <h3 className="text-base font-semibold text-kabyle-dark">{selectedProduct?.name}</h3>
                              <p className="text-lg font-bold text-kabyle-terracotta">
                                {selectedProduct ? formatPrice(selectedProduct.price) : ""}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => {
                                setSelectedProductId(null);
                                setSelectedSize(null);
                                setSelectedColor(null);
                                setQuantity(1);
                              }}
                              className="text-muted-foreground shrink-0"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Changer
                            </Button>
                          </div>

                          {/* Size selector */}
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-kabyle-dark">
                              Taille <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {sizesForColor.map((size) => {
                                const isInStock = inStockSizesForColor.includes(size);
                                return (
                                  <Button
                                    key={size}
                                    type="button"
                                    variant={selectedSize === size ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                      "min-w-[48px]",
                                      selectedSize === size && "bg-kabyle-terracotta text-white hover:bg-kabyle-red",
                                      !isInStock && "opacity-50"
                                    )}
                                    onClick={() => {
                                      setSelectedSize(size);
                                      const colorsForNewSize = selectedProduct?.variants
                                        .filter((v) => v.size === size)
                                        .map((v) => v.color) || [];
                                      if (selectedColor && !colorsForNewSize.includes(selectedColor)) {
                                        const firstInStock = selectedProduct?.variants.find(
                                          (v) => v.size === size && v.stock > 0
                                        );
                                        setSelectedColor(firstInStock?.color || colorsForNewSize[0] || null);
                                      }
                                      setQuantity(1);
                                    }}
                                  >
                                    {size}
                                  </Button>
                                );
                              })}
                            </div>
                            {selectedSize === null && (
                              <p className="text-xs text-orange-600">Veuillez choisir une taille</p>
                            )}
                          </div>

                          {/* Color selector */}
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-kabyle-dark">
                              Couleur <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {colorsForSize.map((color) => {
                                const isInStock = inStockColorsForSize.includes(color);
                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                      setSelectedColor(color);
                                      setQuantity(1);
                                      const sizesForNewColor = selectedProduct?.variants
                                        .filter((v) => v.color === color)
                                        .map((v) => v.size) || [];
                                      if (selectedSize && !sizesForNewColor.includes(selectedSize)) {
                                        const firstInStock = selectedProduct?.variants.find(
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
                                    <span className={cn("h-4 w-4 rounded-full", COLOR_MAP[color] || "bg-gray-400")} />
                                    {color}
                                    {!isInStock && <span className="text-xs text-muted-foreground">(épuisé)</span>}
                                    {selectedColor === color && <Check className="h-3 w-3 text-kabyle-terracotta" />}
                                  </button>
                                );
                              })}
                            </div>
                            {selectedColor === null && selectedSize !== null && (
                              <p className="text-xs text-orange-600">Veuillez choisir une couleur</p>
                            )}
                          </div>

                          {/* Stock + Quantity */}
                          {selectedSize && selectedColor && (
                            <div className="space-y-4">
                              {/* Stock */}
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "h-2.5 w-2.5 rounded-full",
                                  currentStock > 3 && "bg-green-500",
                                  currentStock > 0 && currentStock <= 3 && "bg-orange-500",
                                  currentStock === 0 && "bg-red-500"
                                )} />
                                <span className={cn(
                                  "text-sm font-medium",
                                  currentStock > 3 && "text-green-700",
                                  currentStock > 0 && currentStock <= 3 && "text-orange-700",
                                  currentStock === 0 && "text-red-700"
                                )}>
                                  {currentStock > 3 ? "En stock" : currentStock > 0 ? `Plus que ${currentStock} en stock` : "Rupture de stock"}
                                </span>
                              </div>

                              {/* Quantity */}
                              {currentStock > 0 && (
                                <div className="flex items-center gap-4">
                                  <Label className="text-sm font-semibold text-kabyle-dark">Quantité</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                      disabled={quantity <= 1}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-10 text-center text-lg font-semibold">{quantity}</span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                                      disabled={quantity >= currentStock}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <span className="text-sm font-bold text-kabyle-terracotta ml-auto">
                                    {formatPrice(itemTotal)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ── Section: Livraison ── */}
                  <Card>
                    <CardContent className="p-5 space-y-5">
                      <h2 className="text-lg font-semibold text-kabyle-dark flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-kabyle-terracotta" />
                        Informations de livraison
                      </h2>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom complet <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Votre nom complet" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                <Phone className="inline h-3 w-3 mr-1" />
                                Téléphone <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="05XXXXXXXX" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="wilayaId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                <MapPin className="inline h-3 w-3 mr-1" />
                                Wilaya <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select onValueChange={(value) => { field.onChange(value); }} value={field.value || undefined}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={loadingWilayas ? "Chargement..." : "Sélectionner une wilaya"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-60">
                                  {wilayas.map((w) => (
                                    <SelectItem key={String(w.code)} value={String(w.code)}>
                                      {w.code} - {w.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="communeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Commune <span className="text-red-500">*</span></FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || undefined}
                                disabled={!selectedWilayaId || loadingCommunes}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        loadingCommunes
                                          ? "Chargement des communes..."
                                          : !selectedWilayaId
                                          ? "Choisissez d'abord une wilaya"
                                          : "Sélectionner une commune"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-60">
                                  {filteredCommunes.map((c) => (
                                    <SelectItem key={`${c.name}-${c.codePostal}`} value={c.name}>
                                      <div className="flex items-center gap-2">
                                        <span>{c.name}</span>
                                        {deliveryType === "home" && c.hasStopDesk && (
                                          <Badge variant="outline" className="text-[10px] py-0 px-1 border-green-300 text-green-700 bg-green-50">
                                            Stop Desk
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                  {filteredCommunes.length === 0 && communes.length > 0 && deliveryType === "stopdesk" && (
                                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                      Aucun Stop Desk disponible dans cette wilaya
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse complète <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Textarea placeholder="Numéro, rue, quartier..." rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (optionnel)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Instructions spéciales pour la livraison..." rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Delivery type selector */}
                      {selectedWilayaId && (
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-kabyle-dark">
                            Type de livraison <span className="text-red-500">*</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setDeliveryType("home")}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all",
                                deliveryType === "home"
                                  ? "border-kabyle-terracotta bg-kabyle-cream"
                                  : "border-transparent bg-muted hover:bg-kabyle-cream/50"
                              )}
                            >
                              <Home className={cn(
                                "h-5 w-5 shrink-0",
                                deliveryType === "home" ? "text-kabyle-terracotta" : "text-muted-foreground"
                              )} />
                              <div>
                                <p className={cn(
                                  "text-sm font-medium",
                                  deliveryType === "home" ? "text-kabyle-dark" : "text-muted-foreground"
                                )}>
                                  Livraison à domicile
                                </p>
                                {shippingRates && (
                                  <p className="text-xs text-muted-foreground">
                                    {formatPrice(shippingRates.home)}
                                  </p>
                                )}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (communes.length > 0 && !hasStopDeskInWilaya) {
                                  toast.error("Aucun Stop Desk disponible dans cette wilaya");
                                  return;
                                }
                                setDeliveryType("stopdesk");
                              }}
                              disabled={communes.length > 0 && !hasStopDeskInWilaya}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all",
                                deliveryType === "stopdesk"
                                  ? "border-kabyle-terracotta bg-kabyle-cream"
                                  : communes.length > 0 && !hasStopDeskInWilaya
                                  ? "border-transparent bg-muted/50 opacity-50 cursor-not-allowed"
                                  : "border-transparent bg-muted hover:bg-kabyle-cream/50"
                              )}
                            >
                              <MapPinned className={cn(
                                "h-5 w-5 shrink-0",
                                deliveryType === "stopdesk" ? "text-kabyle-terracotta" : "text-muted-foreground"
                              )} />
                              <div>
                                <p className={cn(
                                  "text-sm font-medium",
                                  deliveryType === "stopdesk" ? "text-kabyle-dark" : "text-muted-foreground"
                                )}>
                                  Stop Desk
                                </p>
                                {shippingRates && hasStopDeskInWilaya && (
                                  <p className="text-xs text-muted-foreground">
                                    {formatPrice(shippingRates.stopDesk)}
                                  </p>
                                )}
                                {communes.length > 0 && !hasStopDeskInWilaya && (
                                  <p className="text-xs text-red-500">
                                    Non disponible
                                  </p>
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Shipping cost */}
                      {selectedWilayaId && (
                        <div className="flex items-center justify-between p-3 rounded-lg border border-kabyle-terracotta/20 bg-kabyle-cream/20">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Frais de livraison{deliveryType === "home" ? " (domicile)" : " (Stop Desk)"}
                          </span>
                          {loadingShipping ? (
                            <Loader2 className="h-4 w-4 animate-spin text-kabyle-terracotta" />
                          ) : shippingCost !== null ? (
                            <span className="text-sm font-bold text-kabyle-terracotta">{formatPrice(shippingCost)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Non disponible</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* ═══════ RIGHT: Order Summary (2 cols) ═══════ */}
                <div className="lg:col-span-2">
                  <div className="lg:sticky lg:top-20 space-y-4">
                    <Card className="border-kabyle-terracotta/20">
                      <CardContent className="p-5 space-y-5">
                        <h2 className="text-lg font-semibold text-kabyle-dark flex items-center gap-2">
                          <User className="h-5 w-5 text-kabyle-terracotta" />
                          Résumé de la commande
                        </h2>

                        {/* Product summary */}
                        {selectedProduct ? (
                          <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="relative h-16 w-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                              <Image
                                src={selectedProduct.images?.[0]?.url || "/logo.svg"}
                                alt={selectedProduct.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground font-mono">{selectedProduct.reference}</p>
                              <p className="text-sm font-semibold text-kabyle-dark line-clamp-1">{selectedProduct.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {selectedSize && <Badge variant="secondary" className="text-xs">{selectedSize}</Badge>}
                                {selectedColor && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span className={cn("h-3 w-3 rounded-full", COLOR_MAP[selectedColor] || "bg-gray-400")} />
                                    {selectedColor}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            Sélectionnez un produit pour commencer
                          </div>
                        )}

                        {/* Price breakdown */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Prix unitaire
                            </span>
                            <span className="font-medium">
                              {selectedProduct ? formatPrice(selectedProduct.price) : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Quantité
                            </span>
                            <span className="font-medium">
                              {selectedProduct ? quantity : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sous-total</span>
                            <span className="font-medium">
                              {selectedProduct ? formatPrice(itemTotal) : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Livraison
                            </span>
                            <span className="font-medium">
                              {shippingCost !== null
                                ? formatPrice(shippingCost)
                                : selectedWilayaId
                                ? "Calcul..."
                                : "Selon wilaya"}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg font-bold pt-1">
                            <span className="text-kabyle-dark">Total</span>
                            <span className="text-kabyle-terracotta">
                              {selectedProduct ? formatPrice(totalWithShipping) : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Submit button */}
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full bg-kabyle-terracotta hover:bg-kabyle-red text-white text-base py-6"
                          disabled={
                            submitting ||
                            !selectedProductId ||
                            !selectedSize ||
                            !selectedColor ||
                            currentStock === 0
                          }
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Envoi en cours...
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="mr-2 h-5 w-5" />
                              Confirmer la commande
                            </>
                          )}
                        </Button>

                        {/* Validation hints */}
                        {(!selectedProductId || !selectedSize || !selectedColor) && (
                          <div className="space-y-1">
                            {!selectedProductId && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                                Choisissez un produit
                              </p>
                            )}
                            {selectedProductId && !selectedSize && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                                Choisissez une taille
                              </p>
                            )}
                            {selectedProductId && selectedSize && !selectedColor && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                                Choisissez une couleur
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Livraison Ecotrack
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Paiement à la livraison
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          </Form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-kabyle-terracotta" />
        </div>
      }
    >
      <OrderFormContent />
    </Suspense>
  );
}
