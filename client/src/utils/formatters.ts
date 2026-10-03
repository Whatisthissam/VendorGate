/**
 * Formats a number to Indian Rupee currency format (e.g. ₹5,00,000.00)
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0';
  }
  const val = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: val % 1 === 0 ? 0 : 2,
  }).format(val);
}

/**
 * Format a number with Indian thousand/lakh separators
 */
export function formatNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null || isNaN(Number(num))) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN').format(Number(num));
}

/**
 * Format ISO date string to DD-MMM-YYYY (e.g. 15-Oct-2026)
 */
export function formatDate(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Format ISO date string with time (e.g. 15-Oct-2026, 14:30)
 */
export function formatDateTime(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return isoString;
  }
}
