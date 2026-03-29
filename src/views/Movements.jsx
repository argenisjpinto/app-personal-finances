import { useEffect, useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useFilters } from "../hooks/useFilters";
import { useToast } from "../hooks/useToast";
import { useSettings } from "../hooks/useSettings";
import { useLanguage } from "../context/LanguageContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { Toast } from "../components/ui/Toast";
import { Modal } from "../components/ui/Modal";
import { FiltersBar } from "../components/dashboard/FiltersBar";
import { TransactionsList } from "../components/dashboard/TransactionsList";
import { TransactionForm } from "../components/dashboard/TransactionForm";
import { ImportExcelButton } from "../components/dashboard/ImportExcelButton";
import { DownloadTemplateButton } from "../components/dashboard/DownloadTemplateButton";
import { exportToExcel } from "../services/excel/exportExcel";

const DEFAULT_FILTERS = {
  type: "all",
  category: "",
  dateFrom: "",
  dateTo: "",
  order: "desc"
};

const getStoredFilters = (storageKey) => {
  const saved = localStorage.getItem(storageKey);

  return saved ? JSON.parse(saved) : DEFAULT_FILTERS;
};

const Movements = () => {
  const { activeWorkspace, activeWorkspaceId, loading: workspaceLoading } = useWorkspace();
  const { t } = useLanguage();
  const {
    transactions,
    loading,
    addNewTransaction,
    removeTransaction,
    editTransaction
  } = useTransactions();
  const settings = useSettings();
  const { toast, showToast } = useToast();
  const storageKey = `movementFilters:${activeWorkspaceId || "default"}`;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtersByWorkspace, setFiltersByWorkspace] = useState(() => ({
    [storageKey]: getStoredFilters(storageKey)
  }));
  const filters = filtersByWorkspace[storageKey] || getStoredFilters(storageKey);
  const setFilters = (nextFilters) => {
    setFiltersByWorkspace((current) => {
      const previousFilters = current[storageKey] || getStoredFilters(storageKey);
      const resolvedFilters =
        typeof nextFilters === "function"
          ? nextFilters(previousFilters)
          : nextFilters;

      return {
        ...current,
        [storageKey]: resolvedFilters
      };
    });
  };

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(filters));
  }, [filters, storageKey]);

  useEffect(() => {
    const handleOpenModal = () => {
      setEditingId(null);
      setShowForm(true);
    };

    window.addEventListener("open-transaction-modal", handleOpenModal);

    return () => {
      window.removeEventListener("open-transaction-modal", handleOpenModal);
    };
  }, []);

  const visibleTransactions = useFilters(transactions, filters);
  const editingTransaction =
    transactions.find((transaction) => transaction.id === editingId) || null;
  const transactionDefaultCurrency = settings?.baseCurrency || "USD";

  if (loading || workspaceLoading || !activeWorkspace) {
    return (
      <div className="dashboard-container">
        <section className="dashboard-panel">
          <div className="panel-kicker">{t("movements.kicker")}</div>
          <h2 className="dashboard-panel-title" style={{ marginTop: "14px" }}>
            {t("movements.loadingTitle")}
          </h2>
          <p className="panel-description" style={{ marginTop: "10px" }}>
            {t("movements.loadingDescription")}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <section className="dashboard-panel movements-hero">
        <div className="dashboard-panel-copy">
          <div className="panel-kicker">{t("movements.kicker")}</div>
          <h2 className="dashboard-hero-title" style={{ margin: 0 }}>
            {t("movements.titleBefore")} <strong>{t("movements.titleAccent")}</strong>
          </h2>
          <p className="panel-description">{t("movements.description")}</p>
          <p className="transaction-meta">
            {activeWorkspace.workspaceName}
          </p>
        </div>

        <div className="transactions-panel-actions">
          <button
            type="button"
            className="adia-button adia-button-primary"
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
          >
            <span className="material-symbols-outlined">add</span>
            <span>{t("dashboard.newTransaction")}</span>
          </button>
          <DownloadTemplateButton />
          <ImportExcelButton showToast={showToast} />
          <button
            type="button"
            className="adia-button adia-button-secondary"
            onClick={() => exportToExcel(visibleTransactions, settings)}
          >
            {t("dashboard.exportExcel")}
          </button>
        </div>
      </section>

      <section className="dashboard-panel transactions-panel" id="movements-list">
        <div className="transactions-panel-header">
          <div className="dashboard-panel-copy">
            <h3 className="dashboard-panel-title">{t("movements.listTitle")}</h3>
            <p className="transactions-status">
              {t("dashboard.showingRecords", {
                count: visibleTransactions.length
              })}
            </p>
          </div>
        </div>

        <div className="transactions-panel-body">
          <FiltersBar filters={filters} setFilters={setFilters} />
          <TransactionsList
            transactions={visibleTransactions}
            onDelete={async (transaction) => {
              await removeTransaction(transaction);
              showToast(t("dashboard.deleteToast"), "error");
            }}
            onSelectEdit={(transaction) => {
              setEditingId(transaction.id);
              setShowForm(true);
            }}
          />
        </div>
      </section>

      <button
        type="button"
        className="dashboard-fab"
        onClick={() => {
          setEditingId(null);
          setShowForm(true);
        }}
        aria-label={t("dashboard.newTransaction")}
      >
        <span className="material-symbols-outlined">add</span>
      </button>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
      >
        <TransactionForm
          key={editingTransaction?.id || `new-${activeWorkspaceId || "default"}-${transactionDefaultCurrency}`}
          defaultCurrency={transactionDefaultCurrency}
          editingTransaction={editingTransaction}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          onAdd={async (data) => {
            await addNewTransaction(data);
            setShowForm(false);
            showToast(t("dashboard.savedToast"));
          }}
          onEdit={async (id, data) => {
            await editTransaction(id, data);
            setShowForm(false);
            setEditingId(null);
            showToast(t("dashboard.updatedToast"));
          }}
        />
      </Modal>

      <Toast toast={toast} />
    </div>
  );
};

export { Movements };
