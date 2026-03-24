import { useLanguage } from "../../context/LanguageContext";

const EmptyState = ({ message }) => {
  const { t } = useLanguage();

  return (
    <div className="empty-state">
      <h3>{t("transactions.noResultsTitle")}</h3>
      <p>{message}</p>
      <span className="empty-state-link">{t("transactions.adjustFilters")}</span>
    </div>
  );
};

export { EmptyState };
