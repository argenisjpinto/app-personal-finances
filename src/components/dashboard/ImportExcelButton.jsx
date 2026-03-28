import { useRef } from "react";
import { importFromExcel } from "../../services/excel/importExcel";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { useCurrencies } from "../../hooks/useCurrencies";
import { useLanguage } from "../../context/LanguageContext";
import { useWorkspace } from "../../context/WorkspaceContext";

const ImportExcelButton = ({ showToast }) => {
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const { categories } = useCategories();
  const { currencies } = useCurrencies();
  const { t } = useLanguage();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    try {
      const count = await importFromExcel(
        file,
        user,
        activeWorkspaceId,
        categories,
        currencies,
        isLegacyMode
      );
      showToast(t("dashboard.importSuccess", { count }), "success");
    } catch (error) {
      showToast(error.message, "error");
    }

    event.target.value = null;
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="adia-button adia-button-secondary"
      >
        {t("dashboard.importExcel")}
      </button>
    </>
  );
};

export { ImportExcelButton };
