/**
 * Format currency with appropriate units (Millions, Thousands, or exact)
 */
export function formatCurrency(amount: number, showSymbol: boolean = true): string {
  const symbol = showSymbol ? '₦' : '';

  // Handle negative numbers
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const sign = isNegative ? '-' : '';

  // Millions (>= 1,000,000)
  if (absAmount >= 1000000) {
    return `${sign}${symbol}${(absAmount / 1000000).toFixed(2)}M`;
  }

  // Thousands (>= 1,000)
  if (absAmount >= 1000) {
    return `${sign}${symbol}${(absAmount / 1000).toFixed(1)}K`;
  }

  // Less than 1,000 - show exact amount
  return `${sign}${symbol}${absAmount.toLocaleString()}`;
}

/**
 * Format currency with full precision (always shows exact amount with commas)
 */
export function formatCurrencyFull(amount: number, showSymbol: boolean = true): string {
  const symbol = showSymbol ? '₦' : '';
  return `${symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Format large numbers for charts (axis labels)
 */
export function formatChartAxis(value: number): string {
  if (value >= 1000000) {
    return `₦${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₦${(value / 1000).toFixed(0)}K`;
  }
  return `₦${value}`;
}
