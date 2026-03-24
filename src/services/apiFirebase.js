import { 
  signInWithPopup, 
  signOut 
} from "firebase/auth";

import { 
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  setDoc
} from "firebase/firestore";

import { auth, provider, db } from "../config/firebase";

// ===============================
// AUTH
// ===============================

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

// ===============================
// INITIALIZE USER DATA
// ===============================

export const initializeUserData = async (uid) => {
  const settingsRef = doc(db, "users", uid, "settings", "config");
  const settingsSnap = await getDoc(settingsRef);

  // Si no existe configuración, es primer login
  if (!settingsSnap.exists()) {

    // Crear settings base
    await setDoc(settingsRef, {
      baseCurrency: "USD",
      savingsGoal: 0,
      expenseLimit: 0,
      expenseLimitCurrency: "USD",
      goals: [],
      activeGoalId: null,
      createdAt: serverTimestamp()
    });

    // Crear moneda USD por defecto con ID fijo = "USD"
    const usdRef = doc(db, "users", uid, "currencies", "USD");

    await setDoc(usdRef, {
      code: "USD",
      rate: 1,
      active: true,
      createdAt: serverTimestamp()
    });
  }
};

// ===============================
// TRANSACTIONS
// ===============================

const getUserTransactionsRef = (uid) => {
  return collection(db, "users", uid, "transactions");
};

export const subscribeToTransactions = (uid, callback) => {

  const q = query(
    getUserTransactionsRef(uid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || null
  }));

    callback(data);
  });
};

export const addTransaction = async (uid, data) => {
  await addDoc(getUserTransactionsRef(uid), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const deleteTransaction = async (uid, id) => {
  const ref = doc(db, "users", uid, "transactions", id);
  await deleteDoc(ref);
};

export const updateTransaction = async (uid, id, updates) => {
  const ref = doc(db, "users", uid, "transactions", id);
  await updateDoc(ref, updates);
};
