import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatCurrency } from "../../utils/formatCurrency";
import { useLanguage } from "../../context/LanguageContext";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const MonthlyTrendChart = ({ analytics, currency }) => {
  const { t, language } = useLanguage();
  const monthlyTrend = analytics?.monthlyTrend || [];
  const styles =
    typeof document !== "undefined"
      ? getComputedStyle(document.body)
      : null;
  const tickColor =
    styles?.getPropertyValue("--text-dim")?.trim() || "rgba(82, 102, 115, 0.8)";
  const gridColor =
    styles?.getPropertyValue("--outline-soft")?.trim() || "rgba(73, 104, 128, 0.18)";
  const tooltipBackground =
    styles?.getPropertyValue("--surface-low")?.trim() || "#1C1B1C";
  const tooltipText =
    styles?.getPropertyValue("--text-main")?.trim() || "#E5E2E3";

  const labels = monthlyTrend.map((item) => {
    const [year, month] = item.month.split("-");
    return new Intl.DateTimeFormat(language === "es" ? "es-AR" : "en-US", {
      month: "short"
    }).format(new Date(Number(year), Number(month) - 1, 1));
  });

  const data = {
    labels,
    datasets: [
      {
        label: t("dashboard.income"),
        data: monthlyTrend.map((item) => item.income),
        backgroundColor: "rgba(0, 240, 255, 0.16)",
        borderColor: "#00F0FF",
        borderWidth: 1.5,
        borderRadius: 10,
        borderSkipped: false
      },
      {
        label: t("dashboard.expenses"),
        data: monthlyTrend.map((item) => item.expense),
        backgroundColor: "rgba(255, 180, 171, 0.12)",
        borderColor: "rgba(255, 180, 171, 0.85)",
        borderWidth: 1.5,
        borderRadius: 10,
        borderSkipped: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false
    },
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
          label: (context) =>
            `${context.dataset.label}: ${formatCurrency(
              context.raw,
              currency || "USD"
            )}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: tickColor,
          autoSkip: true,
          maxTicksLimit: 6,
          font: {
            size: 11,
            weight: "700"
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor
        },
        ticks: {
          color: tickColor,
          maxTicksLimit: 5,
          callback: (value) => formatCurrency(value, currency || "USD")
        }
      }
    }
  };

  return (
    <div className="chart-shell">
      <Bar data={data} options={options} />
    </div>
  );
};

export { MonthlyTrendChart };
