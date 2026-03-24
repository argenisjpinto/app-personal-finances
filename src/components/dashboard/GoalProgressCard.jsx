import { formatCurrency } from "../../utils/formatCurrency";
import { useLanguage } from "../../context/LanguageContext";
import { formatGoalRange } from "../../utils/goals";

const GoalProgressCard = ({ analytics, currency }) => {
  const { t, language } = useLanguage();
  const {
    activeGoal,
    savingsGoal,
    expenseLimit,
    currentSavings,
    currentExpenses,
    savingsProgress,
    expenseProgress
  } = analytics;

  const safeSavingsProgress = Math.max(0, Math.min(100, savingsProgress || 0));
  const circumference = 2 * Math.PI * 68;
  const savingsOffset =
    circumference - (circumference * safeSavingsProgress) / 100;

  return (
    <section className="goal-card dashboard-goals-panel" id="dashboard-goals">
      <div className="dashboard-panel-copy">
        <h3 className="dashboard-panel-title">{t("goals.title")}</h3>
        <p className="panel-description">{t("goals.description")}</p>
        {activeGoal ? (
          <p className="transaction-meta">
            {activeGoal.name} · {formatGoalRange(activeGoal, language === "es" ? "es-AR" : "en-US")}
          </p>
        ) : null}
      </div>

      <div className="goal-card-grid">
        <div className="goal-ring-wrap">
          <div className="goal-ring">
            <svg viewBox="0 0 160 160" aria-hidden="true">
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="rgba(53, 52, 54, 1)"
                strokeWidth="10"
              />
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="#00F0FF"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={savingsOffset}
              />
            </svg>

            <div className="goal-ring-center">
              <span className="goal-ring-value">
                {Math.round(safeSavingsProgress)}%
              </span>
              <span className="goal-ring-label">{t("goals.savings")}</span>
            </div>
          </div>

          <p className="goal-caption">
            {savingsGoal > 0 ? (
              <>
                {t("goals.needMore", {
                  value: formatCurrency(
                    Math.max(0, savingsGoal - currentSavings),
                    currency
                  )
                })}
              </>
            ) : (
              t("goals.defineTarget")
            )}
          </p>
        </div>

        <div className="goal-progress-block">
          <div className="goal-progress-head">
            <span>{t("goals.monthlySavings")}</span>
            <strong>
              {formatCurrency(currentSavings, currency)} /{" "}
              {formatCurrency(savingsGoal || 0, currency)}
            </strong>
          </div>
          <div className="goal-progress-track">
            <div
              className="goal-progress-fill"
              style={{ width: `${safeSavingsProgress}%` }}
            />
          </div>
        </div>

        <div className="goal-progress-block">
          <div className="goal-progress-head">
            <span>{t("goals.monthlySpending")}</span>
            <strong>
              {formatCurrency(currentExpenses, currency)} /{" "}
              {formatCurrency(expenseLimit || 0, currency)}
            </strong>
          </div>
          <div className="goal-progress-track">
            <div
              className="goal-progress-fill"
              style={{
                width: `${Math.max(0, Math.min(100, expenseProgress || 0))}%`,
                background:
                  expenseProgress > 100
                    ? "linear-gradient(90deg, rgba(255, 180, 171, 1) 0%, rgba(255, 143, 132, 0.92) 100%)"
                    : "linear-gradient(90deg, #DBFCFF 0%, #00F0FF 100%)"
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export { GoalProgressCard };
