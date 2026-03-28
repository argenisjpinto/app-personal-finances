import { useEffect, useState } from "react";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useWorkspace } from "../context/WorkspaceContext";

export const useSettings = () => {
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const [settings, setSettings] = useState({
    baseCurrency: "USD",
    rates: {},
    savingsGoal: 0,
    expenseLimit: 0,
    expenseLimitCurrency: "USD",
    goals: [],
    activeGoalId: null
  });

  useEffect(() => {
    if (!activeWorkspaceId) {
      setSettings({
        baseCurrency: "USD",
        rates: {},
        savingsGoal: 0,
        expenseLimit: 0,
        expenseLimitCurrency: "USD",
        goals: [],
        activeGoalId: null
      });
      return;
    }

    const scopeRoot = isLegacyMode ? "users" : "workspaces";
    const settingsRef = doc(db, scopeRoot, activeWorkspaceId, "settings", "config");
    const currenciesRef = collection(db, scopeRoot, activeWorkspaceId, "currencies");

    let currentSettingsData = {};
    let currentRates = {};

    // 🔹 Escuchar config completo
    const unsubscribeSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        currentSettingsData = snap.data();
      }

      setSettings({
        ...currentSettingsData,
        rates: currentRates
      });
    });

    // 🔹 Escuchar monedas activas
    const unsubscribeCurrencies = onSnapshot(currenciesRef, (snapshot) => {
      const rates = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();

        if (data.active !== false) {
          rates[data.code] = data.rate;
        }
      });

      currentRates = rates;

      setSettings({
        ...currentSettingsData,
        rates: currentRates
      });
    });

    return () => {
      unsubscribeSettings();
      unsubscribeCurrencies();
    };

  }, [activeWorkspaceId, isLegacyMode]);

  return settings;
};
