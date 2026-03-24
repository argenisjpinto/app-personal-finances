import { useEffect, useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../hooks/useSettings";
import { useTransactions } from "../hooks/useTransactions";
import { useCurrencies } from "../hooks/useCurrencies";
import { useFinancialAnalytics } from "../hooks/useFinancialAnalytics";
import { useLanguage } from "../context/LanguageContext";
import { formatCurrency } from "../utils/formatCurrency";
import { formatGoalRange, getSuggestedGoalDates, resolveGoalDates } from "../utils/goals";

const defaultGoal = {
  name: "",
  targetAmount: "",
  type: "monthly",
  startDate: "",
  endDate: "",
  currency: ""
};

const createGoalId = () =>
  `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const Goals = () => {
  const { user } = useAuth();
  const settings = useSettings(user);
  const { transactions } = useTransactions(user);
  const { currencies } = useCurrencies(user);
  const { t, language } = useLanguage();
  const analytics = useFinancialAnalytics(transactions, settings);
  const [form, setForm] = useState(defaultGoal);
  const [expenseLimit, setExpenseLimit] = useState(0);
  const [expenseLimitCurrency, setExpenseLimitCurrency] = useState("");
  const [saving, setSaving] = useState(false);

  const goals = useMemo(
    () => (Array.isArray(settings.goals) ? settings.goals : []),
    [settings.goals]
  );
  const activeCurrencies = useMemo(
    () => currencies.filter((currency) => currency.active !== false),
    [currencies]
  );

  useEffect(() => {
    if (form.startDate || form.endDate || form.type === "custom_range" || form.type === "open_ended") {
      return;
    }

    const suggested = getSuggestedGoalDates(form.type);
    setForm((current) => ({ ...current, ...suggested }));
  }, [form.endDate, form.startDate, form.type]);

  useEffect(() => {
    if (form.currency) {
      return;
    }

    setForm((current) => ({
      ...current,
      currency: settings.baseCurrency || activeCurrencies[0]?.code || "USD"
    }));
  }, [activeCurrencies, form.currency, settings.baseCurrency]);

  useEffect(() => {
    setExpenseLimit(settings.expenseLimit || 0);
    setExpenseLimitCurrency(
      settings.expenseLimitCurrency || settings.baseCurrency || activeCurrencies[0]?.code || "USD"
    );
  }, [activeCurrencies, settings.baseCurrency, settings.expenseLimit, settings.expenseLimitCurrency]);

  const saveGoals = async (
    nextGoals,
    activeGoalId = settings.activeGoalId || null,
    nextExpenseLimit = Number(expenseLimit) || 0,
    nextExpenseLimitCurrency = expenseLimitCurrency || settings.baseCurrency || "USD"
  ) => {
    if (!user) {
      return;
    }

    setSaving(true);

    try {
      const settingsReference = doc(db, "users", user.uid, "settings", "config");
      const activeGoal = nextGoals.find((goal) => goal.id === activeGoalId) || null;

      await updateDoc(settingsReference, {
        goals: nextGoals,
        activeGoalId,
        expenseLimit: nextExpenseLimit,
        expenseLimitCurrency: nextExpenseLimitCurrency,
        savingsGoal: activeGoal?.targetAmount || 0
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGoal = async () => {
    const targetAmount = Number(form.targetAmount);

    if (!form.name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      alert(t("goals.formError"));
      return;
    }

    if (form.type === "custom_range" && (!form.startDate || !form.endDate)) {
      alert(t("goals.rangeError"));
      return;
    }

    const resolvedDates = resolveGoalDates(form);
    const newGoal = {
      id: createGoalId(),
      name: form.name.trim(),
      targetAmount,
      currency: form.currency || settings.baseCurrency || "USD",
      type: form.type,
      startDate: resolvedDates.startDate,
      endDate: resolvedDates.endDate,
      active: true,
      createdAt: new Date().toISOString()
    };

    await saveGoals(
      [...goals, newGoal],
      settings.activeGoalId || newGoal.id
    );

    setForm(defaultGoal);
  };

  const handleActivateGoal = async (goalId) => {
    await saveGoals(goals, goalId);
  };

  const handleDeleteGoal = async (goalId) => {
    const nextGoals = goals.filter((goal) => goal.id !== goalId);
    const nextActiveId =
      settings.activeGoalId === goalId ? nextGoals[0]?.id || null : settings.activeGoalId;

    await saveGoals(nextGoals, nextActiveId);
  };

  const handleSaveOperationalGoal = async () => {
    await saveGoals(
      goals,
      settings.activeGoalId || goals[0]?.id || null,
      expenseLimit,
      expenseLimitCurrency
    );
  };

  const baseCurrency = settings.baseCurrency || "USD";
  const locale = language === "es" ? "es-AR" : "en-US";

  return (
    <div className="settings-container goals-container">
      <header className="settings-header">
        <div>
          <div className="settings-tag">{t("goals.manageKicker")}</div>
          <h2 className="settings-title">
            {t("goals.manageTitleBefore")} <strong>{t("goals.manageTitleAccent")}</strong>
          </h2>
          <p className="settings-subtitle">{t("goals.manageDescription")}</p>
        </div>
      </header>

      <div className="settings-grid">
        <div className="settings-column">
          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <h3 className="settings-card-title">{t("goals.createTitle")}</h3>
                <p className="settings-card-copy">{t("goals.createDescription")}</p>
              </div>
            </div>

            <div className="goal-builder-grid">
              <div className="transaction-form-field transaction-form-field-full">
                <label htmlFor="goal-name">{t("goals.goalName")}</label>
                <input
                  id="goal-name"
                  className="settings-input"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder={t("goals.goalNamePlaceholder")}
                />
              </div>

              <div className="transaction-form-field">
                <label htmlFor="goal-target">{t("goals.targetAmount")}</label>
                <input
                  id="goal-target"
                  className="settings-input"
                  type="number"
                  value={form.targetAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      targetAmount: event.target.value
                    }))
                  }
                />
              </div>

              <div className="transaction-form-field">
                <label htmlFor="goal-currency">{t("goals.goalCurrency")}</label>
                <select
                  id="goal-currency"
                  className="settings-select"
                  value={form.currency}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currency: event.target.value
                    }))
                  }
                >
                  {activeCurrencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="transaction-form-field">
                <label htmlFor="goal-type">{t("goals.goalType")}</label>
                <select
                  id="goal-type"
                  className="settings-select"
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value,
                      endDate: event.target.value === "open_ended" ? "" : current.endDate
                    }))
                  }
                >
                  <option value="weekly">{t("goals.typeWeekly")}</option>
                  <option value="monthly">{t("goals.typeMonthly")}</option>
                  <option value="yearly">{t("goals.typeYearly")}</option>
                  <option value="custom_range">{t("goals.typeCustom")}</option>
                  <option value="open_ended">{t("goals.typeOpen")}</option>
                </select>
              </div>

              <div className="transaction-form-field">
                <label htmlFor="goal-start">{t("goals.startDate")}</label>
                <input
                  id="goal-start"
                  className="settings-input"
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startDate: event.target.value
                    }))
                  }
                />
              </div>

              <div className="transaction-form-field">
                <label htmlFor="goal-end">{t("goals.endDate")}</label>
                <input
                  id="goal-end"
                  className="settings-input"
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endDate: event.target.value
                    }))
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="adia-button settings-save-button"
                onClick={handleCreateGoal}
                disabled={saving}
              >
                {t("goals.createAction")}
              </button>
            </div>
          </section>
        </div>

        <div className="settings-column">
          <section className="settings-summary-card">
            <h3>{t("goals.dashboardTitle")}</h3>
            <p className="settings-card-copy">{t("goals.dashboardDescription")}</p>

            <div className="settings-summary-list" style={{ marginTop: "20px" }}>
              <div className="settings-summary-item">
                <span className="settings-summary-label">{t("goals.activeGoal")}</span>
                <span className="settings-summary-value" style={{ fontSize: "1.2rem" }}>
                  {analytics.activeGoal?.name || t("goals.noneActive")}
                </span>
              </div>

              <div className="settings-summary-item">
                <span className="settings-summary-label">{t("goals.currentSaved")}</span>
                <span className="settings-summary-value">
                  {formatCurrency(analytics.currentSavings || 0, baseCurrency)}
                </span>
              </div>

              <div className="settings-summary-item">
                <span className="settings-summary-label">{t("goals.targetAmount")}</span>
                <span className="settings-summary-value">
                  {formatCurrency(
                    analytics.savingsGoal || 0,
                    analytics.activeGoal?.currency || baseCurrency
                  )}
                </span>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <h3 className="settings-card-title">{t("goals.operationalTitle")}</h3>
                <p className="settings-card-copy">{t("goals.operationalDescription")}</p>
                <p className="transaction-meta" style={{ marginTop: "8px" }}>
                  {t("goals.operationalCurrency", { currency: expenseLimitCurrency || baseCurrency })}
                </p>
              </div>
            </div>

            <div className="goal-builder-grid" style={{ marginTop: "4px" }}>
              <div className="transaction-form-field">
                <label htmlFor="expense-limit-currency">{t("goals.goalCurrency")}</label>
                <select
                  id="expense-limit-currency"
                  className="settings-select"
                  value={expenseLimitCurrency}
                  onChange={(event) => setExpenseLimitCurrency(event.target.value)}
                >
                  {activeCurrencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="goal-progress-block">
              <div className="goal-progress-head">
                <span>{t("settings.expenseLimit")}</span>
                <strong>
                  {formatCurrency(Number(expenseLimit || 0), expenseLimitCurrency || baseCurrency)}
                </strong>
              </div>
              <input
                className="settings-input"
                type="number"
                value={expenseLimit}
                onChange={(event) => setExpenseLimit(event.target.value)}
              />
            </div>

            <div style={{ marginTop: "18px" }}>
              <button
                type="button"
                className="adia-button settings-save-button"
                onClick={handleSaveOperationalGoal}
                disabled={saving}
              >
                {t("goals.saveOperational")}
              </button>
            </div>
          </section>
        </div>
      </div>

      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3 className="settings-card-title">{t("goals.listTitle")}</h3>
            <p className="settings-card-copy">{t("goals.listDescription")}</p>
          </div>
        </div>

        <div className="goal-manager-list">
          {goals.length ? (
            goals.map((goal) => {
              const isActive = settings.activeGoalId === goal.id;

              return (
                <article
                  key={goal.id}
                  className={isActive ? "goal-manager-card active" : "goal-manager-card"}
                >
                  <div className="goal-manager-head">
                    <div>
                      <h4 className="goal-manager-title">{goal.name}</h4>
                      <p className="goal-manager-copy">
                        {formatGoalRange(goal, locale)}
                      </p>
                    </div>
                    <span className="settings-tag">
                      {isActive ? t("goals.visibleOnDashboard") : t("goals.available")}
                    </span>
                  </div>

                  <div className="goal-manager-metrics">
                    <span>{formatCurrency(goal.targetAmount, goal.currency || baseCurrency)}</span>
                    <span>{t(`goals.typeLabel.${goal.type}`)}</span>
                  </div>

                  <div className="goal-manager-actions">
                    <button
                      type="button"
                      className={
                        isActive
                          ? "adia-button settings-secondary-button"
                          : "adia-button settings-save-button"
                      }
                      onClick={() => handleActivateGoal(goal.id)}
                    >
                      {isActive ? t("goals.currentDashboardGoal") : t("goals.useOnDashboard")}
                    </button>

                    <button
                      type="button"
                      className="adia-button category-manager-button"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      {t("goals.deleteGoal")}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state">
              <h3>{t("goals.emptyTitle")}</h3>
              <p>{t("goals.emptyDescription")}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export { Goals };
