/**
 * Optimized formatters with cached Intl instances
 * These prevent creating new Intl.NumberFormat/DateTimeFormat on every render
 */

// Cached formatter instances
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Optimized format functions
export const formatUSD = (value: string | number | null | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num) || num === 0) return '$0.00';
  return usdFormatter.format(num);
};

export const formatNumber = (value: string | number | null | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return '0';
  return numberFormatter.format(num);
};

export const formatCompactNumber = (value: string | number | null | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return '0';
  if (num >= 1000000000) return compactNumberFormatter.format(num);
  return numberFormatter.format(num);
};

export const formatTokenAmount = (amount?: string | number | null): string => {
  if (!amount) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  // Handle very small amounts with exponential notation
  if (num < 0.001 && num > 0) {
    return num.toExponential(2);
  }
  
  return numberFormatter.format(num);
};

export const formatDateShort = (date: Date | string | number | null | undefined): string => {
  if (!date) return 'Invalid Date';
  
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'number') {
    dateObj = new Date(date * 1000); // Handle Unix timestamp
  } else {
    dateObj = new Date(date);
  }
  
  // Check if date is valid
  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateFormatter.format(dateObj);
};

export const formatPercentage = (value: number | null | undefined): string => {
  if (value === undefined || value === null || isNaN(value)) return '—';
  return percentFormatter.format(value / 100);
};

// Price formatting with appropriate precision
export const formatPrice = (price: number | string | null | undefined): string => {
  const num = typeof price === 'string' ? parseFloat(price) : (price ?? 0);
  if (isNaN(num) || num === 0) return '$0.00';
  
  // Use different precision based on price magnitude
  if (num < 0.01) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(num);
  } else if (num < 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(num);
  } else {
    return usdFormatter.format(num);
  }
};

// Transaction signature truncation
export const formatSignature = (signature: string): string => {
  if (!signature) return '';
  return `${signature.slice(0, 6)}...${signature.slice(-4)}`;
};

// Percentage change with color indication
export const formatPercentageChange = (change?: number | null) => {
  if (change === undefined || change === null || isNaN(change)) {
    return {
      value: '—',
      isPositive: false,
      colorClass: 'text-gray-500',
    };
  }
  
  const isPositive = change >= 0;
  const arrow = isPositive ? '▲' : '▼';
  const colorClass = isPositive 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';
  
  return {
    value: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
    arrow,
    isPositive,
    colorClass,
  };
};

// Market cap and volume formatting
export const formatMarketValue = (value: number | string | null | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num) || num === 0) return '$0';
  
  if (num >= 1e12) {
    return `$${(num / 1e12).toFixed(2)}T`;
  } else if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  }
  
  return formatUSD(num);
};

// Utility for stable object references in formatters
export const createStableFormatResult = <T extends Record<string, any>>(obj: T): T => {
  return Object.freeze(obj);
};
