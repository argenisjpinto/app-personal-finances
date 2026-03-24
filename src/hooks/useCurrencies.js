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

export const useCurrencies = (user) => {
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "currencies");

    const unsubscribe = onSnapshot(ref, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCurrencies(data);
    });

    return () => unsubscribe();
  }, [user]);

  const addCurrency = async (currency) => {
    const docRef = doc(
      db,
      "users",
      user.uid,
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
    const txRef = collection(db, "users", user.uid, "transactions");

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

    const ref = doc(db, "users", user.uid, "currencies", id);
    await updateDoc(ref, updates);
  };

  const removeCurrency = async (id, code) => {
    const used = await isCurrencyUsed(code);

    if (used) {
      alert("No puedes eliminar una moneda que tiene transacciones asociadas.");
      return;
    }

    const ref = doc(db, "users", user.uid, "currencies", id);
    await deleteDoc(ref);
  };

  return {
    currencies,
    addCurrency,
    updateCurrency,
    removeCurrency
  };
};