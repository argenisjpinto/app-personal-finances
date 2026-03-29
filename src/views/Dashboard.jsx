import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTransactions } from "../hooks/useTransactions";
import { useSettings } from "../hooks/useSettings";
import { useCurrencies } from "../hooks/useCurrencies";
import { useFinancialAnalytics } from "../hooks/useFinancialAnalytics";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { MonthlyTrendChart } from "../components/dashboard/MonthlyTrendChart";
import { AdvancedMetricsCards } from "../components/dashboard/AdvancedMetricsCards";
import { GoalProgressCard } from "../components/dashboard/GoalProgressCard";
import { CategoryAnalyticsTable } from "../components/dashboard/CategoryAnalyticsTable";
import { ExecutiveView } from "../components/dashboard/ExecutiveView";
import { formatCurrency } from "../utils/formatCurrency";

const toDateInput = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfWeek = (date) => {
  const next = new Date(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfWeek = (date) => {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  return next;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);
const endOfYear = (date) => new Date(date.getFullYear(), 11, 31);

const getPresetRange = (type) => {
  const today = new Date();

  if (type === "week") {
    return {
      startDate: toDateInput(startOfWeek(today)),
      endDate: toDateInput(endOfWeek(today))
    };
  }

  if (type === "year") {
    return {
      startDate: toDateInput(startOfYear(today)),
      endDate: toDateInput(endOfYear(today))
    };
  }

  return {
    startDate: toDateInput(startOfMonth(today)),
    endDate: toDateInput(endOfMonth(today))
  };
};

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatPercent = (value) => {
  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  return `${value.toFixed(1)}%`;
};

function Dashboard() {
  const { user } = useAuth();
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const { t } = useLanguage();
  const { transactions, loading } = useTransactions();
  const settings = useSettings();
  const { currencies } = useCurrencies();
  const activeCurrencies = useMemo(
    () => currencies.filter((currency) => currency.active !== false),
    [currencies]
  );
  const [displayCurrency, setDisplayCurrency] = useState("");
  const [periodType, setPeriodType] = useState("month");
  const [customRange, setCustomRange] = useState(() => getPresetRange("month"));
  const baseCurrency = activeCurrencies.some(
    (currency) => currency.code === displayCurrency
  )
    ? displayCurrency
    : settings?.baseCurrency || activeCurrencies[0]?.code || "USD";

  const dashboardSettings = useMemo(
    () => ({
      ...settings,
      baseCurrency
    }),
    [baseCurrency, settings]
  );

  const activeRange = useMemo(() => {
    if (periodType === "custom") {
      return customRange;
    }

    return getPresetRange(periodType);
  }, [customRange, periodType]);

  const filteredTransactions = useMemo(() => {
    const start = parseDateValue(activeRange.startDate);
    const end = parseDateValue(activeRange.endDate);

    return transactions.filter((transaction) => {
      if (!transaction.date) {
        return false;
      }

      const transactionDate = parseDateValue(transaction.date);

      if (!transactionDate) {
        return false;
      }

      if (start && transactionDate < start) {
        return false;
      }

      if (end && transactionDate > end) {
        return false;
      }

      return true;
    });
  }, [activeRange.endDate, activeRange.startDate, transactions]);

  const analytics = useFinancialAnalytics(filteredTransactions, dashboardSettings);

  const periodLabel = useMemo(() => {
    const locale = "es-AR";
    const start = parseDateValue(activeRange.startDate);
    const end = parseDateValue(activeRange.endDate);

    if (!start && !end) {
      return t("dashboard.latestCycle");
    }

    if (periodType === "month" && start) {
      return new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric"
      }).format(start);
    }

    if (periodType === "year" && start) {
      return new Intl.DateTimeFormat(locale, {
        year: "numeric"
      }).format(start);
    }

    const formatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    if (start && end) {
      return `${formatter.format(start)} - ${formatter.format(end)}`;
    }

    return start ? formatter.format(start) : formatter.format(end);
  }, [activeRange.endDate, activeRange.startDate, periodType, t]);

  if (loading || workspaceLoading || !activeWorkspace) {
    return (
      <div className="dashboard-container">
        <section className="dashboard-panel">
          <div className="panel-kicker">{t("dashboard.loadingKicker")}</div>
          <h2 className="dashboard-panel-title" style={{ marginTop: "14px" }}>
            {t("dashboard.loadingTitle")}
          </h2>
          <p className="panel-description" style={{ marginTop: "10px" }}>
            {t("dashboard.loadingDescription")}
          </p>
        </section>
      </div>
    );
  }

  const periodOptions = [
    { value: "week", label: "Semana" },
    { value: "month", label: "Mes" },
    { value: "year", label: "Año" },
    { value: "custom", label: "Personalizado" }
  ];

  const quickActions = [
    {
      title: t("dashboard.newTransaction"),
      description: t("dashboard.quickActionNewTransaction"),
      to: "/movements",
      icon: "add_circle",
      variant: "adia-button-primary"
    },
    {
      title: t("goals.createTitle"),
      description: t("dashboard.quickActionGoals"),
      to: "/goals#goals-create",
      icon: "savings",
      variant: "adia-button-secondary"
    },
    {
      title: t("settings.currencyManagement"),
      description: t("dashboard.quickActionCurrencies"),
      to: "/settings#settings-currencies",
      icon: "currency_exchange",
      variant: "adia-button-secondary"
    },
    {
      title: t("dashboard.workspacesAction"),
      description: t("dashboard.quickActionWorkspaces"),
      to: "/settings#settings-workspaces",
      icon: "folder_shared",
      variant: "adia-button-secondary"
    }
  ];

  const handlePeriodChange = (nextPeriod) => {
    setPeriodType(nextPeriod);

    if (nextPeriod === "custom" && !customRange.startDate && !customRange.endDate) {
      setCustomRange(getPresetRange("month"));
    }
  };

  return (
    <div className="dashboard-container">
      <section className="dashboard-hero" id="dashboard-overview">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">
            {t("dashboard.welcomeBack", {
              name: user?.displayName?.split(" ")[0] || t("dashboard.fallbackName")
            })}
          </div>
          <h2 className="dashboard-hero-title">
            {t("dashboard.titleBefore")} <strong>{t("dashboard.titleAccent")}</strong>
          </h2>
          <p className="dashboard-hero-text">
            {t("dashboard.description", { period: periodLabel })}
          </p>
          <div className="workspace-inline-summary">
            <span className="settings-tag">{activeWorkspace.workspaceType}</span>
            <span className="transaction-meta">{activeWorkspace.workspaceName}</span>
          </div>

          <div className="goal-frequency-row" style={{ marginTop: "18px" }}>
            {activeCurrencies.map((currency) => (
              <button
                key={currency.code}
                type="button"
                className={
                  baseCurrency === currency.code
                    ? "goal-frequency-button active"
                    : "goal-frequency-button"
                }
                onClick={() => setDisplayCurrency(currency.code)}
              >
                {currency.code}
              </button>
            ))}
          </div>

          <div className="dashboard-period-panel">
            <div className="dashboard-period-head">
              <span className="panel-kicker">Período</span>
              <p className="panel-description">Rango seleccionado: {periodLabel}</p>
            </div>

            <div className="goal-frequency-row">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    periodType === option.value
                      ? "goal-frequency-button active"
                      : "goal-frequency-button"
                  }
                  onClick={() => handlePeriodChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {periodType === "custom" ? (
              <div className="dashboard-period-inputs">
                <div className="transaction-form-field">
                  <label htmlFor="dashboard-period-from">Desde</label>
                  <input
                    id="dashboard-period-from"
                    type="date"
                    value={customRange.startDate}
                    onChange={(event) =>
                      setCustomRange((current) => ({
                        ...current,
                        startDate: event.target.value
                      }))
                    }
                  />
                </div>

                <div className="transaction-form-field">
                  <label htmlFor="dashboard-period-to">Hasta</label>
                  <input
                    id="dashboard-period-to"
                    type="date"
                    value={customRange.endDate}
                    onChange={(event) =>
                      setCustomRange((current) => ({
                        ...current,
                        endDate: event.target.value
                      }))
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <ExecutiveView analytics={analytics} />
      </section>

      <section className="dashboard-kpi-grid" id="dashboard-metrics">
        <article className="metric-card">
          <div className="metric-head">
            <div>
              <p className="metric-label">{t("dashboard.totalBalance")}</p>
              <h3 className="metric-value">
                {formatCurrency(analytics.balance, baseCurrency)}
              </h3>
            </div>
            <div className="metric-icon">
              <span className="material-symbols-outlined">
                account_balance_wallet
              </span>
            </div>
          </div>
          <div>
            <span
              className={
                analytics.monthlyVariation >= 0
                  ? "metric-trend"
                  : "metric-trend metric-trend-danger"
              }
            >
              {formatPercent(analytics.monthlyVariation)}
            </span>
            <p className="metric-footnote" style={{ marginTop: "10px" }}>
              {t("dashboard.vsPreviousMonth")}
            </p>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-head">
            <div>
              <p className="metric-label">{t("dashboard.monthlyIncome")}</p>
              <h3 className="metric-value">
                {formatCurrency(analytics.totalIncome, baseCurrency)}
              </h3>
            </div>
            <div className="metric-icon">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
          </div>
          <div className="metric-progress-track">
            <div className="metric-progress-fill" style={{ width: "74%" }} />
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-head">
            <div>
              <p className="metric-label">{t("dashboard.monthlyExpense")}</p>
              <h3 className="metric-value">
                {formatCurrency(analytics.totalExpense, baseCurrency)}
              </h3>
            </div>
            <div className="metric-icon">
              <span className="material-symbols-outlined">trending_down</span>
            </div>
          </div>
          <div className="metric-progress-track">
            <div
              className="metric-progress-fill"
              style={{
                width: `${Math.min(100, analytics.expenseRatio || 0)}%`,
                background:
                  "linear-gradient(90deg, rgba(255, 180, 171, 0.92) 0%, rgba(255, 143, 132, 0.9) 100%)"
              }}
            />
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-head">
            <div>
              <p className="metric-label">{t("dashboard.savingsScore")}</p>
              <h3 className="metric-value metric-value-emphasis">
                {analytics.financialScore}
                <span style={{ fontSize: "1rem", color: "var(--text-dim)" }}>
                  /100
                </span>
              </h3>
            </div>
            <div className="metric-icon">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
          </div>
          <p className="metric-footnote">{t("dashboard.scoreFootnote")}</p>
        </article>
      </section>

      <div className="dashboard-main-grid">
        <div className="dashboard-main-left">
          <section className="dashboard-panel dashboard-chart-panel">
            <div className="dashboard-panel-header">
              <div className="dashboard-panel-copy">
                <h3 className="dashboard-panel-title">{t("dashboard.incomeVsExpenses")}</h3>
                <p className="panel-description">
                  {t("dashboard.periodSummary", { period: periodLabel, currency: baseCurrency })}
                </p>
              </div>

              <div className="panel-legend">
                <span className="legend-item">
                  <span className="legend-dot legend-income" />
                  {t("dashboard.income")}
                </span>
                <span className="legend-item">
                  <span className="legend-dot legend-expense" />
                  {t("dashboard.expenses")}
                </span>
              </div>
            </div>

            <MonthlyTrendChart analytics={analytics} currency={baseCurrency} />
          </section>

          <section className="dashboard-panel dashboard-flow-panel">
            <div className="dashboard-panel-copy">
              <div className="panel-kicker">{t("movements.kicker")}</div>
              <h3 className="dashboard-panel-title">{t("movements.dashboardCardTitle")}</h3>
              <p className="panel-description">{t("movements.dashboardCardDescription")}</p>
            </div>

            <div className="dashboard-actions-row">
              <Link to="/movements" className="adia-button adia-button-primary">
                {t("dashboard.manageMovements")}
              </Link>
            </div>
          </section>
        </div>

        <div className="dashboard-main-right">
          <GoalProgressCard analytics={analytics} currency={baseCurrency} />
          <CategoryAnalyticsTable analytics={analytics} currency={baseCurrency} />

          <section className="dashboard-side-cta">
            <h4>{t("dashboard.upgradeTitle")}</h4>
            <p>{t("dashboard.upgradeDesc")}</p>
            <Link to="/movements" className="adia-button adia-button-secondary">
              {t("dashboard.goToMovements")}
            </Link>
          </section>
        </div>
      </div>

      <div className="dashboard-secondary-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-copy" style={{ marginBottom: "20px" }}>
            <h3 className="dashboard-panel-title">{t("dashboard.extendedAnalytics")}</h3>
            <p className="panel-description">{t("dashboard.extendedAnalyticsDesc")}</p>
          </div>

          <AdvancedMetricsCards analytics={analytics} currency={baseCurrency} />
        </section>

        <section className="dashboard-panel dashboard-actions-card">
          <div className="dashboard-panel-copy">
            <h3 className="dashboard-panel-title">{t("dashboard.quickActions")}</h3>
            <p className="panel-description">{t("dashboard.quickActionsDesc")}</p>
          </div>

          <div className="dashboard-actions-grid">
            {quickActions.map((action) => (
              <article key={action.title} className="dashboard-quick-action">
                <div className="dashboard-quick-action-head">
                  <span className="metric-icon">
                    <span className="material-symbols-outlined">{action.icon}</span>
                  </span>
                  <div>
                    <h4 className="dashboard-quick-action-title">{action.title}</h4>
                    <p className="dashboard-quick-action-copy">{action.description}</p>
                  </div>
                </div>

                <Link to={action.to} className={`adia-button ${action.variant}`}>
                  {action.title}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export { Dashboard };
