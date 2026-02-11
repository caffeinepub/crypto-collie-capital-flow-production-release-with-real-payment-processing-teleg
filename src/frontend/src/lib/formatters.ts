/**
 * Legacy formatters maintained for backward compatibility
 * New code should use precision.ts for adaptive decimal scaling
 */

import { formatCurrency as formatCurrencyPrecise, formatPercentage as formatPercentagePrecise } from './precision';

/**
 * Formats numbers using U.S. abbreviations
 * - "K" for thousands
 * - "M" for millions
 * - "B" for billions
 * - "T" for trillions
 * 
 * @deprecated Use formatCurrency from precision.ts with useAbbreviation option
 */
export function formatPortugueseNumber(value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  forceDecimals?: boolean;
}): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  // Trillions - 1,000,000,000,000+
  if (absValue >= 1e12) {
    const trillions = absValue / 1e12;
    const decimals = options?.forceDecimals 
      ? (options.maximumFractionDigits ?? 2)
      : (trillions >= 100 ? 0 : trillions >= 10 ? 1 : 2);
    return `${sign}${trillions.toLocaleString('en-US', {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: decimals
    })}T`;
  }
  
  // Billions - 1,000,000,000+
  if (absValue >= 1e9) {
    const billions = absValue / 1e9;
    const decimals = options?.forceDecimals
      ? (options.maximumFractionDigits ?? 2)
      : (billions >= 100 ? 0 : billions >= 10 ? 1 : 2);
    return `${sign}${billions.toLocaleString('en-US', {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: decimals
    })}B`;
  }
  
  // Millions - 1,000,000+
  if (absValue >= 1e6) {
    const millions = absValue / 1e6;
    const decimals = options?.forceDecimals
      ? (options.maximumFractionDigits ?? 2)
      : (millions >= 100 ? 0 : millions >= 10 ? 1 : 2);
    return `${sign}${millions.toLocaleString('en-US', {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: decimals
    })}M`;
  }
  
  // Thousands - 1,000+
  if (absValue >= 1e3) {
    const thousands = absValue / 1e3;
    const decimals = options?.maximumFractionDigits ?? 1;
    return `${sign}${thousands.toLocaleString('en-US', {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: decimals
    })}K`;
  }
  
  // Less than 1,000 - use adaptive precision
  const decimals = options?.maximumFractionDigits ?? 2;
  return `${sign}${absValue.toLocaleString('en-US', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: decimals
  })}`;
}

/**
 * Formats currency values with U.S. abbreviations
 * Adds $ prefix and uses U.S. number formatting
 * 
 * @deprecated Use formatCurrency from precision.ts with useAbbreviation option
 */
export function formatPortugueseCurrency(value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  forceDecimals?: boolean;
}): string {
  return formatCurrencyPrecise(value, {
    useAbbreviation: true,
    minDecimals: options?.minimumFractionDigits,
    maxDecimals: options?.maximumFractionDigits,
    forceDecimals: options?.forceDecimals ? options.maximumFractionDigits : undefined,
  });
}

/**
 * Formats percentage values with sign
 * 
 * @deprecated Use formatPercentage from precision.ts
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return formatPercentagePrecise(value, {
    forceDecimals: decimals,
    showSign: true,
  });
}
