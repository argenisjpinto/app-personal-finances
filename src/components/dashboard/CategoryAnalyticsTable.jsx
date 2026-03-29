import {
  ArcElement,
  Chart as ChartJS,
  Tooltip
} from "chart.js";
import { useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { formatCurrency } from "../../utils/formatCurrency";
import { useLanguage } from "../../context/LanguageContext";
import { Modal } from "../ui/Modal";

ChartJS.register(ArcElement, Tooltip);

const EMPTY_BREAKDOWN = [];

const CATEGORY_COLORS = [
  "#16DBFF",
  "#FFD447",
  "#FF7A59",
  "#46E6B0",
  "#8A7BFF",
  "#FF9F5A",
  "#00C2A8",
  "#F15BB5",
  "#7AE582",
  "#5BC0EB",
  "#C77DFF",
  "#FF6B6B",
  "#3DDAD7",
  "#B8F2E6",
  "#F4A261",
  "#90BE6D",
  "#E76F51",
  "#4D96FF"
];

const getCategoryColor = (index) => {
  if (CATEGORY_COLORS[index]) {
    return CATEGORY_COLORS[index];
  }

  const hue = Math.round((index * 41) % 360);
  return `hsl(${hue} 82% 62%)`;
};

const CategoryAnalyticsTable = ({ analytics, currency }) => {
  const { t, language } = useLanguage();
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const breakdown = analytics?.categoryBreakdown || EMPTY_BREAKDOWN;

  const previewCategories = useMemo(() => {
    if (breakdown.length <= 4) {
      return breakdown;
    }

    const featured = breakdown.slice(0, 4);
    const remaining = breakdown.slice(4);

    return [
      ...featured,
      {
        category: t("categories.others"),
        amount: remaining.reduce((sum, item) => sum + item.amount, 0),
        percentage: remaining.reduce((sum, item) => sum + item.percentage, 0)
      }
    ];
  }, [breakdown, t]);

  if (!breakdown.length) {
    return null;
  }

  const safeActiveCategoryIndex = Math.min(
    activeCategoryIndex,
    Math.max(breakdown.length - 1, 0)
  );
  const activeCategory = breakdown[safeActiveCategoryIndex] || breakdown[0];
  const totalTracked = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const previewGradients = previewCategories
    .map((item, index, array) => {
      const previous = array
        .slice(0, index)
        .reduce((sum, current) => sum + current.percentage, 0);
      const color = getCategoryColor(index);
      return `${color} ${previous}% ${previous + item.percentage}%`;
    })
    .join(", ");
  const styles =
    typeof document !== "undefined"
      ? getComputedStyle(document.body)
      : null;
  const tooltipBackground =
    styles?.getPropertyValue("--surface-low")?.trim() || "#1C1B1C";
  const tooltipText =
    styles?.getPropertyValue("--text-main")?.trim() || "#E5E2E3";
  const chartData = {
    labels: breakdown.map((item) => item.category),
    datasets: [
      {
        data: breakdown.map((item) => item.amount),
        backgroundColor: breakdown.map((_, index) => getCategoryColor(index)),
        borderColor: tooltipBackground,
        borderWidth: 4,
        hoverBorderWidth: 4,
        hoverOffset: 10,
        offset: breakdown.map((_, index) => (index === safeActiveCategoryIndex ? 16 : 0))
      }
    ]
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "66%",
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: tooltipBackground,
        borderColor: "rgba(125, 244, 255, 0.22)",
        borderWidth: 1,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        padding: 12,
        callbacks: {
          label: (context) => {
            const item = breakdown[context.dataIndex];
            return `${formatCurrency(context.raw, currency)} · ${item.percentage.toFixed(1)}%`;
          }
        }
      }
    },
    onHover: (_, elements) => {
      if (elements.length) {
        setActiveCategoryIndex(elements[0].index);
      }
    }
  };
  const locale = language === "es" ? "es-AR" : "en-US";

  return (
    <>
      <section className="category-analytics-card">
        <div className="dashboard-panel-copy">
          <h3 className="dashboard-panel-title">{t("categories.title")}</h3>
          <p className="panel-description">{t("categories.description")}</p>
        </div>

        <div className="category-analytics-wrap">
          <div
            className="category-analytics-ring"
            style={{ background: `conic-gradient(${previewGradients})` }}
          >
            <span>{t("categories.thisMonth")}</span>
          </div>

          <div className="category-analytics-list">
            {previewCategories.map((item, index) => (
              <div key={item.category} className="category-analytics-row">
                <div className="category-analytics-left">
                  <span
                    className="category-analytics-dot"
                    style={{ background: getCategoryColor(index) }}
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

        <button
          type="button"
          className="adia-button category-analytics-button"
          onClick={() => setShowDetailedReport(true)}
        >
          {t("categories.viewDetailed")}
        </button>
      </section>

      <Modal
        open={showDetailedReport}
        onClose={() => setShowDetailedReport(false)}
        contentClassName="category-report-modal"
      >
        <section className="category-report-shell">
          <div className="category-report-header">
            <div>
              <div className="panel-kicker">{t("categories.title")}</div>
              <h3 className="dashboard-panel-title">{t("categories.reportTitle")}</h3>
              <p className="panel-description">{t("categories.reportDescription")}</p>
            </div>

            <button
              type="button"
              className="transaction-form-close"
              onClick={() => setShowDetailedReport(false)}
              aria-label={t("categories.closeReport")}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="category-report-summary">
            <article className="category-report-stat">
              <span>{t("categories.totalSpent")}</span>
              <strong>{formatCurrency(totalTracked, currency)}</strong>
            </article>
            <article className="category-report-stat">
              <span>{t("categories.totalCategories")}</span>
              <strong>{new Intl.NumberFormat(locale).format(breakdown.length)}</strong>
            </article>
            <article className="category-report-stat">
              <span>{t("categories.topCategory")}</span>
              <strong>{breakdown[0]?.category || "-"}</strong>
            </article>
          </div>

          <div className="category-report-layout">
            <div className="category-report-visual">
              <div className="category-report-chart-card">
                <div className="category-report-chart">
                  <Doughnut data={chartData} options={chartOptions} />
                  <div className="category-report-center">
                    <small>{t("categories.centerLabel")}</small>
                    <strong>{activeCategory.percentage.toFixed(1)}%</strong>
                    <span>{activeCategory.category}</span>
                    <em>{formatCurrency(activeCategory.amount, currency)}</em>
                  </div>
                </div>
              </div>
            </div>

            <div className="category-report-list">
              {breakdown.map((item, index) => (
                <button
                  key={item.category}
                  type="button"
                  className={
                    index === safeActiveCategoryIndex
                      ? "category-report-row active"
                      : "category-report-row"
                  }
                  onClick={() => setActiveCategoryIndex(index)}
                >
                  <div className="category-report-row-main">
                    <div className="category-report-row-label">
                      <span
                        className="category-analytics-dot"
                        style={{ background: getCategoryColor(index) }}
                      />
                      <strong>{item.category}</strong>
                    </div>
                    <strong>{item.percentage.toFixed(1)}%</strong>
                  </div>

                  <div className="category-report-row-meta">
                    <span>{formatCurrency(item.amount, currency)}</span>
                    <div className="category-report-bar">
                      <div
                        className="category-report-bar-fill"
                        style={{
                          width: `${Math.max(item.percentage, 1)}%`,
                          background: getCategoryColor(index)
                        }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </Modal>
    </>
  );
};

export { CategoryAnalyticsTable };
