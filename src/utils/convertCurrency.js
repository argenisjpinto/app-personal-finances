export const toUSD = (amount, currency, settings) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 0;

  if (!settings?.rates) return numericAmount;

  if (!currency || currency === "USD") return numericAmount;

  const rate = Number(settings.rates[currency]);

  if (!Number.isFinite(rate) || rate <= 0) {
    return numericAmount;
  }
  
  // rates[currency] = cuántas unidades de esa moneda equivalen a 1 USD
  // Para convertir a USD => dividir
  return numericAmount / rate;
};


export const toBaseCurrency = (amount, currency, settings) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 0;

  if (!settings?.rates) return numericAmount;

  const usd = toUSD(numericAmount, currency, settings);
  if (!Number.isFinite(usd)) return 0;

  const base = settings.baseCurrency || "USD";

  if (base === "USD") return usd;

  const baseRate = Number(settings.rates[base]);

  if (!Number.isFinite(baseRate) || baseRate <= 0) {
    return usd;
  }

  // USD -> moneda base
  return usd * baseRate;
};