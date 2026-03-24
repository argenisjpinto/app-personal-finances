import { useAuth } from "../context/AuthContext";
import { BaseCurrencyForm } from "../components/settings/BaseCurrencyForm";
import { CurrencyManager } from "../components/settings/CurrencyManager";
import { CategoryManager } from "../components/settings/CategoryManager";
import { useCategories } from "../hooks/useCategories";
import { useCurrencies } from "../hooks/useCurrencies";
import { useSettings } from "../hooks/useSettings";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";
import "../styles/Dashboard.css";

const Settings = () => {
  const { user } = useAuth();
  const { currencies } = useCurrencies(user);
  const { categories } = useCategories(user);
  const settings = useSettings(user);
  const { language, setLanguage, t } = useLanguage();

  if (!user) {
    return null;
  }

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div>
          <div className="settings-tag">{t("settings.kicker")}</div>
          <h2 className="settings-title">
            {t("settings.titleBefore")} <strong>{t("settings.titleAccent")}</strong>
          </h2>
          <p className="settings-subtitle">{t("settings.subtitle")}</p>
        </div>
      </header>

      <div className="settings-grid">
        <div className="settings-column">
          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <h3 className="settings-card-title">{t("settings.languageTitle")}</h3>
                <p className="settings-card-copy">{t("settings.languageDesc")}</p>
              </div>
            </div>

            <div className="goal-frequency-row">
              <button
                type="button"
                className={
                  language === "es"
                    ? "goal-frequency-button active"
                    : "goal-frequency-button"
                }
                onClick={() => setLanguage("es")}
              >
                {t("settings.languageSpanish")}
              </button>
            </div>
          </section>

          <BaseCurrencyForm />
          <CurrencyManager />
          <CategoryManager />
        </div>

        <div className="settings-column">
          <section className="settings-summary-card">
            <h3>{t("settings.summaryTitle")}</h3>
            <p className="settings-card-copy">{t("settings.summaryDesc")}</p>

            <div className="settings-summary-list" style={{ marginTop: "20px" }}>
              <div className="settings-summary-item">
                <span className="settings-summary-label">{t("settings.baseCurrency")}</span>
                <span className="settings-summary-value">
                  {settings.baseCurrency || "USD"}
                </span>
              </div>

              <div className="settings-summary-item">
                <span className="settings-summary-label">
                  {t("settings.activeCurrencies")}
                </span>
                <span className="settings-summary-value">
                  {currencies.filter((currency) => currency.active !== false).length}
                </span>
              </div>

              <div className="settings-summary-item">
                <span className="settings-summary-label">
                  {t("settings.activeCategories")}
                </span>
                <span className="settings-summary-value">{categories.length}</span>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-section-copy">
              <h3 className="settings-card-title">{t("settings.goalsMovedTitle")}</h3>
              <p>{t("settings.goalsMovedDesc")}</p>
            </div>

            <div style={{ marginTop: "18px" }}>
              <Link to="/goals" className="adia-button adia-button-primary">
                {t("settings.goalsMovedAction")}
              </Link>
            </div>
          </section>
        </div>
      </div>

      <footer className="settings-footer">
        <span>{t("settings.privacy")}</span>
        <span>{t("settings.apiReady")}</span>
        <span>{t("settings.protocol")}</span>
      </footer>
    </div>
  );
};

export { Settings };
