import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { 
  addTransaction, 
  addTransactions,
  deleteTransaction, 
  deleteTransactionPlan,
  updateTransaction,
  subscribeToTransactions
} from "../services/apiFirebase";

export const useTransactions = () => {
  const { user } = useAuth();
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const [transactions, setTransactions] = useState([]);
  const [resolvedSubscriptionKey, setResolvedSubscriptionKey] = useState("");
  const subscriptionKey =
    user && activeWorkspaceId
      ? `${user.uid}:${activeWorkspaceId}:${isLegacyMode ? "legacy" : "workspace"}`
      : "";

  useEffect(() => {
    if (!subscriptionKey) {
      return;
    }

    const unsubscribe = subscribeToTransactions(activeWorkspaceId, (data) => {
      setTransactions(data);
      setResolvedSubscriptionKey(subscriptionKey);
    }, isLegacyMode);

    return () => unsubscribe();
  }, [activeWorkspaceId, isLegacyMode, subscriptionKey]);

  const addNewTransaction = async (transaction) => {
    if (Array.isArray(transaction)) {
      await addTransactions(activeWorkspaceId, user, transaction, isLegacyMode);
      return;
    }

    await addTransaction(activeWorkspaceId, user, transaction, isLegacyMode);
  };

  const removeTransaction = async (transactionOrId) => {
    if (
      transactionOrId &&
      typeof transactionOrId === "object" &&
      transactionOrId.installmentPlanId
    ) {
      await deleteTransactionPlan(
        activeWorkspaceId,
        transactionOrId.installmentPlanId,
        isLegacyMode
      );
      return;
    }

    const transactionId =
      typeof transactionOrId === "object" ? transactionOrId.id : transactionOrId;

    await deleteTransaction(activeWorkspaceId, transactionId, isLegacyMode);
  };

  const editTransaction = async (id, updates) => {
    await updateTransaction(activeWorkspaceId, id, updates, isLegacyMode);
  };

  return {
    transactions: subscriptionKey ? transactions : [],
    loading: subscriptionKey ? resolvedSubscriptionKey !== subscriptionKey : false,
    addNewTransaction,
    removeTransaction,
    editTransaction
  };
};
