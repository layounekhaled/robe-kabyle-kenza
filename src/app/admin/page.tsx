'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Plus,
  Eye,
  DollarSign,
  Store,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatPrice, formatDateTime, statusLabels, statusColors } from '@/lib/utils-admin';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Stats {
  products: { total: number; active: number; featured: number };
  orders: { total: number; new: number; confirmed: number; shipped: number; delivered: number; cancelled: number };
  storeSales: { total: number };
  revenue: { online: number; store: number; total: number };
  stock: { lowStock: number; outOfStock: number };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    customer: { name: string; phone: string };
  }>;
  lowStockAlerts: Array<{
    id: string;
    size: string;
    color: string;
    stock: number;
    product: { id: string; name: string; reference: string };
  }>;
}

const PIE_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#10b981', '#ef4444'];

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderStatusData = stats
    ? [
        { name: 'Nouvelles', value: stats.orders.new },
        { name: 'Confirmées', value: stats.orders.confirmed },
        { name: 'Expédiées', value: stats.orders.shipped },
        { name: 'Livrées', value: stats.orders.delivered },
        { name: 'Annulées', value: stats.orders.cancelled },
      ]
    : [];

  const revenueData = stats
    ? [
        { name: 'En ligne', value: stats.revenue.online },
        { name: 'Magasin', value: stats.revenue.store },
      ]
    : [];

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Erreur lors du chargement des statistiques</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Bienvenue, {session?.user?.name || 'Admin'} 👋
        </h2>
        <p className="text-muted-foreground">Voici un aperçu de votre boutique</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Produits"
          value={stats.products.total.toString()}
          subtitle={`${stats.products.active} actifs`}
          icon={Package}
          color="text-kabyle-terracotta"
          bgColor="bg-kabyle-terracotta/10"
        />
        <StatsCard
          title="Commandes en attente"
          value={stats.orders.new.toString()}
          subtitle={`${stats.orders.total} total`}
          icon={ShoppingCart}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatsCard
          title="Ventes Magasin"
          value={stats.storeSales.total.toString()}
          subtitle="ventes au comptoir"
          icon={Store}
          color="text-kabyle-olive"
          bgColor="bg-kabyle-olive/10"
        />
        <StatsCard
          title="Revenus totaux"
          value={formatPrice(stats.revenue.total)}
          subtitle={`${formatPrice(stats.revenue.online)} en ligne`}
          icon={DollarSign}
          color="text-kabyle-gold"
          bgColor="bg-kabyle-gold/10"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => router.push('/admin/products')} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un produit
        </Button>
        <Button variant="outline" onClick={() => router.push('/admin/orders')}>
          <Eye className="mr-2 h-4 w-4" />
          Voir les commandes
        </Button>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commandes par statut</CardTitle>
            <CardDescription>Répartition des commandes</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.orders.total > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {orderStatusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, 'Commandes']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {orderStatusData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index] }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                Aucune commande pour le moment
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des revenus</CardTitle>
            <CardDescription>En ligne vs Magasin</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.revenue.total > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip
                      formatter={(value: number) => [formatPrice(value), 'Revenus']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      <Cell fill="#b45309" />
                      <Cell fill="#6b7280" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                Aucun revenu pour le moment
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Commandes récentes</CardTitle>
              <CardDescription>Les 5 dernières commandes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/orders')}>
              Voir tout
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length > 0 ? (
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="text-sm">{order.customer.name}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatPrice(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColors[order.status] || ''}
                          >
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Aucune commande pour le moment
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Alertes stock faible
            </CardTitle>
            <CardDescription>
              {stats.stock.lowStock + stats.stock.outOfStock} variantes en alerte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.lowStockAlerts.length > 0 ? (
              <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2">
                {stats.lowStockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {alert.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.product.reference} — {alert.size} / {alert.color}
                      </p>
                    </div>
                    <Badge
                      variant={alert.stock === 0 ? 'destructive' : 'outline'}
                      className={
                        alert.stock === 0
                          ? ''
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }
                    >
                      {alert.stock === 0 ? 'Rupture' : `${alert.stock} restants`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Tous les stocks sont suffisants ✓
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`p-2.5 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
