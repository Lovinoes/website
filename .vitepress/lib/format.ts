const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function formatMonth(value: string | number | Date | null, empty = ''): string {
  if (value === null) return empty;
  const date = value instanceof Date ? value : new Date(value);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatUsd(cents: number): string {
  const digits = cents % 100 === 0 ? 0 : 2;
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatMebibytes(bytes: number): string {
  const mib = bytes / 1024 / 1024;
  return mib >= 10 ? `${Math.round(mib)} MiB` : `${mib.toFixed(1)} MiB`;
}
