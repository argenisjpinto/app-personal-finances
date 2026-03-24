import { formatCurrency } from "../../utils/formatCurrency";
import { useLanguage } from "../../context/LanguageContext";

const AdvancedMetricsCards = ({ analytics, currency }) => {
  const { t } = useLanguage();
  const {
    bestMonth,
    worstExpenseMonth,
    averageMonthlyIncome,
    averageMonthlyExpense,
    expenseRatio,
    savingsRate
  } = analytics;

  const cards = [
    {
      title: t("dashboard.bestMonth"),
      value: bestMonth ? bestMonth.month : t("dashboard.noData"),
      footnote: bestMonth
        ? formatCurrency(bestMonth.balance, currency)
        : t("dashboard.addMoreHistory")
    },
    {
      title: t("dashboard.highestExpenseMonth"),
      value: worstExpenseMonth ? worstExpenseMonth.month : t("dashboard.noData"),
      footnote: worstExpenseMonth
        ? formatCurrency(worstExpenseMonth.expense, currency)
        : t("dashboard.noHistoricalExpense")
    },
    {
      title: t("dashboard.averageMonthlyFlow"),
      value: formatCurrency(averageMonthlyIncome, currency),
      footnote: t("dashboard.expensesAvg", {
        value: formatCurrency(averageMonthlyExpense, currency)
      })
    },
    {
      title: t("dashboard.financialRatios"),
      value: t("dashboard.savedRatio", { value: savingsRate.toFixed(1) }),
      footnote: t("dashboard.expenseRatio", {
        value: expenseRatio.toFixed(1)
      })
    }
  ];

  return (
    <div className="advanced-metrics-grid">
      {cards.map((card) => (
        <article key={card.title} className="metric-card metric-card-compact">
          <div>
            <p className="metric-label">{card.title}</p>
            <h4 className="metric-value">{card.value}</h4>
          </div>
          <p className="metric-footnote">{card.footnote}</p>
        </article>
      ))}
    </div>
  );
};

export { AdvancedMetricsCards };
