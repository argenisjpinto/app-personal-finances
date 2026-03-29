import { useState } from "react";
import { formatCurrency } from "../../utils/formatCurrency";
import { useLanguage } from "../../context/LanguageContext";

const DEFAULT_COLORS = ["#00F0FF", "#FED639", "#353436", "#7DF4FF"];

const CategoryAnalyticsTable = ({ analytics, currency }) => {
  const { t } = useLanguage();
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const breakdown = analytics?.categoryBreakdown || [];
  const topCategories = breakdown.slice(0, 3);
  const visibleCategories = showDetailedReport ? breakdown : topCategories;

  if (!topCategories.length) {
    return null;
  }

  const gradients = topCategories
    .map((item, index, array) => {
      const previous = array
        .slice(0, index)
        .reduce((sum, current) => sum + current.percentage, 0);
      const color = DEFAULT_COLORS[index] || DEFAULT_COLORS.at(-1);
      return `${color} ${previous}% ${previous + item.percentage}%`;
    })
    .join(", ");

  return (
    <section className="category-analytics-card">
      <div className="dashboard-panel-copy">
        <h3 className="dashboard-panel-title">{t("categories.title")}</h3>
        <p className="panel-description">{t("categories.description")}</p>
      </div>

      <div className="category-analytics-wrap">
        <div
          className="category-analytics-ring"
          style={{ background: `conic-gradient(${gradients})` }}
        >
          <span>{t("categories.thisMonth")}</span>
        </div>

        <div className="category-analytics-list">
          {visibleCategories.map((item, index) => (
            <div key={item.category} className="category-analytics-row">
              <div className="category-analytics-left">
                <span
                  className="category-analytics-dot"
                  style={{ background: DEFAULT_COLORS[index] || DEFAULT_COLORS.at(-1) }}
                />
                <div>
                  <strong>{index + 1}. {item.category}</strong>
                  <div className="transaction-meta">
                    {formatCurrency(item.amount, currency)}
                  </div>
                </div>
              </div>
              <strong>{item.percentage.toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </div>

      {breakdown.length > 3 ? (
        <button
          type="button"
          className="adia-button category-analytics-button"
          onClick={() => setShowDetailedReport((current) => !current)}
          aria-expanded={showDetailedReport}
        >
          {showDetailedReport
            ? t("categories.hideDetailed")
            : t("categories.viewDetailed")}
        </button>
      ) : null}
    </section>
  );
};

export { CategoryAnalyticsTable };
