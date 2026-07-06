'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  CreditCard,
  Banknote,
  Package,
  Loader2,
  Check,
  X,
} from 'lucide-react';

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

interface NewSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-DZ').format(amount) + ' DA';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NewSaleDialog({ open, onOpenChange, onSuccess }: NewSaleDialogProps) {
  // Product search
  const [searchQuery, setSearchQuery] = useState('');
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [notes, setNotes] = useState('');

  // Checkout
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Reset on close ───────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setSearchQuery('');
    setProducts([]);
    setSelectedProduct(null);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    setCart([]);
    setPaymentMethod('cash');
    setNotes('');
    setCheckoutLoading(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  // ─── Product Search ──────────────────────────────────────────────────────

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Load all products when search is empty
      try {
        const res = await fetch('/api/products?limit=50');
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
      toast.error('Erreur lors de la recherche');
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
      if (open) searchProducts(searchQuery);
    }, 300);
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, searchProducts, open]);

  // Initial load when dialog opens
  useEffect(() => {
    if (open) {
      searchProducts('');
    }
  }, [searchProducts, open]);

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
      toast.error('Sélectionnez une taille et une couleur');
      return;
    }
    if (variantStock < quantity) {
      toast.error('Stock insuffisant');
      return;
    }
    if (quantity <= 0) {
      toast.error('Quantité invalide');
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
      image: selectedProduct.images?.[0]?.url || null,
      variantId: selectedVariant!.id,
    };

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex] = cartItem;
      setCart(newCart);
    } else {
      setCart([...cart, cartItem]);
    }

    // Reset selection
    setSelectedProduct(null);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    searchInputRef.current?.focus();

    toast.success('Article ajouté au panier');
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const item = cart[index];
    const variant = products
      .find((p) => p.id === item.productId)
      ?.variants.find((v) => v.size === item.size && v.color === item.color);

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      handleRemoveItem(index);
      return;
    }

    if (variant && newQuantity > variant.stock) {
      toast.error(`Stock insuffisant. Maximum: ${variant.stock}`);
      return;
    }

    const newCart = [...cart];
    newCart[index] = { ...item, quantity: newQuantity };
    setCart(newCart);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // ─── Checkout ────────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/store-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
          paymentMethod,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la création de la vente');
        return;
      }

      const data = await res.json();
      toast.success(`Vente ${data.sale.saleNumber} créée avec succès`);
      
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('Erreur lors de la création de la vente');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Nouvelle Vente Magasin
          </DialogTitle>
          <DialogDescription>
            Créez une vente pour un client en magasin. Le stock sera automatiquement déduit.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
          {/* Left: Product Search & Selection */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher un produit (nom, référence)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Products List */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`relative group rounded-lg border overflow-hidden transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {product.images?.[0]?.url ? (
                      <div className="aspect-square bg-muted">
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-2 text-left">
                      <p className="text-xs font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                    </div>
                    {selectedProduct?.id === product.id && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Selected Product Details */}
            {selectedProduct && (
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  {selectedProduct.images?.[0]?.url ? (
                    <img
                      src={selectedProduct.images[0].url}
                      alt={selectedProduct.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(selectedProduct.price)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => setSelectedProduct(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <Separator />

                {/* Size Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taille</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <Button
                        key={size}
                        variant={selectedSize === size ? 'default' : 'outline'}
                        size="sm"
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

                {/* Color Selection */}
                {selectedSize && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Couleur</label>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => {
                        const variant = selectedProduct.variants.find(
                          (v) => v.size === selectedSize && v.color === color
                        );
                        const stock = variant?.stock ?? 0;
                        const isSelected = selectedColor === color;
                        const isDisabled = stock <= 0;

                        return (
                          <Button
                            key={color}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            disabled={isDisabled}
                            onClick={() => setSelectedColor(color)}
                            className={isDisabled ? 'opacity-50' : ''}
                          >
                            {color}
                            {stock > 0 && stock <= 5 && (
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {stock}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity & Add */}
                {selectedSize && selectedColor && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 h-8 text-center"
                        min={1}
                        max={variantStock}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQuantity(Math.min(variantStock, quantity + 1))}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Stock: {variantStock}
                    </span>
                    <Button onClick={handleAddToCart} className="ml-auto">
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Cart */}
          <div className="flex flex-col gap-4 border rounded-lg p-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Panier ({cart.length})
              </h3>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Vider
                </Button>
              )}
            </div>

            <Separator />

            {/* Cart Items */}
            <ScrollArea className="flex-1 min-h-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 opacity-50 mb-2" />
                  <p className="text-sm">Panier vide</p>
                  <p className="text-xs">Recherchez et ajoutez des produits</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      className="flex items-center gap-3 p-2 rounded-lg bg-background border"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size} / {item.color}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleUpdateQuantity(index, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleUpdateQuantity(index, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-medium">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mode de paiement</label>
              <div className="flex gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('cash')}
                  className="flex-1"
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Espèces
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('card')}
                  className="flex-1"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Carte
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optionnel)</label>
              <Input
                placeholder="Remarques sur la vente..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(cartTotal)}
              </span>
            </div>

            {/* Checkout Button */}
            <Button
              size="lg"
              className="w-full"
              disabled={cart.length === 0 || checkoutLoading}
              onClick={handleCheckout}
            >
              {checkoutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Valider la vente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}