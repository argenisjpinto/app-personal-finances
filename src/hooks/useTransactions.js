import { useEffect, useState } from "react";
import { 
  addTransaction, 
  deleteTransaction, 
  updateTransaction,
  subscribeToTransactions
} from "../services/apiFirebase";

export const useTransactions = (user) => {

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addNewTransaction = async (transaction) => {
    await addTransaction(user.uid, transaction);
  };

  const removeTransaction = async (id) => {
    await deleteTransaction(user.uid, id);
  };

  const editTransaction = async (id, updates) => {
    await updateTransaction(user.uid, id, updates);
  };

  return {
    transactions,
    loading,
    addNewTransaction,
    removeTransaction,
    editTransaction
  };
};