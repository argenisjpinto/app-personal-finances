import { useMemo } from "react";
import { toBaseCurrency } from "../utils/convertCurrency";
import { isTransactionInGoalRange } from "../utils/goals";

export const useFinancialAnalytics = (transactions = [], settings) => {
  return useMemo(() => {
    const normalized = transactions.map((transaction) => {
      const baseAmount = toBaseCurrency(transaction.amount, transaction.currency, settings);

      return {
        ...transaction,
        originalAmount: Number(transaction.amount) || 0,
        baseAmount
      };
    });

    const totalIncome = normalized
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.baseAmount, 0);

    const totalExpense = normalized
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.baseAmount, 0);

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    const monthlyMap = {};

    normalized.forEach((transaction) => {
      if (!transaction.date) {
        return;
      }

      const month = transaction.date.slice(0, 7);

      if (!monthlyMap[month]) {
        monthlyMap[month] = { income: 0, expense: 0 };
      }

      if (transaction.type === "income") {
        monthlyMap[month].income += transaction.baseAmount;
      } else {
        monthlyMap[month].expense += transaction.baseAmount;
      }
    });

    const monthlyTrend = Object.keys(monthlyMap)
      .sort()
      .map((month) => ({
        month,
        income: monthlyMap[month].income,
        expense: monthlyMap[month].expense,
        balance: monthlyMap[month].income - monthlyMap[month].expense
      }));

    const categoryMap = {};

    normalized
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        if (!categoryMap[transaction.category]) {
          categoryMap[transaction.category] = {
            amount: 0,
            transactions: []
          };
        }

        categoryMap[transaction.category].amount += transaction.baseAmount;
        categoryMap[transaction.category].transactions.push(transaction);
      });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
        transactions: data.transactions
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;
    const lastMonth = monthlyTrend.at(-1) || null;
    const previousMonth = monthlyTrend.length > 1 ? monthlyTrend.at(-2) : null;

    let monthlyVariation = 0;

    if (lastMonth && previousMonth) {
      monthlyVariation =
        previousMonth.balance !== 0
          ? ((lastMonth.balance - previousMonth.balance) /
              Math.abs(previousMonth.balance)) *
            100
          : 0;
    }

    const bestMonth =
      monthlyTrend.length > 0
        ? monthlyTrend.reduce((best, current) =>
            current.balance > best.balance ? current : best
          )
        : null;

    const worstExpenseMonth =
      monthlyTrend.length > 0
        ? monthlyTrend.reduce((worst, current) =>
            current.expense > worst.expense ? current : worst
          )
        : null;

    const monthsCount = monthlyTrend.length || 1;
    const averageMonthlyIncome = totalIncome / monthsCount;
    const averageMonthlyExpense = totalExpense / monthsCount;

    let financialScore = 0;

    if (savingsRate >= 20) financialScore += 40;
    else if (savingsRate >= 10) financialScore += 25;
    else if (savingsRate > 0) financialScore += 10;

    const positiveMonths = monthlyTrend.filter((month) => month.balance > 0).length;
    const consistencyRatio = positiveMonths / monthsCount;

    if (consistencyRatio >= 0.75) financialScore += 30;
    else if (consistencyRatio >= 0.5) financialScore += 20;
    else if (consistencyRatio > 0.25) financialScore += 10;

    if (expenseRatio < 70) financialScore += 30;
    else if (expenseRatio < 85) financialScore += 15;

    financialScore = Math.min(100, Math.max(0, financialScore));

    const goals = Array.isArray(settings?.goals) ? settings.goals : [];
    const configuredActiveGoal =
      goals.find((goal) => goal.id === settings?.activeGoalId) ||
      goals.find((goal) => goal.active !== false) ||
      null;

    const currentMonth = monthlyTrend.at(-1) || null;
    const fallbackSavingsGoal = settings?.savingsGoal || 0;
    const expenseLimit = toBaseCurrency(
      settings?.expenseLimit || 0,
      settings?.expenseLimitCurrency || settings?.baseCurrency || "USD",
      settings
    );
    const monthlySavings = currentMonth ? currentMonth.balance : 0;
    const currentExpenses = currentMonth ? currentMonth.expense : 0;

    let currentSavings = monthlySavings;
    let savingsGoal = fallbackSavingsGoal;
    let savingsProgress =
      fallbackSavingsGoal > 0
        ? Math.min(100, (monthlySavings / fallbackSavingsGoal) * 100)
        : 0;

    if (configuredActiveGoal?.targetAmount) {
      const goalTransactions = normalized.filter((transaction) =>
        isTransactionInGoalRange(transaction.date, configuredActiveGoal)
      );

      const goalIncome = goalTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + transaction.baseAmount, 0);

      const goalExpenses = goalTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + transaction.baseAmount, 0);

      currentSavings = goalIncome - goalExpenses;
      savingsGoal = toBaseCurrency(
        Number(configuredActiveGoal.targetAmount) || 0,
        configuredActiveGoal.currency || settings?.baseCurrency || "USD",
        settings
      );
      savingsProgress =
        savingsGoal > 0 ? Math.min(100, (currentSavings / savingsGoal) * 100) : 0;
    }

    const expenseProgress =
      expenseLimit > 0 ? Math.min(100, (currentExpenses / expenseLimit) * 100) : 0;

    let savingsStatus = "neutral";

    if (savingsGoal > 0) {
      if (currentSavings >= savingsGoal) savingsStatus = "good";
      else if (currentSavings >= savingsGoal * 0.7) savingsStatus = "warning";
      else savingsStatus = "bad";
    }

    let expenseStatus = "neutral";

    if (expenseLimit > 0) {
      if (currentExpenses <= expenseLimit * 0.7) expenseStatus = "good";
      else if (currentExpenses <= expenseLimit) expenseStatus = "warning";
      else expenseStatus = "bad";
    }

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
      expenseRatio,
      monthlyTrend,
      categoryBreakdown,
      topCategory,
      monthlyVariation,
      bestMonth,
      worstExpenseMonth,
      averageMonthlyIncome,
      averageMonthlyExpense,
      financialScore,
      activeGoal: configuredActiveGoal,
      savingsGoal,
      expenseLimit,
      expenseLimitCurrency: settings?.expenseLimitCurrency || settings?.baseCurrency || "USD",
      currentSavings,
      currentExpenses,
      savingsProgress,
      expenseProgress,
      savingsStatus,
      expenseStatus
    };
  }, [transactions, settings]);
};
