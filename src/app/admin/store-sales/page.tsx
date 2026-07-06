'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Store,
  Package,
  Loader2,
  Plus,
} from 'lucide-react';
import { NewSaleDialog } from '@/components/admin/NewSaleDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatPrice, formatDateTime, paymentLabels } from '@/lib/utils-admin';

interface StoreSaleItem {
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
    images: Array<{ url: string }>;
  };
}

interface StoreSale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  paymentMethod: string;
  notes: string | null;
  soldBy: string;
  createdAt: string;
  items: StoreSaleItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function StoreSalesPage() {
  const [sales, setSales] = useState<StoreSale[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Detail dialog
  const [selectedSale, setSelectedSale] = useState<StoreSale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // New sale dialog
  const [showNewSale, setShowNewSale] = useState(false);

  const fetchSales = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (paymentFilter !== 'all') params.set('paymentMethod', paymentFilter);
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/api/store-sales?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching store sales:', error);
    } finally {
      setLoading(false);
    }
  }, [paymentFilter]);

  useEffect(() => {
    fetchSales(1);
  }, [fetchSales]);

  const openSaleDetail = async (saleId: string) => {
    // Find in current list first
    const found = sales.find((s) => s.id === saleId);
    if (found) {
      setSelectedSale(found);
      return;
    }
    try {
      setDetailLoading(true);
      setSelectedSale(null);
      // Since there's no individual GET endpoint, just use the list data
    } catch (error) {
      console.error('Error fetching sale:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Ventes Magasin</h2>
          <p className="text-muted-foreground">{pagination.total} ventes au comptoir</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowNewSale(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Vente
          </Button>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="cash">Espèces</SelectItem>
              <SelectItem value="card">Carte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Store className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune vente magasin trouvée</p>
              <p className="text-sm">Les ventes au comptoir apparaîtront ici</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Vente</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead className="hidden sm:table-cell">Vendeur</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openSaleDetail(sale.id)}>
                        <TableCell className="font-mono text-xs">{sale.saleNumber}</TableCell>
                        <TableCell className="text-sm">{formatDateTime(sale.createdAt)}</TableCell>
                        <TableCell className="text-sm font-medium">{formatPrice(sale.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            sale.paymentMethod === 'cash'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }>
                            {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{sale.soldBy}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSaleDetail(sale.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                      onClick={() => fetchSales(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchSales(pagination.page + 1)}
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

      {/* Sale Detail Dialog */}
      <Dialog open={!!selectedSale || detailLoading} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedSale ? (
            <>
              <DialogHeader>
                <DialogTitle>Vente {selectedSale.saleNumber}</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selectedSale.createdAt)} — Par {selectedSale.soldBy}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Payment Method */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mode de paiement</span>
                  <Badge variant="outline" className={
                    selectedSale.paymentMethod === 'cash'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }>
                    {paymentLabels[selectedSale.paymentMethod] || selectedSale.paymentMethod}
                  </Badge>
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Articles</h4>
                  {selectedSale.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size} / {item.color} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">{formatPrice(item.unitPrice * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(selectedSale.totalAmount)}</span>
                </div>

                {/* Notes */}
                {selectedSale.notes && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Notes</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {selectedSale.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* New Sale Dialog */}
      <NewSaleDialog
        open={showNewSale}
        onOpenChange={setShowNewSale}
        onSuccess={() => fetchSales(1)}
      />
    </div>
  );
}
