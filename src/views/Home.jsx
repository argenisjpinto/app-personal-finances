import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";
import financialPlanning from "../assets/financial-planning2.png";
import "../styles/Dashboard.css";

const Home = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const primaryLink = user ? "/dashboard" : "/register-login";

  return (
    <div className="home-container">
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-kicker">{t("home.kicker")}</div>
          <h1 className="home-headline">
            {t("home.titleBefore")} <strong>{t("home.titleAccent")}</strong>
          </h1>
          <p className="home-description">{t("home.description")}</p>

          <div className="home-cta-row">
            <Link to={primaryLink} className="hero-button">
              {user ? t("home.openTerminal") : t("home.getStarted")}
            </Link>
            <Link to="/#features" className="adia-button adia-button-secondary">
              {t("home.explore")}
            </Link>
          </div>

          <div className="home-proof-row">
            <span className="home-proof-pill">{t("home.proofRealtime")}</span>
            <span className="home-proof-pill">{t("home.proofCurrencies")}</span>
            <span className="home-proof-pill">{t("home.proofGoals")}</span>
          </div>

          <div className="home-dashboard-preview" id="intelligence">
            <img
              className="preview-image"
              src={financialPlanning}
              alt="Vista previa de analítica financiera"
            />
          </div>
        </div>
      </section>

      <section className="home-features" id="features">
        <div className="section-heading">
          <h2>{t("home.sectionTitle")}</h2>
          <p>{t("home.sectionDescription")}</p>
        </div>

        <div className="feature-grid">
          <article className="feature-card feature-card-large">
            <div className="feature-icon">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <h3>{t("home.featureInsightTitle")}</h3>
            <p>{t("home.featureInsightDesc")}</p>
          </article>

          <article className="feature-card feature-card-small">
            <div className="feature-icon">
              <span className="material-symbols-outlined">currency_exchange</span>
            </div>
            <h3>{t("home.featureCurrencyTitle")}</h3>
            <p>{t("home.featureCurrencyDesc")}</p>
          </article>

          <article className="feature-card feature-card-small">
            <div className="feature-icon">
              <span className="material-symbols-outlined">track_changes</span>
            </div>
            <h3>{t("home.featureGoalTitle")}</h3>
            <p>{t("home.featureGoalDesc")}</p>
          </article>

          <article className="feature-card feature-card-wide">
            <div>
              <div className="feature-icon">
                <span className="material-symbols-outlined">table_view</span>
              </div>
              <h3>{t("home.featureWorkflowTitle")}</h3>
              <p>{t("home.featureWorkflowDesc")}</p>
            </div>

            <Link to={primaryLink} className="adia-button adia-button-primary">
              {user ? t("home.goToDashboard") : t("home.signInNow")}
            </Link>
          </article>
        </div>
      </section>

      <section className="home-stats">
        <article className="home-stat-card">
          <span className="home-stat-value">3</span>
          <span className="home-stat-label">{t("home.statViews")}</span>
        </article>
        <article className="home-stat-card">
          <span className="home-stat-value">4+</span>
          <span className="home-stat-label">{t("home.statMetrics")}</span>
        </article>
        <article className="home-stat-card">
          <span className="home-stat-value">Excel</span>
          <span className="home-stat-label">{t("home.statExcel")}</span>
        </article>
        <article className="home-stat-card">
          <span className="home-stat-value">100%</span>
          <span className="home-stat-label">{t("home.statCloud")}</span>
        </article>
      </section>
    </div>
  );
};

export { Home };
