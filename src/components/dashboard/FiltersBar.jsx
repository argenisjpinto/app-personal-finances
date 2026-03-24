import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import "../../styles/Dashboard.css";

const FiltersBar = ({ filters, setFilters }) => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      type: "all",
      category: "",
      dateFrom: "",
      dateTo: "",
      order: "desc"
    });
  };

  const hasActiveFilters =
    filters.type !== "all" ||
    filters.category ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.order !== "desc";

  return (
    <div className="filters-container">
      <button
        type="button"
        className="filters-toggle"
        onClick={() => setOpen((previous) => !previous)}
      >
        <span className="material-symbols-outlined">filter_list</span>
        <span>{open ? t("filters.hide") : t("filters.show")}</span>
      </button>

      {open ? (
        <div className="filters-panel">
          <div className="filters-row">
            <select name="type" value={filters.type} onChange={handleChange}>
              <option value="all">{t("filters.allTypes")}</option>
              <option value="income">{t("transactions.income")}</option>
              <option value="expense">{t("transactions.expense")}</option>
            </select>

            <input
              type="text"
              name="category"
              placeholder={t("filters.searchCategory")}
              value={filters.category}
              onChange={handleChange}
            />

            <div className="date-group">
              <label htmlFor="date-from">{t("filters.from")}</label>
              <input
                id="date-from"
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleChange}
              />
            </div>

            <div className="date-group">
              <label htmlFor="date-to">{t("filters.to")}</label>
              <input
                id="date-to"
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleChange}
              />
            </div>

            <select name="order" value={filters.order} onChange={handleChange}>
              <option value="desc">{t("filters.newest")}</option>
              <option value="asc">{t("filters.oldest")}</option>
            </select>

            {hasActiveFilters ? (
              <button type="button" className="reset-button" onClick={resetFilters}>
                {t("filters.reset")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export { FiltersBar };
