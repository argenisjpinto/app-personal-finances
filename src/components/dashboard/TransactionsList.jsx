import { formatCurrency } from "../../utils/formatCurrency";
import { useLanguage } from "../../context/LanguageContext";
import { EmptyState } from "./EmptyState";

const getTransactionIcon = (transaction) => {
  const source = `${transaction.category || ""} ${transaction.description || ""}`.toLowerCase();

  if (transaction.type === "income") {
    return "work";
  }

  if (source.includes("comida") || source.includes("food") || source.includes("restaurant")) {
    return "restaurant";
  }

  if (source.includes("casa") || source.includes("rent") || source.includes("home")) {
    return "home";
  }

  if (source.includes("tech") || source.includes("apple") || source.includes("software")) {
    return "devices";
  }

  return "shopping_bag";
};

const TransactionsList = ({ transactions, onDelete, onSelectEdit }) => {
  const { t, language } = useLanguage();
  const getDeleteConfirmation = (transaction) =>
    transaction.installmentPlanId
      ? t("transactions.confirmDeleteInstallmentPlan", {
          total: transaction.installmentCount || 1
        })
      : t("transactions.confirmDelete");
  const getInstallmentMeta = (transaction) =>
    transaction.installmentPlanId
      ? t("transactions.installmentLabel", {
          current: transaction.installmentNumber,
          total: transaction.installmentCount
        })
      : "";

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return t("transactions.noDate");
    }

    const parsed = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat(language === "es" ? "es-AR" : "en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    }).format(parsed);
  };

  if (!transactions.length) {
    return <EmptyState message={t("transactions.noResultsDesc")} />;
  }

  return (
    <>
      <div className="transactions-table-wrap">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>{t("transactions.transaction")}</th>
              <th>{t("transactions.category")}</th>
              <th>{t("transactions.date")}</th>
              <th>{t("transactions.currency")}</th>
              <th>{t("transactions.amount")}</th>
              <th>{t("transactions.actions")}</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  <div className="transaction-primary-cell">
                    <div className="transaction-icon">
                      <span className="material-symbols-outlined">
                        {getTransactionIcon(transaction)}
                      </span>
                    </div>

                    <div className="transaction-title-block">
                      <p className="transaction-item-title">
                        {transaction.description ||
                          transaction.category ||
                          t("transactions.transactionFallback")}
                      </p>
                      <span className="transaction-meta">
                        {transaction.type === "income"
                          ? t("transactions.income")
                          : t("transactions.expense")}
                      </span>
                      {transaction.installmentPlanId ? (
                        <span className="transaction-meta">
                          {getInstallmentMeta(transaction)}
                        </span>
                      ) : null}
                      {transaction.createdByName ? (
                        <span className="transaction-meta">
                          {transaction.createdByName}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td>{transaction.category || "-"}</td>
                <td>{formatDate(transaction.date)}</td>
                <td>{transaction.currency}</td>
                <td
                  className={
                    transaction.type === "income" ? "amount-income" : "amount-expense"
                  }
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                </td>
                <td>
                  <div className="table-action-row">
                    <button
                      type="button"
                      className="table-action-button"
                      onClick={() => onSelectEdit(transaction)}
                    >
                      {t("transactions.edit")}
                    </button>
                    <button
                      type="button"
                      className="table-action-button table-action-button-danger"
                      onClick={() => {
                        if (window.confirm(getDeleteConfirmation(transaction))) {
                          onDelete(transaction);
                        }
                      }}
                    >
                      {t("transactions.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="transactions-mobile-list">
        {transactions.map((transaction) => (
          <article key={transaction.id} className="transaction-mobile-card">
            <div className="transaction-mobile-top">
              <div className="transaction-primary-cell">
                <div className="transaction-icon">
                  <span className="material-symbols-outlined">
                    {getTransactionIcon(transaction)}
                  </span>
                </div>

                <div className="transaction-title-block">
                  <p className="transaction-item-title">
                    {transaction.description ||
                      transaction.category ||
                      t("transactions.transactionFallback")}
                  </p>
                  <span className="transaction-meta">
                    {transaction.type === "income"
                      ? t("transactions.income")
                      : t("transactions.expense")}
                  </span>
                  {transaction.installmentPlanId ? (
                    <span className="transaction-meta">
                      {getInstallmentMeta(transaction)}
                    </span>
                  ) : null}
                  {transaction.createdByName ? (
                    <span className="transaction-meta">
                      {transaction.createdByName}
                    </span>
                  ) : null}
                </div>
              </div>

              <strong
                className={
                  transaction.type === "income"
                    ? "amount-income transaction-mobile-amount"
                    : "amount-expense transaction-mobile-amount"
                }
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
              </strong>
            </div>

            <div className="transaction-mobile-meta">
              <span>{transaction.category || "-"}</span>
              <span>{formatDate(transaction.date)}</span>
              <span>{transaction.currency}</span>
            </div>

            <div className="table-action-row">
              <button
                type="button"
                className="table-action-button"
                onClick={() => onSelectEdit(transaction)}
              >
                {t("transactions.edit")}
              </button>
              <button
                type="button"
                className="table-action-button table-action-button-danger"
                onClick={() => {
                  if (window.confirm(getDeleteConfirmation(transaction))) {
                    onDelete(transaction);
                  }
                }}
              >
                {t("transactions.delete")}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

export { TransactionsList };
