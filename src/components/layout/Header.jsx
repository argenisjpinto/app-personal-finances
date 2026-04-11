import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useDarkMode } from "../../hooks/useDarkMode";
import { useSettings } from "../../hooks/useSettings";
import { useLanguage } from "../../context/LanguageContext";
import "../../styles/Dashboard.css";

const renderWorkspaceSwitch = (workspaces, activeWorkspace, onChange) => (
  <div className="workspace-switcher">
    {workspaces.map((workspace) => (
      <button
        key={workspace.workspaceId}
        type="button"
        className={
          workspace.workspaceId === activeWorkspace?.workspaceId
            ? "workspace-switcher-button active"
            : "workspace-switcher-button"
        }
        onClick={() => onChange(workspace.workspaceId)}
      >
        <span>{workspace.workspaceName}</span>
        <small>{workspace.workspaceType}</small>
      </button>
    ))}
  </div>
);

const Header = () => {
  const { logout, user } = useAuth();
  const { activeWorkspace, setActiveWorkspaceId, workspaces } = useWorkspace();
  const { darkMode, setDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useSettings();
  const { t } = useLanguage();

  const isAuthPage = location.pathname === "/register-login";
  const isAppRoute =
    !!user &&
    (location.pathname.startsWith("/dashboard") ||
      location.pathname.startsWith("/movements") ||
      location.pathname.startsWith("/goals") ||
      location.pathname.startsWith("/settings"));

  const displayName = user?.displayName?.split(" ")[0] || "Adia";
  const avatarLabel = displayName.slice(0, 1).toUpperCase();
  const baseCurrency = settings?.baseCurrency || "USD";
  const isMovementsRoute = location.pathname.startsWith("/movements");
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const visibleWorkspaces = workspaces;

  const openTransactionModal = () => {
    window.dispatchEvent(new CustomEvent("open-transaction-modal"));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  if (isAuthPage) {
    return null;
  }

  if (isAppRoute) {
    return (
      <>
        <aside className="app-sidebar">
          <Link to="/dashboard" className="adia-brand">
            <span className="adia-brand-mark">
              <span className="material-symbols-outlined">insights</span>
            </span>
            <span className="adia-brand-copy">
              <span className="adia-brand-title">Adia Finance</span>
              <span className="adia-brand-subtitle">{t("header.brandSubtitleApp")}</span>
            </span>
          </Link>

          <nav className="app-sidebar-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "app-sidebar-link active" : "app-sidebar-link"
              }
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span>{t("header.dashboard")}</span>
            </NavLink>

            <NavLink
              to="/movements"
              className={({ isActive }) =>
                isActive ? "app-sidebar-link active" : "app-sidebar-link"
              }
            >
              <span className="material-symbols-outlined">swap_horiz</span>
              <span>{t("header.transactions")}</span>
            </NavLink>

            <NavLink
              to="/goals"
              className={({ isActive }) =>
                isActive ? "app-sidebar-link active" : "app-sidebar-link"
              }
            >
              <span className="material-symbols-outlined">track_changes</span>
              <span>{t("header.goals")}</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? "app-sidebar-link active" : "app-sidebar-link"
              }
            >
              <span className="material-symbols-outlined">settings</span>
              <span>{t("header.settings")}</span>
            </NavLink>
          </nav>

          {activeWorkspace && visibleWorkspaces.length ? (
            <section className="sidebar-workspaces-card">
              <p className="sidebar-health-title">Espacios</p>
              {renderWorkspaceSwitch(visibleWorkspaces, activeWorkspace, setActiveWorkspaceId)}
            </section>
          ) : null}

          <div className="sidebar-health-card">
            <p className="sidebar-health-title">{t("header.portfolioHealth")}</p>
            <div className="sidebar-health-track">
              <div className="sidebar-health-fill" style={{ width: "84%" }} />
            </div>
            <p className="sidebar-health-status">{t("header.excellentStatus")}</p>
          </div>

          <button className="app-sidebar-action" type="button">
            <span className="material-symbols-outlined">help</span>
            <span>{t("header.support")}</span>
          </button>

          <button className="app-sidebar-action" type="button" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>{t("header.logout")}</span>
          </button>
        </aside>

        <header className="app-topbar">
          <div className="app-topbar-main">
            <div className="app-topbar-left">
              <div className="app-pill">
                <span className="material-symbols-outlined">payments</span>
                <span>
                  <strong>{baseCurrency}</strong> · {t("header.baseCurrency")}
                </span>
              </div>

              <nav className="app-topbar-section-nav">
                <Link to="/dashboard#dashboard-overview" className="app-topbar-section-link">
                  {t("header.overview")}
                </Link>
                <NavLink
                  to="/movements"
                  className={({ isActive }) =>
                    isActive
                      ? "app-topbar-section-link active"
                      : "app-topbar-section-link"
                  }
                >
                  {t("header.transactions")}
                </NavLink>
                <NavLink
                  to="/goals"
                  className={({ isActive }) =>
                    isActive
                      ? "app-topbar-section-link active"
                      : "app-topbar-section-link"
                  }
                >
                  {t("header.goals")}
                </NavLink>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    isActive
                      ? "app-topbar-section-link active"
                      : "app-topbar-section-link"
                  }
                >
                  {t("header.settings")}
                </NavLink>
              </nav>
            </div>

            <div className="app-topbar-right">
              <button
                type="button"
                className="topbar-icon-button"
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Alternar modo oscuro"
              >
                <span className="material-symbols-outlined">
                  {darkMode ? "light_mode" : "dark_mode"}
                </span>
              </button>

              {isMovementsRoute ? (
                <button
                  type="button"
                  className="adia-button adia-button-primary"
                  onClick={openTransactionModal}
                >
                  <span className="material-symbols-outlined">add</span>
                  <span>{t("header.newTransaction")}</span>
                </button>
              ) : (
                <Link
                  to={isDashboardRoute ? "/movements" : "/dashboard"}
                  className="adia-button adia-button-primary"
                >
                  <span className="material-symbols-outlined">
                    {isDashboardRoute ? "swap_horiz" : "dashboard"}
                  </span>
                  <span>
                    {isDashboardRoute ? t("header.goToMovements") : t("header.goToDashboard")}
                  </span>
                </Link>
              )}

              <div className="app-avatar" title={displayName}>
                {user?.photoURL ? <img src={user.photoURL} alt={displayName} /> : avatarLabel}
              </div>
            </div>
          </div>

        </header>

        <header className="mobile-topbar">
          <div className="mobile-topbar-copy">
            <span>{t("header.goodMorning")}</span>
            <strong>{displayName}</strong>
            {activeWorkspace ? <small>{activeWorkspace.workspaceName}</small> : null}
          </div>

          <div className="app-topbar-right">
            <button
              type="button"
              className="mobile-logout-button"
              onClick={handleLogout}
              aria-label={t("header.logout")}
              title={t("header.logout")}
            >
              <span className="material-symbols-outlined">logout</span>
              <span>{t("header.logout")}</span>
            </button>
            <div className="app-pill mobile-currency-pill">
              <strong>{baseCurrency}</strong>
            </div>
            <button
              type="button"
              className="topbar-icon-button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Alternar modo oscuro"
            >
              <span className="material-symbols-outlined">
                {darkMode ? "light_mode" : "dark_mode"}
              </span>
            </button>
          </div>
        </header>

        <nav className="app-mobile-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "mobile-nav-link active" : "mobile-nav-link"
            }
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>{t("header.dashboard")}</span>
          </NavLink>

          <NavLink
            to="/movements"
            className={({ isActive }) =>
              isActive ? "mobile-nav-link active" : "mobile-nav-link"
            }
          >
            <span className="material-symbols-outlined">swap_horiz</span>
            <span>{t("header.transactions")}</span>
          </NavLink>

          <NavLink
            to="/goals"
            className={({ isActive }) =>
              isActive ? "mobile-nav-link active" : "mobile-nav-link"
            }
          >
            <span className="material-symbols-outlined">track_changes</span>
            <span>{t("header.goals")}</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "mobile-nav-link active" : "mobile-nav-link"
            }
          >
            <span className="material-symbols-outlined">settings</span>
            <span>{t("header.settings")}</span>
          </NavLink>
        </nav>
      </>
    );
  }

  return (
    <header className="public-topbar">
      <Link to="/" className="adia-brand">
        <span className="adia-brand-mark">
          <span className="material-symbols-outlined">account_balance_wallet</span>
        </span>
        <span className="adia-brand-copy">
          <span className="adia-brand-title">Adia Finance</span>
          <span className="adia-brand-subtitle">{t("header.brandSubtitlePublic")}</span>
        </span>
      </Link>

      <nav className="public-topbar-nav">
        <Link to="/" className="public-nav-link">
          {t("header.home")}
        </Link>
        <Link to="/#features" className="public-nav-link">
          {t("header.features")}
        </Link>
        <Link to="/#intelligence" className="public-nav-link">
          {t("header.intelligence")}
        </Link>
      </nav>

      <div className="public-topbar-actions">
        {user ? (
          <Link to="/dashboard" className="adia-button adia-button-secondary">
            {t("header.dashboard")}
          </Link>
        ) : null}

        <Link
          to={user ? "/dashboard" : "/register-login"}
          className="adia-button adia-button-primary"
        >
          {user ? t("header.openTerminal") : t("header.signIn")}
        </Link>
      </div>
    </header>
  );
};

export { Header };
