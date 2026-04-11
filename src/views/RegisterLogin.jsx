import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";
import adiaFinanceLogo from "../assets/adia-logo-fondo.png";
import "../styles/Dashboard.css";

const RegisterLogin = () => {
  const { login, loginAsGuest, user } = useAuth();
  const { t } = useLanguage();
  const [loggingIn, setLoggingIn] = useState(false);
  const [enteringAsGuest, setEnteringAsGuest] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    try {
      setLoggingIn(true);
      await login();
    } finally {
      setLoggingIn(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setEnteringAsGuest(true);
      await loginAsGuest();
    } finally {
      setEnteringAsGuest(false);
    }
  };

  return (
    <div className="login-view">
      <main className="login-card-shell">
        <div className="login-brand">
          <div className="login-brand-mark">
            <img src={adiaFinanceLogo} alt="Adia Finance" className="login-brand-logo" />
          </div>
          <div>
            <h1 className="adia-brand-title">Adia Finance</h1>
            <p className="login-subtitle">{t("login.brandSubtitle")}</p>
          </div>
        </div>

        <section className="login-card">
          <div className="login-status-pill">{t("login.secureGoogle")}</div>
          <h2 className="login-title">
            {t("login.titleBefore")} <strong>{t("login.titleAccent")}</strong>
          </h2>
          <p className="login-subtitle">{t("login.subtitle")}</p>

          <div className="login-action-stack">
            <button
              className="login-google-button"
              type="button"
              onClick={handleLogin}
              disabled={loggingIn || enteringAsGuest}
            >
              <span className="login-google-badge">G</span>
              <span>{loggingIn ? t("login.loading") : t("login.google")}</span>
            </button>

            <button
              className="adia-button adia-button-secondary login-guest-button"
              type="button"
              onClick={handleGuestLogin}
              disabled={loggingIn || enteringAsGuest}
            >
              <span className="material-symbols-outlined">devices</span>
              <span>{enteringAsGuest ? t("login.guestLoading") : t("login.guest")}</span>
            </button>
          </div>

          <p className="login-card-copy">
            {t("login.copyBefore")} <strong>{t("login.copyAccent")}</strong>{" "}
            {t("login.copyAfter")}
          </p>
        </section>

        <div className="login-status-row">
          <div className="login-status-pill">{t("login.firebase")}</div>
          <div className="login-status-pill">{t("login.cloud")}</div>
          <div className="login-status-pill">{t("login.local")}</div>
          <div className="login-status-pill">{t("login.dark")}</div>
        </div>
      </main>
    </div>
  );
};

export { RegisterLogin };
