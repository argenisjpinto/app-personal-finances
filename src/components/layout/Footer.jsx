import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const Footer = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isAuthPage = location.pathname === "/register-login";
  const isAppRoute =
    !!user &&
    (location.pathname.startsWith("/dashboard") ||
      location.pathname.startsWith("/movements") ||
      location.pathname.startsWith("/goals") ||
      location.pathname.startsWith("/settings"));

  if (isAuthPage || isAppRoute) {
    return null;
  }

  return (
    <footer className="home-final-cta">
      <div className="home-final-cta-card">
        <h2 className="settings-title">{t("footer.title")}</h2>
        <p>{t("footer.description")}</p>
        <div className="home-cta-row">
          <Link to={user ? "/dashboard" : "/register-login"} className="hero-button">
            {user ? t("header.openTerminal") : t("footer.startGoogle")}
          </Link>
          <Link to="/#features" className="adia-button adia-button-secondary">
            {t("footer.explore")}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
