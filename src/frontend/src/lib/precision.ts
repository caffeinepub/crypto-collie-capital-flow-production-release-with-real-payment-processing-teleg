/**
 * Enhanced adaptive precision formatting utilities for crypto assets
 * Supports up to 8 decimal places with magnitude-based scaling
 * U.S. number formatting with period as decimal separator and comma as thousands separator
 */

/**
 * Determine optimal decimal places based on value magnitude
 * @param value - The number to analyze
 * @returns Optimal number of decimal places (1-8)
 */
export function getOptimalDecimals(value: number): number {
  const absValue = Math.abs(value);
  
  if (absValue === 0) return 2;
  if (absValue >= 1000) return 2;
  if (absValue >= 100) return 3;
  if (absValue >= 10) return 4;
  if (absValue >= 1) return 5;
  if (absValue >= 0.1) return 6;
  if (absValue >= 0.01) return 7;
  return 8;
}

/**
 * Format a number with adaptive decimal places based on magnitude
 * Uses U.S. formatting (period as decimal separator, comma as thousands separator)
 * @param value - The number to format
 * @param options - Optional configuration
 * @returns Formatted string with appropriate precision
 */
export function formatNumber(
  value: number,
  options?: {
    maxDecimals?: number;
    minDecimals?: number;
    forceDecimals?: number;
  }
): string {
  if (!isFinite(value)) return '0';
  
  const decimals = options?.forceDecimals ?? 
    Math.min(
      options?.maxDecimals ?? 8,
      Math.max(
        options?.minDecimals ?? 0,
        getOptimalDecimals(value)
      )
    );
  
  // Format with U.S. locale
  return value.toLocaleString('en-US', {
    minimumFractionDigits: options?.minDecimals ?? 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a currency value with adaptive precision
 * Uses U.S. formatting with $ symbol
 * @param value - The currency value to format
 * @param options - Optional configuration
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  options?: {
    maxDecimals?: number;
    minDecimals?: number;
    forceDecimals?: number;
    useAbbreviation?: boolean;
  }
): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  // Use abbreviations for large values if requested
  if (options?.useAbbreviation) {
    if (absValue >= 1e12) {
      const decimals = options?.forceDecimals ?? 2;
      return `${sign}$${(absValue / 1e12).toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      })}T`;
    }
    
    if (absValue >= 1e9) {
      const decimals = options?.forceDecimals ?? 2;
      return `${sign}$${(absValue / 1e9).toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      })}B`;
    }
    
    if (absValue >= 1e6) {
      const decimals = options?.forceDecimals ?? 2;
      return `${sign}$${(absValue / 1e6).toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      })}M`;
    }
    
    if (absValue >= 1e3) {
      const decimals = options?.forceDecimals ?? 1;
      return `${sign}$${(absValue / 1e3).toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      })}K`;
    }
  }
  
  const decimals = options?.forceDecimals ?? 
    Math.min(
      options?.maxDecimals ?? 8,
      Math.max(
        options?.minDecimals ?? 0,
        getOptimalDecimals(value)
      )
    );
  
  return `${sign}$${absValue.toLocaleString('en-US', {
    minimumFractionDigits: options?.minDecimals ?? 0,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format a percentage value with adaptive precision
 * @param value - The percentage value to format
 * @param options - Optional configuration
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  options?: {
    maxDecimals?: number;
    minDecimals?: number;
    forceDecimals?: number;
    showSign?: boolean;
  }
): string {
  const absValue = Math.abs(value);
  
  // Adaptive decimals for percentages
  let decimals: number;
  if (options?.forceDecimals !== undefined) {
    decimals = options.forceDecimals;
  } else if (absValue >= 10) {
    decimals = Math.min(options?.maxDecimals ?? 2, 2);
  } else if (absValue >= 1) {
    decimals = Math.min(options?.maxDecimals ?? 3, 3);
  } else if (absValue >= 0.1) {
    decimals = Math.min(options?.maxDecimals ?? 4, 4);
  } else {
    decimals = Math.min(options?.maxDecimals ?? 6, 6);
  }
  
  decimals = Math.max(decimals, options?.minDecimals ?? 0);
  
  const sign = options?.showSign !== false && value > 0 ? '+' : '';
  
  return `${sign}${value.toLocaleString('en-US', {
    minimumFractionDigits: options?.minDecimals ?? 0,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Format a price with adaptive precision optimized for crypto assets
 * @param price - The price to format
 * @param options - Optional configuration
 * @returns Formatted price string with appropriate precision
 */
export function formatPrice(
  price: number,
  options?: {
    maxDecimals?: number;
    minDecimals?: number;
    forceDecimals?: number;
    showCurrency?: boolean;
  }
): string {
  if (!isFinite(price)) return options?.showCurrency !== false ? '$0.00' : '0.00';
  
  const absPrice = Math.abs(price);
  const sign = price < 0 ? '-' : '';
  
  const decimals = options?.forceDecimals ?? 
    Math.min(
      options?.maxDecimals ?? 8,
      Math.max(
        options?.minDecimals ?? 0,
        getOptimalDecimals(absPrice)
      )
    );
  
  const formattedNumber = absPrice.toLocaleString('en-US', {
    minimumFractionDigits: options?.minDecimals ?? 0,
    maximumFractionDigits: decimals,
  });
  
  if (options?.showCurrency === false) {
    return `${sign}${formattedNumber}`;
  }
  
  return `${sign}$${formattedNumber}`;
}

/**
 * Format a ratio or multiplier with adaptive precision
 * @param value - The ratio to format
 * @param options - Optional configuration
 * @returns Formatted ratio string
 */
export function formatRatio(
  value: number,
  options?: {
    maxDecimals?: number;
    minDecimals?: number;
    forceDecimals?: number;
    suffix?: string;
  }
): string {
  const decimals = options?.forceDecimals ?? 
    Math.min(
      options?.maxDecimals ?? 8,
      Math.max(
        options?.minDecimals ?? 0,
        getOptimalDecimals(value)
      )
    );
  
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: options?.minDecimals ?? 0,
    maximumFractionDigits: decimals,
  });
  
  return options?.suffix ? `${formatted}${options.suffix}` : formatted;
}

/**
 * Format volume with adaptive precision and optional abbreviation
 * @param volume - The volume value to format
 * @param options - Optional configuration
 * @returns Formatted volume string
 */
export function formatVolume(
  volume: number,
  options?: {
    useAbbreviation?: boolean;
    maxDecimals?: number;
    minDecimals?: number;
  }
): string {
  const absVolume = Math.abs(volume);
  const sign = volume < 0 ? '-' : '';
  
  if (options?.useAbbreviation) {
    if (absVolume >= 1e12) {
      return `${sign}${(absVolume / 1e12).toLocaleString('en-US', { 
        minimumFractionDigits: options?.minDecimals ?? 0,
        maximumFractionDigits: options?.maxDecimals ?? 2 
      })}T`;
    }
    
    if (absVolume >= 1e9) {
      return `${sign}${(absVolume / 1e9).toLocaleString('en-US', { 
        minimumFractionDigits: options?.minDecimals ?? 0,
        maximumFractionDigits: options?.maxDecimals ?? 2 
      })}B`;
    }
    
    if (absVolume >= 1e6) {
      return `${sign}${(absVolume / 1e6).toLocaleString('en-US', { 
        minimumFractionDigits: options?.minDecimals ?? 0,
        maximumFractionDigits: options?.maxDecimals ?? 2 
      })}M`;
    }
    
    if (absVolume >= 1e3) {
      return `${sign}${(absVolume / 1e3).toLocaleString('en-US', { 
        minimumFractionDigits: options?.minDecimals ?? 0,
        maximumFractionDigits: options?.maxDecimals ?? 1 
      })}K`;
    }
  }
  
  const decimals = Math.min(
    options?.maxDecimals ?? 8,
    Math.max(
      options?.minDecimals ?? 0,
      getOptimalDecimals(absVolume)
    )
  );
  
  return `${sign}${absVolume.toLocaleString('en-US', {
    minimumFractionDigits: options?.minDecimals ?? 0,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format market cap with adaptive precision and abbreviation
 * @param marketCap - The market cap value to format
 * @param options - Optional configuration
 * @returns Formatted market cap string
 */
export function formatMarketCap(
  marketCap: number,
  options?: {
    maxDecimals?: number;
    minDecimals?: number;
    showCurrency?: boolean;
  }
): string {
  const absValue = Math.abs(marketCap);
  const sign = marketCap < 0 ? '-' : '';
  const currency = options?.showCurrency !== false ? '$' : '';
  
  if (absValue >= 1e12) {
    const decimals = options?.maxDecimals ?? 2;
    return `${sign}${currency}${(absValue / 1e12).toLocaleString('en-US', { 
      minimumFractionDigits: options?.minDecimals ?? 0,
      maximumFractionDigits: decimals 
    })}T`;
  }
  
  if (absValue >= 1e9) {
    const decimals = options?.maxDecimals ?? 2;
    return `${sign}${currency}${(absValue / 1e9).toLocaleString('en-US', { 
      minimumFractionDigits: options?.minDecimals ?? 0,
      maximumFractionDigits: decimals 
    })}B`;
  }
  
  if (absValue >= 1e6) {
    const decimals = options?.maxDecimals ?? 2;
    return `${sign}${currency}${(absValue / 1e6).toLocaleString('en-US', { 
      minimumFractionDigits: options?.minDecimals ?? 0,
      maximumFractionDigits: decimals 
    })}M`;
  }
  
  const decimals = Math.min(
    options?.maxDecimals ?? 8,
    Math.max(
      options?.minDecimals ?? 0,
      getOptimalDecimals(absValue)
    )
  );
  
  return `${sign}${currency}${absValue.toLocaleString('en-US', {
    minimumFractionDigits: options?.minDecimals ?? 0,
    maximumFractionDigits: decimals,
  })}`;
}
