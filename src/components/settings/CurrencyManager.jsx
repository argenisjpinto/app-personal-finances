import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCurrencies } from "../../hooks/useCurrencies";
import { useSettings } from "../../hooks/useSettings";
import { useLanguage } from "../../context/LanguageContext";
import "../../styles/Dashboard.css";

const CurrencyManager = () => {
  const { user } = useAuth();
  const { currencies, addCurrency, updateCurrency, removeCurrency } =
    useCurrencies(user);
  const settings = useSettings(user);
  const { t } = useLanguage();

  const [newCurrency, setNewCurrency] = useState({
    code: "",
    rate: ""
  });

  const handleAdd = async () => {
    const code = newCurrency.code.trim().toUpperCase();
    const rate = Number(newCurrency.rate);

    if (!code || code.length !== 3) {
      alert(t("settings.currencyCodeError"));
      return;
    }

    if (!Number.isFinite(rate) || rate <= 0) {
      alert(t("settings.currencyRateError"));
      return;
    }

    const exists = currencies.some((currency) => currency.code === code);

    if (exists) {
      alert(t("settings.currencyExists"));
      return;
    }

    await addCurrency({
      code,
      rate,
      active: true
    });

    setNewCurrency({ code: "", rate: "" });
  };

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <h3 className="settings-card-title">{t("settings.currencyManagement")}</h3>
          <p className="settings-card-copy">{t("settings.currencyManagementDesc")}</p>
        </div>
      </div>

      <div className="currency-manager-list">
        {currencies.map((currency) => {
          const isUSD = currency.code === "USD";
          const isBase = currency.code === settings.baseCurrency;

          return (
            <div key={currency.id} className="currency-item">
              <div className="currency-item-left">
                <div className="currency-code-badge">{currency.code}</div>

                <div className="currency-item-meta">
                  <span className="currency-item-name">{currency.code}</span>
                  <span className="currency-item-caption">
                    {isUSD
                      ? t("settings.fixedDefaultCurrency")
                      : isBase
                      ? t("settings.currentBaseCurrency")
                      : t("settings.customExchangeEntry")}
                  </span>
                </div>
              </div>

              <div className="currency-item-actions">
                <input
                  type="number"
                  step="0.0001"
                  className="settings-input currency-manager-rate"
                  value={currency.rate}
                  disabled={isUSD}
                  onChange={(event) =>
                    updateCurrency(currency.id, {
                      rate: Number(event.target.value)
                    })
                  }
                />

                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={currency.active !== false}
                    disabled={isUSD || isBase}
                    onChange={(event) =>
                      updateCurrency(currency.id, {
                        active: event.target.checked
                      })
                    }
                  />
                  <span>{t("settings.active")}</span>
                </label>

                <button
                  type="button"
                  className="adia-button category-manager-button"
                  disabled={isUSD || isBase}
                  onClick={() => removeCurrency(currency.id, currency.code)}
                >
                  {t("settings.remove")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="currency-input-row" style={{ marginTop: "18px", gridTemplateColumns: "140px 1fr auto" }}>
        <input
          className="settings-input"
          placeholder="EUR"
          value={newCurrency.code}
          onChange={(event) =>
            setNewCurrency((previous) => ({
              ...previous,
              code: event.target.value
            }))
          }
        />

        <input
          className="settings-input"
          type="number"
          placeholder="Tasa (1 USD = ?)"
          value={newCurrency.rate}
          onChange={(event) =>
            setNewCurrency((previous) => ({
              ...previous,
              rate: event.target.value
            }))
          }
        />

        <button type="button" className="adia-button settings-save-button" onClick={handleAdd}>
          {t("settings.addCurrency")}
        </button>
      </div>
    </section>
  );
};

export { CurrencyManager };
