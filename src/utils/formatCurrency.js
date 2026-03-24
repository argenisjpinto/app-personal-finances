export const formatCurrency = (amount, currency = "USD", locale = "en-US") => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return "0";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol"
  }).format(numericAmount);
};