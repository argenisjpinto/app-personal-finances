import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { 
  addTransaction, 
  deleteTransaction, 
  updateTransaction,
  subscribeToTransactions
} from "../services/apiFirebase";

export const useTransactions = () => {
  const { user } = useAuth();
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !activeWorkspaceId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToTransactions(activeWorkspaceId, (data) => {
      setTransactions(data);
      setLoading(false);
    }, isLegacyMode);

    return () => unsubscribe();
  }, [activeWorkspaceId, user]);

  const addNewTransaction = async (transaction) => {
    await addTransaction(activeWorkspaceId, user, transaction, isLegacyMode);
  };

  const removeTransaction = async (id) => {
    await deleteTransaction(activeWorkspaceId, id, isLegacyMode);
  };

  const editTransaction = async (id, updates) => {
    await updateTransaction(activeWorkspaceId, id, updates, isLegacyMode);
  };

  return {
    transactions,
    loading,
    addNewTransaction,
    removeTransaction,
    editTransaction
  };
};
