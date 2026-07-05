'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Loader2,
  X,
  Link,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatPrice } from '@/lib/utils-admin';
import { toast } from 'sonner';

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
  active: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formReference, setFormReference] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formFabric, setFormFabric] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formActive, setFormActive] = useState(true);
  const [formVariants, setFormVariants] = useState<Array<{ size: string; color: string; stock: string }>>([
    { size: '', color: '', stock: '0' },
  ]);
  const [formImages, setFormImages] = useState<Array<{ url: string; alt?: string; sortOrder: number }>>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const openCreateDialog = () => {
    setEditProduct(null);
    setFormReference('');
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormFabric('');
    setFormFeatured(false);
    setFormActive(true);
    setFormVariants([{ size: '', color: '', stock: '0' }]);
    setFormImages([]);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditProduct(product);
    setFormReference(product.reference);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormPrice(product.price.toString());
    setFormFabric(product.fabric || '');
    setFormFeatured(product.featured);
    setFormActive(product.active);
    setFormVariants(
      product.variants.length > 0
        ? product.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock.toString() }))
        : [{ size: '', color: '', stock: '0' }]
    );
    setFormImages(
      product.images.map((img, idx) => ({ url: img.url, alt: img.alt || undefined, sortOrder: idx }))
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formReference || !formName || !formPrice) {
      toast.error('Veuillez remplir la référence, le nom et le prix');
      return;
    }

    const validVariants = formVariants.filter((v) => v.size && v.color);

    const payload = {
      reference: formReference,
      name: formName,
      description: formDescription || null,
      price: parseFloat(formPrice),
      fabric: formFabric || null,
      featured: formFeatured,
      active: formActive,
      variants: validVariants.map((v) => ({ size: v.size, color: v.color, stock: parseInt(v.stock) || 0 })),
      images: formImages,
    };

    try {
      setSaving(true);
      let res;
      if (editProduct) {
        res = await fetch(`/api/products/${editProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editProduct ? 'Produit mis à jour avec succès' : 'Produit créé avec succès');
        setDialogOpen(false);
        fetchProducts(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/products/${deleteProduct.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Produit supprimé avec succès');
        setDeleteProduct(null);
        fetchProducts(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) {
      toast.error('Veuillez entrer une URL d\'image');
      return;
    }
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error('URL invalide. Veuillez entrer une URL valide (ex: https://...)');
      return;
    }
    setFormImages((prev) => [...prev, { url, sortOrder: prev.length }]);
    setImageUrlInput('');
  };

  const removeImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i })));
  };

  const addVariant = () => {
    setFormVariants((prev) => [...prev, { size: '', color: '', stock: '0' }]);
  };

  const removeVariant = (index: number) => {
    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: 'size' | 'color' | 'stock', value: string) => {
    setFormVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const getTotalStock = (product: Product) => {
    return product.variants.reduce((sum, v) => sum + v.stock, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Produits</h2>
          <p className="text-muted-foreground">{pagination.total} produits au total</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un produit
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par référence, nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun produit trouvé</p>
              <p className="text-sm">Commencez par ajouter votre premier produit</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Stock total</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.images[0] ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{product.reference}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{product.name}</TableCell>
                        <TableCell className="text-sm">{formatPrice(product.price)}</TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-medium ${
                              getTotalStock(product) === 0
                                ? 'text-red-600'
                                : getTotalStock(product) <= 3
                                ? 'text-yellow-600'
                                : 'text-foreground'
                            }`}
                          >
                            {getTotalStock(product)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {product.active ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                                Inactif
                              </Badge>
                            )}
                            {product.featured && (
                              <Badge variant="outline" className="bg-kabyle-gold/20 text-kabyle-gold border-kabyle-gold/30">
                                Vedette
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteProduct(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} sur {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchProducts(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchProducts(pagination.page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Modifier le produit' : 'Ajouter un produit'}</DialogTitle>
            <DialogDescription>
              {editProduct
                ? 'Modifiez les informations du produit'
                : 'Remplissez les informations pour créer un nouveau produit'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Référence *</Label>
                <Input
                  id="reference"
                  placeholder="RK-001"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  placeholder="Robe Kabyle Traditionnelle"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description du produit..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prix (DA) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="15000"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fabric">Tissu</Label>
                <Input
                  id="fabric"
                  placeholder="Satin, Soie..."
                  value={formFabric}
                  onChange={(e) => setFormFabric(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formFeatured}
                  onCheckedChange={setFormFeatured}
                />
                <Label htmlFor="featured">Produit vedette</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formActive}
                  onCheckedChange={setFormActive}
                />
                <Label htmlFor="active">Actif</Label>
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variantes (Taille / Couleur / Stock)</Label>
                <Button variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="mr-1 h-3 w-3" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {formVariants.map((variant, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Taille (S, M, L...)"
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Couleur"
                      value={variant.color}
                      onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Stock"
                      type="number"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                      className="w-20"
                      min="0"
                    />
                    {formVariants.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive"
                        onClick={() => removeVariant(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Image URLs */}
            <div className="space-y-3">
              <Label>Images (URL)</Label>
              <div className="flex flex-wrap gap-3 mb-3">
                {formImages.map((img, index) => (
                  <div key={index} className="relative group w-20 h-20">
                    <img
                      src={img.url}
                      alt={`Image ${index + 1}`}
                      className="w-20 h-20 rounded-lg object-cover border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.svg';
                      }}
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center rounded-b-lg py-0.5">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="https://exemple.com/image.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addImageUrl();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageUrl}
                  disabled={!imageUrlInput.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Collez l&apos;URL d&apos;une image (Instagram, Facebook, etc.) et cliquez sur Ajouter
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : editProduct ? (
                'Mettre à jour'
              ) : (
                'Créer le produit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le produit &quot;{deleteProduct?.name}&quot; ?
              Cette action est irréversible. Le produit et toutes ses données associées seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
