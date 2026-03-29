import { useState } from "react";
import { BaseCurrencyForm } from "../components/settings/BaseCurrencyForm";
import { CurrencyManager } from "../components/settings/CurrencyManager";
import { CategoryManager } from "../components/settings/CategoryManager";
import { useCategories } from "../hooks/useCategories";
import { useCurrencies } from "../hooks/useCurrencies";
import { useSettings } from "../hooks/useSettings";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { Link } from "react-router-dom";
import "../styles/Dashboard.css";

const Settings = () => {
  const { user } = useAuth();
  const {
    activeWorkspace,
    createSharedWorkspace,
    deleteWorkspace,
    inviteToWorkspace,
    isLegacyMode,
    loading: workspaceLoading,
    renameWorkspace,
    setActiveWorkspaceId,
    workspaces
  } = useWorkspace();
  const { currencies } = useCurrencies();
  const { categories } = useCategories();
  const settings = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const [sharedName, setSharedName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [workspaceNames, setWorkspaceNames] = useState({});
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const sharedWorkspace = workspaces.find((workspace) => workspace.workspaceType === "shared");
  const canDeleteWorkspace = workspaces.length > 1;

  if (!user || workspaceLoading || !activeWorkspace) {
    return null;
  }

  const handleSharedWorkspace = async () => {
    if (!inviteEmail.trim()) {
      return;
    }

    setSavingWorkspace(true);

    try {
      if (sharedWorkspace) {
        await inviteToWorkspace({
          workspaceId: sharedWorkspace.workspaceId,
          workspaceName: sharedWorkspace.workspaceName,
          inviteEmail
        });
      } else {
        await createSharedWorkspace({
          workspaceName: sharedName,
          inviteEmail
        });
      }

      setInviteEmail("");
      setSharedName("");
      alert("Invitacion enviada al espacio compartido.");
    } catch (error) {
      alert(error.message || "No se pudo configurar el espacio compartido.");
    } finally {
      setSavingWorkspace(false);
    }
  };

  const handleRenameWorkspace = async (workspace) => {
    const nextName = (workspaceNames[workspace.workspaceId] || workspace.workspaceName || "").trim();

    if (!nextName || nextName === workspace.workspaceName) {
      return;
    }

    try {
      await renameWorkspace(workspace.workspaceId, nextName);
      setWorkspaceNames((current) => ({
        ...current,
        [workspace.workspaceId]: nextName
      }));
      alert("Nombre del espacio actualizado.");
    } catch (error) {
      alert(error.message || "No se pudo actualizar el espacio.");
    }
  };

  const handleDeleteWorkspace = async (workspace) => {
    if (!canDeleteWorkspace) {
      return;
    }

    const confirmed = window.confirm(
      `Eliminar el espacio "${workspace.workspaceName}"? Esta accion no se puede deshacer.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteWorkspace(workspace.workspaceId);
      alert("Espacio eliminado.");
    } catch (error) {
      alert(error.message || "No se pudo eliminar el espacio.");
    }
  };

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
          <section className="settings-card" id="settings-workspaces">
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

          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <h3 className="settings-card-title">Espacios</h3>
                <p className="settings-card-copy">
                  Gestiona tus espacios personales y compartidos desde un mismo lugar.
                </p>
              </div>
              <span className="settings-tag">{activeWorkspace.workspaceType}</span>
            </div>

            <div className="workspace-settings-block">
              <p className="transaction-meta">
                Activo ahora: <strong>{activeWorkspace.workspaceName}</strong>
              </p>

              {isLegacyMode ? (
                <p className="transaction-meta">
                  Firestore sigue usando el modo actual por permisos. El hogar compartido quedara habilitado cuando agreguemos reglas para `workspaces`.
                </p>
              ) : null}

              {sharedWorkspace ? (
                <p className="transaction-meta">
                  Espacio hogar listo: <strong>{sharedWorkspace.workspaceName}</strong>
                </p>
              ) : (
                <input
                  className="settings-input"
                  placeholder="Nombre del espacio compartido"
                  value={sharedName}
                  onChange={(event) => setSharedName(event.target.value)}
                  disabled={isLegacyMode}
                />
              )}

              <div className="workspace-settings-inline">
                <input
                  className="settings-input"
                  type="email"
                  placeholder="mail de la persona invitada"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  disabled={isLegacyMode}
                />
                <button
                  type="button"
                  className="adia-button settings-save-button"
                  onClick={handleSharedWorkspace}
                  disabled={isLegacyMode || savingWorkspace || !inviteEmail.trim()}
                >
                  {sharedWorkspace ? "Invitar a este espacio" : "Crear espacio e invitar"}
                </button>
              </div>

              <div className="workspace-manager-list">
                {workspaces.map((workspace) => (
                  <article key={workspace.workspaceId} className="workspace-manager-card">
                    <div className="workspace-manager-head">
                      <div>
                        <strong>
                          {workspace.workspaceType === "shared" ? "Compartido" : "Personal"}
                        </strong>
                        <p className="transaction-meta">
                          {workspace.workspaceId === activeWorkspace.workspaceId
                            ? "Espacio activo"
                            : "Disponible para cambiar"}
                        </p>
                      </div>
                      <span className="settings-tag">{workspace.role || "member"}</span>
                    </div>

                    <div className="workspace-manager-controls">
                      <input
                        className="settings-input"
                        value={workspaceNames[workspace.workspaceId] ?? workspace.workspaceName}
                        onChange={(event) =>
                          setWorkspaceNames((current) => ({
                            ...current,
                            [workspace.workspaceId]: event.target.value
                          }))
                        }
                        disabled={isLegacyMode}
                      />
                      <div className="workspace-manager-actions">
                        <button
                          type="button"
                          className={
                            workspace.workspaceId === activeWorkspace.workspaceId
                              ? "adia-button settings-secondary-button"
                              : "adia-button settings-save-button"
                          }
                          onClick={() => setActiveWorkspaceId(workspace.workspaceId)}
                          disabled={workspace.workspaceId === activeWorkspace.workspaceId}
                        >
                          {workspace.workspaceId === activeWorkspace.workspaceId
                            ? "Espacio activo"
                            : "Usar este espacio"}
                        </button>
                        <button
                          type="button"
                          className="adia-button settings-secondary-button"
                          onClick={() => handleRenameWorkspace(workspace)}
                          disabled={isLegacyMode}
                        >
                          Guardar nombre
                        </button>
                        <button
                          type="button"
                          className="adia-button category-manager-button"
                          onClick={() => handleDeleteWorkspace(workspace)}
                          disabled={isLegacyMode || !canDeleteWorkspace}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <BaseCurrencyForm />
          <div id="settings-currencies">
            <CurrencyManager />
          </div>
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
