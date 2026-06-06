"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  ShoppingBag,
  User,
  MapPin,
  ClipboardList,
  Package,
  Phone,
  Loader2,
  PartyPopper,
  ArrowLeft,
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
  id: string | number;
  name: string;
  code?: number;
}

interface Commune {
  id: string | number;
  name: string;
  code?: number;
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

// Zod schema for step 2
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
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const STEPS = [
  { label: "Produit", icon: ShoppingBag },
  { label: "Livraison", icon: MapPin },
  { label: "Résumé", icon: ClipboardList },
  { label: "Confirmation", icon: Check },
];

function OrderFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const preselectedProductId = searchParams.get("productId");
  const preselectedSize = searchParams.get("size");
  const preselectedColor = searchParams.get("color");
  const preselectedQty = searchParams.get("qty");

  // Step state
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Product selection
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

  // Step 2: Customer info
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingWilayas, setLoadingWilayas] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  // Step 3: Shipping
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Step 4: Order result
  const [orderResult, setOrderResult] = useState<{
    orderNumber: string;
    totalAmount: number;
  } | null>(null);
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
  const colors = selectedProduct
    ? [...new Set(selectedProduct.variants.map((v) => v.color))]
    : [];
  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const currentStock = selectedVariant?.stock ?? 0;
  const availableColorsForSize = selectedSize
    ? selectedProduct?.variants
        .filter((v) => v.size === selectedSize && v.stock > 0)
        .map((v) => v.color) || []
    : [];
  const availableSizesForColor = selectedColor
    ? selectedProduct?.variants
        .filter((v) => v.color === selectedColor && v.stock > 0)
        .map((v) => v.size) || []
    : [];

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

  // Load wilayas
  useEffect(() => {
    async function loadWilayas() {
      setLoadingWilayas(true);
      try {
        const res = await fetch("/api/ecotrack?action=wilayas");
        if (res.ok) {
          const data = await res.json();
          // Ecotrack returns array of wilaya objects
          setWilayas(data.wilayas || []);
        }
      } catch {
        // If ecotrack fails, load from local DB
        try {
          // Try fetching wilayas from a local source
          const res2 = await fetch("/api/products?limit=1");
          // We can't get wilayas from products API, so show error
          toast.error(
            "Impossible de charger les wilayas. Veuillez réessayer."
          );
        } catch {
          // fail silently
        }
      } finally {
        setLoadingWilayas(false);
      }
    }
    loadWilayas();
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
    // Reset commune when wilaya changes
    form.setValue("communeId", "");
  }, [selectedWilayaId, form]);

  // Calculate shipping when wilaya is selected
  useEffect(() => {
    if (!selectedWilayaId) {
      setShippingCost(null);
      return;
    }
    async function calcShipping() {
      setLoadingShipping(true);
      try {
        const res = await fetch(
          `/api/ecotrack?action=shipping&wilayaId=${selectedWilayaId}`
        );
        if (res.ok) {
          const data = await res.json();
          setShippingCost(data.shipping?.price || data.shipping || 0);
        }
      } catch {
        setShippingCost(null);
      } finally {
        setLoadingShipping(false);
      }
    }
    calcShipping();
  }, [selectedWilayaId]);

  // Validate step
  const canGoNext = useCallback(() => {
    if (currentStep === 0) {
      return (
        !!selectedProductId &&
        !!selectedSize &&
        !!selectedColor &&
        currentStock > 0 &&
        quantity > 0
      );
    }
    if (currentStep === 1) {
      return form.formState.isValid;
    }
    return true;
  }, [
    currentStep,
    selectedProductId,
    selectedSize,
    selectedColor,
    currentStock,
    quantity,
    form.formState.isValid,
  ]);

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate form
      const isValid = await form.trigger();
      if (!isValid) return;
    }
    if (currentStep === 2) {
      // Submit order
      await handleSubmitOrder();
      return;
    }
    setCurrentStep((s) => Math.min(3, s + 1));
  };

  const handleSubmitOrder = async () => {
    if (!selectedProduct || !selectedSize || !selectedColor) return;
    setSubmitting(true);
    try {
      const formValues = form.getValues();
      const selectedWilaya = wilayas.find(
        (w) => String(w.id) === formValues.wilayaId ||
               String(w.code) === formValues.wilayaId
      );
      const selectedCommune = communes.find(
        (c) => String(c.id) === formValues.communeId ||
               String(c.code) === formValues.communeId
      );

      const payload = {
        customerName: formValues.name,
        customerPhone: formValues.phone,
        customerWilaya: selectedWilaya?.name || formValues.wilayaId,
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
        setCurrentStep(3);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="bg-kabyle-cream/50 kabyle-pattern border-b">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-kabyle-dark">
              <ShoppingBag className="inline-block mr-2 h-7 w-7 text-kabyle-terracotta" />
              Commander
            </h1>
            <p className="mt-2 text-muted-foreground">
              Passer votre commande en quelques étapes simples
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      i < currentStep
                        ? "bg-kabyle-terracotta border-kabyle-terracotta text-white"
                        : i === currentStep
                        ? "bg-kabyle-cream border-kabyle-terracotta text-kabyle-terracotta"
                        : "bg-muted border-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {i < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-1 hidden sm:block",
                      i <= currentStep
                        ? "text-kabyle-terracotta font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-12 sm:w-20 h-0.5 mx-2",
                      i < currentStep
                        ? "bg-kabyle-terracotta"
                        : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 0: Product Selection */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {!selectedProductId ? (
                <>
                  <h2 className="text-lg font-semibold text-kabyle-dark">
                    Sélectionnez un produit
                  </h2>
                  {loadingProducts ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="animate-pulse rounded-lg border bg-muted h-48"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                      {products.map((product) => (
                        <button
                          key={product.id}
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
                              src={
                                product.images.length > 0
                                  ? product.images[0].url
                                  : "/logo.svg"
                              }
                              alt={product.name}
                              fill
                              sizes="33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-muted-foreground font-mono">
                              {product.reference}
                            </p>
                            <p className="text-sm font-medium text-kabyle-dark line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-sm font-bold text-kabyle-terracotta">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  {/* Selected product summary */}
                  <div className="flex gap-4 p-4 rounded-xl border bg-kabyle-cream/20">
                    <div className="relative h-24 w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={
                          selectedProduct?.images?.[0]?.url || "/logo.svg"
                        }
                        alt={selectedProduct?.name || ""}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedProduct?.reference}
                      </p>
                      <h3 className="text-base font-semibold text-kabyle-dark">
                        {selectedProduct?.name}
                      </h3>
                      <p className="text-lg font-bold text-kabyle-terracotta">
                        {selectedProduct
                          ? formatPrice(selectedProduct.price)
                          : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProductId(null);
                        setSelectedSize(null);
                        setSelectedColor(null);
                        setQuantity(1);
                      }}
                      className="text-muted-foreground"
                    >
                      Changer
                    </Button>
                  </div>

                  {/* Size selector */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-kabyle-dark">
                      Taille
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => {
                        const isAvailable = availableSizesForColor.includes(
                          size
                        );
                        return (
                          <Button
                            key={size}
                            variant={
                              selectedSize === size ? "default" : "outline"
                            }
                            size="sm"
                            className={cn(
                              "min-w-[48px]",
                              selectedSize === size &&
                                "bg-kabyle-terracotta text-white hover:bg-kabyle-red",
                              !isAvailable && "opacity-40"
                            )}
                            onClick={() => {
                              setSelectedSize(size);
                              if (
                                selectedColor &&
                                !selectedProduct?.variants.find(
                                  (v) =>
                                    v.size === size &&
                                    v.color === selectedColor &&
                                    v.stock > 0
                                )
                              ) {
                                const first =
                                  selectedProduct?.variants.find(
                                    (v) =>
                                      v.size === size && v.stock > 0
                                  );
                                setSelectedColor(first?.color || null);
                              }
                              setQuantity(1);
                            }}
                          >
                            {size}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color selector */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-kabyle-dark">
                      Couleur
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => {
                        const isAvailable = availableColorsForSize.includes(
                          color
                        );
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedColor(color);
                                setQuantity(1);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                              selectedColor === color
                                ? "border-kabyle-terracotta bg-kabyle-cream"
                                : isAvailable
                                ? "border-transparent bg-muted hover:bg-kabyle-cream/50"
                                : "border-transparent bg-muted opacity-40 cursor-not-allowed"
                            )}
                          >
                            <span
                              className={cn(
                                "h-4 w-4 rounded-full",
                                COLOR_MAP[color] || "bg-gray-400"
                              )}
                            />
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock indicator */}
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
                          "text-sm",
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
                      <Label className="text-sm font-semibold text-kabyle-dark">
                        Quantité
                      </Label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() =>
                            setQuantity((q) => Math.max(1, q - 1))
                          }
                          disabled={quantity <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center text-lg font-semibold">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() =>
                            setQuantity((q) =>
                              Math.min(currentStock, q + 1)
                            )
                          }
                          disabled={quantity >= currentStock}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm font-bold text-kabyle-terracotta">
                        Sous-total : {formatPrice(itemTotal)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Customer Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-kabyle-dark flex items-center gap-2">
                <User className="h-5 w-5 text-kabyle-terracotta" />
                Informations de livraison
              </h2>

              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Votre nom complet"
                            {...field}
                          />
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
                          Téléphone
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="05XXXXXXXX"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="wilayaId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <MapPin className="inline h-3 w-3 mr-1" />
                            Wilaya
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    loadingWilayas
                                      ? "Chargement..."
                                      : "Sélectionner"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60">
                              {wilayas.map((w) => (
                                <SelectItem
                                  key={String(w.id || w.code)}
                                  value={String(w.id || w.code)}
                                >
                                  {w.code ? `${w.code} - ` : ""}
                                  {w.name}
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
                          <FormLabel>Commune</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!selectedWilayaId || loadingCommunes}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    loadingCommunes
                                      ? "Chargement..."
                                      : !selectedWilayaId
                                      ? "Choisissez d'abord une wilaya"
                                      : "Sélectionner"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60">
                              {communes.map((c) => (
                                <SelectItem
                                  key={String(c.id || c.code)}
                                  value={String(c.id || c.code)}
                                >
                                  {c.name}
                                </SelectItem>
                              ))}
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
                        <FormLabel>Adresse complète</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Numéro, rue, quartier..."
                            rows={2}
                            {...field}
                          />
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
                        <FormLabel>
                          Notes (optionnel)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Instructions spéciales pour la livraison..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Shipping cost preview */}
                  {selectedWilayaId && (
                    <Card className="border-kabyle-terracotta/20 bg-kabyle-cream/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Frais de livraison
                          </span>
                          {loadingShipping ? (
                            <Loader2 className="h-4 w-4 animate-spin text-kabyle-terracotta" />
                          ) : shippingCost !== null ? (
                            <span className="text-sm font-bold text-kabyle-terracotta">
                              {formatPrice(shippingCost)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Non disponible
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </form>
              </Form>
            </div>
          )}

          {/* Step 2: Summary */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-kabyle-dark flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-kabyle-terracotta" />
                Résumé de la commande
              </h2>

              {/* Product info */}
              {selectedProduct && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={
                            selectedProduct.images?.[0]?.url || "/logo.svg"
                          }
                          alt={selectedProduct.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground font-mono">
                          {selectedProduct.reference}
                        </p>
                        <h3 className="text-base font-semibold text-kabyle-dark">
                          {selectedProduct.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{selectedSize}</Badge>
                          <span
                            className={cn(
                              "h-4 w-4 rounded-full",
                              COLOR_MAP[selectedColor || ""] ||
                                "bg-gray-400"
                            )}
                          />
                          <span className="text-sm">{selectedColor}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Quantité : {quantity}
                        </p>
                      </div>
                      <p className="text-base font-bold text-kabyle-terracotta whitespace-nowrap">
                        {formatPrice(itemTotal)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customer info */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-kabyle-dark flex items-center gap-2">
                    <User className="h-4 w-4 text-kabyle-terracotta" />
                    Informations client
                  </h3>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Nom :</span>{" "}
                      {form.getValues("name")}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Tél :</span>{" "}
                      {form.getValues("phone")}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Wilaya :
                      </span>{" "}
                      {wilayas.find(
                        (w) =>
                          String(w.id) === form.getValues("wilayaId") ||
                          String(w.code) === form.getValues("wilayaId")
                      )?.name || form.getValues("wilayaId")}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Commune :
                      </span>{" "}
                      {communes.find(
                        (c) =>
                          String(c.id) === form.getValues("communeId") ||
                          String(c.code) === form.getValues("communeId")
                      )?.name || form.getValues("communeId")}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Adresse :
                      </span>{" "}
                      {form.getValues("address")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Totals */}
              <Card className="border-kabyle-terracotta/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Sous-total ({quantity} article{quantity > 1 ? "s" : ""})
                    </span>
                    <span className="font-medium">{formatPrice(itemTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Livraison
                    </span>
                    <span className="font-medium">
                      {shippingCost !== null
                        ? formatPrice(shippingCost)
                        : "À calculer"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-kabyle-dark">Total</span>
                    <span className="text-kabyle-terracotta">
                      {formatPrice(totalWithShipping)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && orderResult && (
            <div className="text-center space-y-6 py-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <PartyPopper className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-kabyle-dark">
                Commande Confirmée !
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Votre commande a été enregistrée avec succès. Vous recevrez une
                confirmation par téléphone.
              </p>
              <Card className="max-w-sm mx-auto border-kabyle-terracotta/20">
                <CardContent className="p-6 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Numéro de commande
                    </p>
                    <p className="text-xl font-bold text-kabyle-terracotta">
                      {orderResult.orderNumber}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Montant total</p>
                    <p className="text-xl font-bold text-kabyle-dark">
                      {formatPrice(
                        orderResult.totalAmount + (shippingCost || 0)
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/catalog">
                  <Button
                    variant="outline"
                    className="border-kabyle-terracotta text-kabyle-terracotta"
                  >
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
          )}

          {/* Navigation buttons */}
          {currentStep < 3 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              {currentStep > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Retour
                </Button>
              ) : (
                <div />
              )}
              <Button
                className="bg-kabyle-terracotta hover:bg-kabyle-red text-white"
                onClick={handleNext}
                disabled={
                  !canGoNext() ||
                  submitting ||
                  (currentStep === 0 &&
                    (!selectedProductId ||
                      !selectedSize ||
                      !selectedColor ||
                      currentStock === 0))
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : currentStep === 2 ? (
                  <>
                    Confirmer la commande
                    <Check className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
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
