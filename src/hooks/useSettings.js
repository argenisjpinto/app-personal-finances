import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";
import { DEFAULT_SETTINGS, isGuestUser, subscribeToGuestSettings } from "../services/localData";

export const useSettings = () => {
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    ...DEFAULT_SETTINGS,
    rates: {}
  });
  const guestMode = isGuestUser(user);

  useEffect(() => {
    if (!activeWorkspaceId) {
      return;
    }

    if (guestMode) {
      const unsubscribeGuest = subscribeToGuestSettings(activeWorkspaceId, setSettings);
      return () => unsubscribeGuest();
    }

    const scopeRoot = isLegacyMode ? "users" : "workspaces";
    const settingsRef = doc(db, scopeRoot, activeWorkspaceId, "settings", "config");
    const currenciesRef = collection(db, scopeRoot, activeWorkspaceId, "currencies");

    let currentSettingsData = {};
    let currentRates = {};

    const unsubscribeSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        currentSettingsData = snap.data();
      }

      setSettings({
        ...currentSettingsData,
        rates: currentRates
      });
    });

    const unsubscribeCurrencies = onSnapshot(currenciesRef, (snapshot) => {
      const rates = {};

      snapshot.docs.forEach((snapshotDoc) => {
        const data = snapshotDoc.data();

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
  }, [activeWorkspaceId, guestMode, isLegacyMode]);

  return activeWorkspaceId
    ? settings
    : {
        ...DEFAULT_SETTINGS,
        rates: {}
      };
};
