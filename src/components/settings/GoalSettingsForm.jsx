import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../hooks/useSettings";
import { useLanguage } from "../../context/LanguageContext";

const GoalSettingsForm = () => {
  const { user } = useAuth();
  const settings = useSettings(user);
  const { t } = useLanguage();
  const locale = "es-AR";
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [expenseLimit, setExpenseLimit] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setSavingsGoal(settings.savingsGoal || 0);
    setExpenseLimit(settings.expenseLimit || 0);
  }, [settings]);

  const handleSave = async () => {
    if (!user) {
      return;
    }

    try {
      setSaving(true);

      const settingsReference = doc(db, "users", user.uid, "settings", "config");
      await updateDoc(settingsReference, {
        savingsGoal: Number(savingsGoal),
        expenseLimit: Number(expenseLimit)
      });

      alert(t("settings.goalsSaved"));
    } catch (error) {
      console.error("Error guardando metas:", error);
      alert(t("settings.goalsError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <h3 className="settings-card-title">{t("settings.financialGoals")}</h3>
          <p className="settings-card-copy">{t("settings.financialGoalsDesc")}</p>
        </div>
      </div>

      <div className="goal-progress-block">
        <div className="goal-progress-head">
          <span>{t("settings.monthlySavingsTarget")}</span>
          <strong>{Number(savingsGoal || 0).toLocaleString(locale)}</strong>
        </div>
        <input
          className="settings-input"
          type="number"
          value={savingsGoal}
          onChange={(event) => setSavingsGoal(event.target.value)}
        />
      </div>

      <div className="goal-progress-block" style={{ marginTop: "18px" }}>
        <div className="goal-progress-head">
          <span>{t("settings.monthlyExpenseLimit")}</span>
          <strong>{Number(expenseLimit || 0).toLocaleString(locale)}</strong>
        </div>
        <input
          className="settings-input"
          type="number"
          value={expenseLimit}
          onChange={(event) => setExpenseLimit(event.target.value)}
        />
      </div>

      <div className="goal-frequency-row" style={{ marginTop: "18px" }}>
        <button type="button" className="goal-frequency-button active">
          {t("settings.monthly")}
        </button>
        <button type="button" className="goal-frequency-button" disabled>
          {t("settings.quarterly")}
        </button>
        <button type="button" className="goal-frequency-button" disabled>
          {t("settings.yearly")}
        </button>
      </div>

      <div style={{ marginTop: "18px" }}>
        <button
          type="button"
          className="adia-button settings-save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t("settings.saving") : t("settings.saveGoals")}
        </button>
      </div>
    </section>
  );
};

export { GoalSettingsForm };
