'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Truck,
  Package,
  MapPin,
  Phone,
  User,
  Loader2,
  Send,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { formatPrice, formatDateTime, statusLabels, statusColors } from '@/lib/utils-admin';
import { toast } from 'sonner';

interface OrderItem {
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

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingCost: number;
  wilaya: string;
  commune: string;
  address: string;
  phone: string;
  notes: string | null;
  ecotrackId: string | null;
  ecotrackTracking: string | null;
  ecotrackStatus: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  items: OrderItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusFilters = [
  { value: 'all', label: 'Toutes' },
  { value: 'new', label: 'Nouvelles' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail dialog
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingToEcotrack, setSendingToEcotrack] = useState(false);
  const [syncingEcotrack, setSyncingEcotrack] = useState(false);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const openOrderDetail = async (orderId: string) => {
    try {
      setDetailLoading(true);
      setSelectedOrder(null);
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data.order);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success('Statut de la commande mis à jour');
        const data = await res.json();
        setSelectedOrder(data.order);
        fetchOrders(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendToEcotrack = async (orderId: string) => {
    try {
      setSendingToEcotrack(true);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendToEcotrack: true }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Commande envoyée vers FRET.DIRECT avec succès !');
        setSelectedOrder(data.order);
        fetchOrders(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de l\'envoi vers FRET.DIRECT');
      }
    } catch {
      toast.error('Erreur de connexion lors de l\'envoi vers FRET.DIRECT');
    } finally {
      setSendingToEcotrack(false);
    }
  };

  const handleSyncEcotrack = async (orderId: string) => {
    try {
      setSyncingEcotrack(true);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncEcotrack: true }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Statut FRET.DIRECT synchronisé');
        setSelectedOrder(data.order);
        fetchOrders(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la synchronisation');
      }
    } catch {
      toast.error('Erreur de connexion lors de la synchronisation');
    } finally {
      setSyncingEcotrack(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Commandes</h2>
        <p className="text-muted-foreground">{pagination.total} commandes au total</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N°, client, téléphone, suivi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {statusFilters.map((filter) => (
            <TabsTrigger key={filter.value} value={filter.value} className="text-xs sm:text-sm">
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune commande trouvée</p>
              <p className="text-sm">Les commandes apparaîtront ici lorsqu&apos;elles seront passées</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Commande</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                      <TableHead className="hidden lg:table-cell">Wilaya</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden sm:table-cell"><a href="https://fret.ecotrack.dz" target="_blank" rel="noopener noreferrer" className="hover:underline">FRET.DIRECT</a></TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openOrderDetail(order.id)}>
                        <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                        <TableCell className="font-medium text-sm">{order.customer.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{order.customer.phone}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{order.wilaya}</TableCell>
                        <TableCell className="text-sm font-medium">{formatPrice(order.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[order.status] || ''}>
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {order.ecotrackTracking ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {order.ecotrackTracking.substring(0, 8)}...
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
                              Non envoyé
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              openOrderDetail(order.id);
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
                      onClick={() => fetchOrders(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchOrders(pagination.page + 1)}
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

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder || detailLoading} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Commande {selectedOrder.orderNumber}
                  <Badge variant="outline" className={statusColors[selectedOrder.status] || ''}>
                    {statusLabels[selectedOrder.status] || selectedOrder.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Créée le {formatDateTime(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Update Status */}
                <div className="flex items-center gap-3">
                  <Label>Statut :</Label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nouvelle</SelectItem>
                      <SelectItem value="confirmed">Confirmée</SelectItem>
                      <SelectItem value="shipped">Expédiée</SelectItem>
                      <SelectItem value="delivered">Livrée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>

                <Separator />

                {/* Customer Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informations client
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{selectedOrder.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{selectedOrder.phone || selectedOrder.customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedOrder.wilaya}, {selectedOrder.commune}</span>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-3 w-3 mt-1" />
                      <span>{selectedOrder.address}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Articles commandés</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
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
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>{formatPrice(selectedOrder.shippingCost)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.totalAmount + selectedOrder.shippingCost)}</span>
                  </div>
                </div>

                {/* ──── Ecotrack Section ──── */}
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Expédition <a href="https://fret.ecotrack.dz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">FRET.DIRECT</a>
                  </h4>

                  {selectedOrder.ecotrackTracking ? (
                    /* ── Shipment already created ── */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">
                            Colis envoyé vers <a href="https://fret.ecotrack.dz" target="_blank" rel="noopener noreferrer" className="hover:underline">FRET.DIRECT</a>
                          </p>
                          <p className="text-xs text-green-600 mt-0.5">
                            N° de suivi : <span className="font-mono font-bold">{selectedOrder.ecotrackTracking}</span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {selectedOrder.ecotrackId && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs">ID FRET.DIRECT:</span>
                            <span className="font-mono text-xs">{selectedOrder.ecotrackId}</span>
                          </div>
                        )}
                        {selectedOrder.ecotrackStatus && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs">Statut:</span>
                            <Badge variant="outline" className="text-xs">{selectedOrder.ecotrackStatus}</Badge>
                          </div>
                        )}
                      </div>

                      {/* Sync Ecotrack Status Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncEcotrack(selectedOrder.id)}
                        disabled={syncingEcotrack}
                        className="w-full sm:w-auto"
                      >
                        {syncingEcotrack ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Synchronisation...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Synchroniser le statut <a href="https://fret.ecotrack.dz" target="_blank" rel="noopener noreferrer" className="hover:underline">FRET.DIRECT</a>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* ── No shipment yet ── */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-800">
                            Pas encore envoyé vers <a href="https://fret.ecotrack.dz" target="_blank" rel="noopener noreferrer" className="hover:underline">FRET.DIRECT</a>
                          </p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            Cliquez sur le bouton ci-dessous pour créer l&apos;expédition
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleSendToEcotrack(selectedOrder.id)}
                        disabled={sendingToEcotrack}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {sendingToEcotrack ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi en cours vers FRET.DIRECT...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Envoyer vers <a href="https://fret.ecotrack.dz" target="_blank" rel="noopener noreferrer" className="hover:underline">FRET.DIRECT</a>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Notes</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-muted-foreground">{children}</span>;
}
