import { downloadImportTemplate } from "../../services/excel/downloadTemplate";
import { useLanguage } from "../../context/LanguageContext";

const DownloadTemplateButton = () => {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={downloadImportTemplate}
      className="adia-button adia-button-secondary"
    >
      {t("dashboard.downloadTemplate")}
    </button>
  );
};

export { DownloadTemplateButton };
