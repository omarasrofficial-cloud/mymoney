// src/utils/currency.ts

/**
 * Formats a number using Bangladeshi grouping (e.g. ৳ 1,25,000)
 * South Asian numbering system:
 * - Last 3 digits (hundreds)
 * - Then groups of 2 digits (thousands, lakhs, crores)
 */
export function formatBDT(amount: number | undefined | null, includeDecimals = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '৳ 0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let integerPart: string;
  let decimalPart = '';

  if (includeDecimals) {
    const parts = absAmount.toFixed(2).split('.');
    integerPart = parts[0];
    decimalPart = '.' + parts[1];
  } else {
    // Round to nearest integer if not including decimals or if integer
    if (Number.isInteger(absAmount)) {
      integerPart = Math.floor(absAmount).toString();
    } else {
      const parts = absAmount.toFixed(2).split('.');
      integerPart = parts[0];
      decimalPart = '.' + parts[1];
    }
  }

  // Bangladeshi grouping logic
  let formattedInteger = '';
  if (integerPart.length <= 3) {
    formattedInteger = integerPart;
  } else {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const remaining = integerPart.substring(0, integerPart.length - 3);
    
    // Group remaining by 2 digits from right to left
    const groups: string[] = [];
    let rem = remaining;
    while (rem.length > 2) {
      groups.unshift(rem.substring(rem.length - 2));
      rem = rem.substring(0, rem.length - 2);
    }
    if (rem.length > 0) {
      groups.unshift(rem);
    }
    
    formattedInteger = `${groups.join(',')},${lastThree}`;
  }

  const sign = isNegative ? '-' : '';
  return `${sign}৳ ${formattedInteger}${decimalPart}`;
}

/**
 * Formats a plain number without currency symbol
 */
export function formatBDTPlain(amount: number): string {
  const formatted = formatBDT(amount);
  return formatted.replace(/[৳\s-]/g, '');
}

/**
 * Parse string to clean number
 */
export function parseAmount(val: string | number): number {
  if (typeof val === 'number') return val;
  const clean = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
