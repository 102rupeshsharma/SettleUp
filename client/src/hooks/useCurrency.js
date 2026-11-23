import { useAuth } from '../context/AuthContext';

const SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
};

/*
 * Pass a group's currency when showing that group's amounts. Without an
 * argument the hook falls back to the signed-in user's default currency.
 */
export const useCurrency = (overrideCode) => {
  const { user } = useAuth();
  const currencyCode = overrideCode || user?.defaultCurrency || 'INR';

  const getCurrencySymbol = (code = currencyCode) => SYMBOLS[code] || code;

  const formatCurrency = (amount, code = currencyCode) => {
    const parsed = parseFloat(amount);
    const value = isNaN(parsed) ? 0 : parsed;
    try {
      return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: code,
      }).format(value);
    } catch {
      return `${getCurrencySymbol(code)}${value.toFixed(2)}`;
    }
  };

  return {
    currencyCode,
    currencySymbol: getCurrencySymbol(),
    getCurrencySymbol,
    formatCurrency,
  };
};
