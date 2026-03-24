import { useLanguage } from "../../context/LanguageContext";

const ExecutiveView = ({ analytics }) => {
  const { t } = useLanguage();

  if (!analytics) {
    return null;
  }

  const { monthlyVariation, topCategory, financialScore, savingsProgress } =
    analytics;

  let message = t("dashboard.aiStable");

  if (monthlyVariation > 0) {
    message = t("dashboard.aiImproved", {
      value: monthlyVariation.toFixed(1)
    });
  } else if (monthlyVariation < 0) {
    message = t("dashboard.aiDropped", {
      value: Math.abs(monthlyVariation).toFixed(1)
    });
  }

  if (topCategory?.category) {
    message += ` ${t("dashboard.aiTopCategory", {
      category: topCategory.category
    })}`;
  }

  if (savingsProgress >= 100) {
    message += ` ${t("dashboard.aiGoalReached")}`;
  } else if (financialScore >= 80) {
    message += ` ${t("dashboard.aiStrongScore")}`;
  }

  return (
    <aside className="dashboard-ai-card">
      <div className="panel-kicker">{t("dashboard.aiKicker")}</div>
      <h3 className="dashboard-panel-title" style={{ marginTop: "14px" }}>
        {t("dashboard.aiTitle")}
      </h3>
      <p className="panel-description" style={{ marginTop: "10px" }}>
        {message}
      </p>
    </aside>
  );
};

export { ExecutiveView };
