import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";
import {
  addGuestCurrency,
  isGuestCurrencyUsed,
  isGuestUser,
  removeGuestCurrency,
  subscribeToGuestCurrencies,
  updateGuestCurrency
} from "../services/localData";

export const useCurrencies = () => {
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const { user } = useAuth();
  const [currencies, setCurrencies] = useState([]);
  const guestMode = isGuestUser(user);

  useEffect(() => {
    if (!activeWorkspaceId) {
      return;
    }

    if (guestMode) {
      const unsubscribeGuest = subscribeToGuestCurrencies(activeWorkspaceId, setCurrencies);
      return () => unsubscribeGuest();
    }

    const scopeRoot = isLegacyMode ? "users" : "workspaces";
    const ref = collection(db, scopeRoot, activeWorkspaceId, "currencies");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data()
      }));
      setCurrencies(data);
    });

    return () => unsubscribe();
  }, [activeWorkspaceId, guestMode, isLegacyMode]);

  const addCurrency = async (currency) => {
    if (guestMode) {
      await addGuestCurrency(activeWorkspaceId, currency);
      return;
    }

    const docRef = doc(
      db,
      isLegacyMode ? "users" : "workspaces",
      activeWorkspaceId,
      "currencies",
      currency.code
    );

    await setDoc(docRef, {
      ...currency,
      active: true,
      createdAt: serverTimestamp()
    });
  };

  const isCurrencyUsed = async (code) => {
    const txRef = collection(
      db,
      isLegacyMode ? "users" : "workspaces",
      activeWorkspaceId,
      "transactions"
    );

    const snapshot = await getDocs(
      query(txRef, where("currency", "==", code), limit(1))
    );

    return !snapshot.empty;
  };

  const updateCurrency = async (id, updates) => {
    if (updates.active === false) {
      const used = guestMode
        ? isGuestCurrencyUsed(activeWorkspaceId, id)
        : await isCurrencyUsed(id);

      if (used) {
        alert("No puedes desactivar una moneda que tiene transacciones asociadas.");
        return;
      }
    }

    if (guestMode) {
      await updateGuestCurrency(activeWorkspaceId, id, updates);
      return;
    }

    const ref = doc(
      db,
      isLegacyMode ? "users" : "workspaces",
      activeWorkspaceId,
      "currencies",
      id
    );
    await updateDoc(ref, updates);
  };

  const removeCurrency = async (id, code) => {
    const used = guestMode
      ? isGuestCurrencyUsed(activeWorkspaceId, code)
      : await isCurrencyUsed(code);

    if (used) {
      alert("No puedes eliminar una moneda que tiene transacciones asociadas.");
      return;
    }

    if (guestMode) {
      await removeGuestCurrency(activeWorkspaceId, id);
      return;
    }

    const ref = doc(
      db,
      isLegacyMode ? "users" : "workspaces",
      activeWorkspaceId,
      "currencies",
      id
    );
    await deleteDoc(ref);
  };

  return {
    currencies: activeWorkspaceId ? currencies : [],
    addCurrency,
    updateCurrency,
    removeCurrency
  };
};
