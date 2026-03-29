const MS_PER_DAY = 24 * 60 * 60 * 1000;

const pad = (value) => String(value).padStart(2, "0");

const parseDateString = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return utcDate;
};

const formatDateString = (date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

const getLastDayOfMonth = (year, monthIndex) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

export const addMonthsToDateString = (value, monthsToAdd) => {
  const baseDate = parseDateString(value);

  if (!baseDate) {
    return value;
  }

  const year = baseDate.getUTCFullYear();
  const monthIndex = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();
  const targetMonthIndex = monthIndex + monthsToAdd;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = getLastDayOfMonth(targetYear, normalizedMonthIndex);
  const targetDay = Math.min(day, lastDay);

  return formatDateString(
    new Date(Date.UTC(targetYear, normalizedMonthIndex, targetDay))
  );
};

export const splitInstallmentAmounts = (totalAmount, installmentCount) => {
  const safeInstallmentCount = Math.max(1, Number(installmentCount) || 1);
  const amountInCents = Math.round((Number(totalAmount) || 0) * 100);
  const baseAmount = Math.trunc(amountInCents / safeInstallmentCount);
  const remainder = amountInCents - baseAmount * safeInstallmentCount;

  return Array.from({ length: safeInstallmentCount }, (_, index) => {
    const cents = baseAmount + (index < remainder ? 1 : 0);
    return cents / 100;
  });
};

const createInstallmentPlanId = () =>
  `plan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const buildInstallmentTransactions = (transaction) => {
  const installmentCount = Math.max(1, Number(transaction.installmentCount) || 1);

  if (transaction.type !== "expense" || installmentCount <= 1) {
    return [
      {
        ...transaction,
        amount: Number(transaction.amount)
      }
    ];
  }

  const planId = createInstallmentPlanId();
  const amounts = splitInstallmentAmounts(transaction.amount, installmentCount);

  return amounts.map((amount, index) => ({
    ...transaction,
    amount,
    date: addMonthsToDateString(transaction.date, index),
    installmentPlanId: planId,
    installmentNumber: index + 1,
    installmentCount,
    installmentTotalAmount: Number(transaction.amount),
    isInstallment: true
  }));
};

export const getInstallmentPreview = (totalAmount, installmentCount) => {
  const amounts = splitInstallmentAmounts(totalAmount, installmentCount);

  return {
    amounts,
    firstAmount: amounts[0] || 0,
    lastAmount: amounts.at(-1) || 0,
    hasRoundingAdjustment: amounts.some((amount) => amount !== amounts[0])
  };
};

export const getInstallmentSummary = (transaction) => {
  if (!transaction?.installmentCount || !transaction?.installmentNumber) {
    return "";
  }

  return `${transaction.installmentNumber}/${transaction.installmentCount}`;
};
