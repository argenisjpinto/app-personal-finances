import { useEffect, useState } from "react";
import { useCategories } from "../../hooks/useCategories";
import { useCurrencies } from "../../hooks/useCurrencies";
import { useLanguage } from "../../context/LanguageContext";

const emptyState = {
  type: "income",
  amount: "",
  category: "",
  currency: "USD",
  date: "",
  description: ""
};

const TransactionForm = ({ onAdd, onEdit, onCancel, editingTransaction }) => {
  const [formData, setFormData] = useState(emptyState);
  const { categories } = useCategories();
  const { currencies } = useCurrencies();
  const { t } = useLanguage();

  const isFormValid = formData.amount && formData.category && formData.date;

  useEffect(() => {
    if (editingTransaction) {
      setFormData(editingTransaction);
      return;
    }

    setFormData(emptyState);
  }, [editingTransaction]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "type") {
      setFormData((previous) => ({
        ...previous,
        type: value,
        category: ""
      }));
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const { id, createdAt, ...cleanData } = formData;
    const payload = {
      ...cleanData,
      amount: Number(cleanData.amount)
    };

    if (editingTransaction?.id) {
      onEdit(editingTransaction.id, payload);
      return;
    }

    onAdd(payload);
  };

  const activeCategories = categories
    .filter((category) => category.active !== false)
    .filter((category) => category.type === formData.type);

  const activeCurrencies = currencies.filter((currency) => currency.active !== false);

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <div className="transaction-form-topbar" />

      <div className="transaction-form-body">
        <div className="transaction-form-header">
          <div>
            <h3 className="transaction-form-title">
              {editingTransaction
                ? t("transactionForm.edit")
                : t("transactionForm.new")}
            </h3>
            <p className="transaction-form-copy">{t("transactionForm.description")}</p>
          </div>

          <button
            type="button"
            className="transaction-form-close"
            onClick={onCancel}
            aria-label="Cerrar formulario"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="transaction-form-amount">
          <label>{t("transactionForm.enterAmount")}</label>
          <div className="transaction-form-amount-wrap">
            <span className="transaction-form-amount-sign">$</span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="transaction-type-row">
          <button
            type="button"
            className={
              formData.type === "income"
                ? "transaction-type-button active"
                : "transaction-type-button"
            }
            onClick={() =>
              setFormData((previous) => ({
                ...previous,
                type: "income",
                category: ""
              }))
            }
          >
            {t("transactionForm.income")}
          </button>

          <button
            type="button"
            className={
              formData.type === "expense"
                ? "transaction-type-button active"
                : "transaction-type-button"
            }
            onClick={() =>
              setFormData((previous) => ({
                ...previous,
                type: "expense",
                category: ""
              }))
            }
          >
            {t("transactionForm.expense")}
          </button>
        </div>

        <div className="transaction-form-chip-row">
          {activeCurrencies.map((currency) => (
            <button
              key={currency.id}
              type="button"
              className={
                formData.currency === currency.code
                  ? "transaction-form-chip active"
                  : "transaction-form-chip"
              }
              onClick={() =>
                setFormData((previous) => ({
                  ...previous,
                  currency: currency.code
                }))
              }
            >
              {currency.code}
            </button>
          ))}
        </div>

        <div className="transaction-form-grid">
          <div className="transaction-form-field">
            <label htmlFor="transaction-category">{t("transactionForm.category")}</label>
            <select
              id="transaction-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">{t("transactionForm.selectCategory")}</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="transaction-form-field">
            <label htmlFor="transaction-date">{t("transactionForm.date")}</label>
            <input
              id="transaction-date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <div className="transaction-form-field transaction-form-field-full">
            <label htmlFor="transaction-description">
              {t("transactionForm.descriptionLabel")}
            </label>
            <textarea
              id="transaction-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t("transactionForm.descriptionPlaceholder")}
            />
          </div>
        </div>

        <div className="transaction-form-actions">
          <button
            type="button"
            className="transaction-form-cancel"
            onClick={onCancel}
          >
            {t("transactionForm.cancel")}
          </button>

          <button
            type="submit"
            className="transaction-form-submit"
            disabled={!isFormValid}
          >
            {editingTransaction
              ? t("transactionForm.update")
              : t("transactionForm.add")}
          </button>
        </div>
      </div>
    </form>
  );
};

export { TransactionForm };
