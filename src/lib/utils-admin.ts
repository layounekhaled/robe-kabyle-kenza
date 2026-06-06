/**
 * Format a price in "X XXX DA" format
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' DA';
}

/**
 * Format a date in French locale
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a date with time in French locale
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Order status label mapping
 */
export const statusLabels: Record<string, string> = {
  new: 'Nouvelle',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

/**
 * Order status color mapping
 */
export const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  shipped: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

/**
 * Payment method labels
 */
export const paymentLabels: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte',
};
