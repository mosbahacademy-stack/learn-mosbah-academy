export function formatDateArabic(date: string) {
  return new Intl.DateTimeFormat('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatCurrencyDZD(value: number) {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0
  }).format(value);
}