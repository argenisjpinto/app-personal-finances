import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useCurrencies } from "../../hooks/useCurrencies";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { useLanguage } from "../../context/LanguageContext";
import { useWorkspace } from "../../hooks/useWorkspace";
import { isGuestUser, updateGuestSettings } from "../../services/localData";

const BaseCurrencyForm = () => {
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const { currencies } = useCurrencies();
  const settings = useSettings();
  const { user } = useAuth();
  const [pendingBaseCurrency, setPendingBaseCurrency] = useState("");
  const { t } = useLanguage();
  const guestMode = isGuestUser(user);
  const baseCurrency = pendingBaseCurrency || settings.baseCurrency || "USD";

  const handleSave = async () => {
    if (!baseCurrency) {
      return;
    }

    const selectedCurrency = currencies.find(
      (currency) => currency.code === baseCurrency
    );

    if (!selectedCurrency) {
      alert(t("settings.baseMissing"));
      return;
    }

    if (selectedCurrency.active === false) {
      alert(t("settings.baseDisabled"));
      return;
    }

    if (!selectedCurrency.rate || selectedCurrency.rate <= 0) {
      alert(t("settings.baseInvalidRate"));
      return;
    }

    try {
      if (guestMode) {
        await updateGuestSettings(activeWorkspaceId, { baseCurrency });
        alert(t("settings.baseSaved"));
        return;
      }

      const reference = doc(
        db,
        isLegacyMode ? "users" : "workspaces",
        activeWorkspaceId,
        "settings",
        "config"
      );
      await setDoc(reference, { baseCurrency }, { merge: true });
      alert(t("settings.baseSaved"));
    } catch (error) {
      console.error("Error actualizando moneda base:", error);
      alert(t("settings.baseError"));
    }
  };

  const activeCurrencies = currencies.filter((currency) => currency.active !== false);

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <h3 className="settings-card-title">{t("settings.baseCurrencyTitle")}</h3>
          <p className="settings-card-copy">{t("settings.baseCurrencyDesc")}</p>
        </div>
        <span className="settings-tag">{t("settings.liveSetting")}</span>
      </div>

      <div className="base-currency-options">
        {activeCurrencies.map((currency) => (
          <button
            key={currency.id}
            type="button"
            className={
              baseCurrency === currency.code
                ? "base-currency-option active"
                : "base-currency-option"
            }
            onClick={() => setPendingBaseCurrency(currency.code)}
          >
            <span className="base-currency-code">{currency.code}</span>
            <span className="base-currency-name">
              {t("settings.rateLabel", { value: currency.rate })}
            </span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: "18px" }}>
        <button type="button" className="adia-button settings-save-button" onClick={handleSave}>
          {t("settings.saveBaseCurrency")}
        </button>
      </div>
    </section>
  );
};

export { BaseCurrencyForm };
