import { useAuth } from '../context/AuthContext';

export const useCurrency = () => {
  const { user } = useAuth();
  const currencyCode = user?.defaultCurrency || 'INR';

  const getCurrencySymbol = (code = currencyCode) => {
    switch (code) {
      case 'INR':
        return '₹';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'AUD':
        return 'A$';
      case 'CAD':
        return 'C$';
      case 'JPY':
        return '¥';
      default:
        return '₹';
    }
  };

  const formatCurrency = (amount, code = currencyCode) => {
    const symbol = getCurrencySymbol(code);
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return `${symbol}0.00`;
    return `${symbol}${parsed.toFixed(2)}`;
  };

  return {
    currencyCode,
    currencySymbol: getCurrencySymbol(),
    getCurrencySymbol,
    formatCurrency,
  };
};
