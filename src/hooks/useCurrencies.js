import { useEffect, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDocs,
  query, 
  where, 
  limit
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useWorkspace } from "../context/WorkspaceContext";

export const useCurrencies = () => {
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setCurrencies([]);
      return;
    }

    const scopeRoot = isLegacyMode ? "users" : "workspaces";
    const ref = collection(db, scopeRoot, activeWorkspaceId, "currencies");

    const unsubscribe = onSnapshot(ref, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCurrencies(data);
    });

    return () => unsubscribe();
  }, [activeWorkspaceId, isLegacyMode]);

  const addCurrency = async (currency) => {
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
    const txRef = collection(db, isLegacyMode ? "users" : "workspaces", activeWorkspaceId, "transactions");

    const q = query(
        txRef,
        where("currency", "==", code),
        limit(1)
    );

    const snapshot = await getDocs(q);

    return !snapshot.empty;
    };

  const updateCurrency = async (id, updates) => {
    // Si intenta desactivar
    if (updates.active === false) {
      const used = await isCurrencyUsed(id);

      if (used) {
        alert("No puedes desactivar una moneda que tiene transacciones asociadas.");
        return;
      }
    }

    const ref = doc(db, isLegacyMode ? "users" : "workspaces", activeWorkspaceId, "currencies", id);
    await updateDoc(ref, updates);
  };

  const removeCurrency = async (id, code) => {
    const used = await isCurrencyUsed(code);

    if (used) {
      alert("No puedes eliminar una moneda que tiene transacciones asociadas.");
      return;
    }

    const ref = doc(db, isLegacyMode ? "users" : "workspaces", activeWorkspaceId, "currencies", id);
    await deleteDoc(ref);
  };

  return {
    currencies,
    addCurrency,
    updateCurrency,
    removeCurrency
  };
};
