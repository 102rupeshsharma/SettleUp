// Formats an amount in a group's currency for notifications, emails and the
// activity log, e.g. formatMoney(1200, 'INR') -> "₹1,200.00".
export const formatMoney = (amount, currency = 'INR') => {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};
