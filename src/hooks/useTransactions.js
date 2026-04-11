import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";
import {
  addTransaction,
  addTransactions,
  deleteTransaction,
  deleteTransactionPlan,
  subscribeToTransactions,
  updateTransaction
} from "../services/apiFirebase";
import {
  addGuestTransaction,
  addGuestTransactions,
  deleteGuestTransaction,
  deleteGuestTransactionPlan,
  isGuestUser,
  subscribeToGuestTransactions,
  updateGuestTransaction
} from "../services/localData";

export const useTransactions = () => {
  const { user } = useAuth();
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const [transactions, setTransactions] = useState([]);
  const [resolvedSubscriptionKey, setResolvedSubscriptionKey] = useState("");
  const guestMode = isGuestUser(user);
  const subscriptionKey =
    user && activeWorkspaceId
      ? `${user.uid}:${activeWorkspaceId}:${guestMode ? "guest" : isLegacyMode ? "legacy" : "workspace"}`
      : "";

  useEffect(() => {
    if (!subscriptionKey) {
      return;
    }

    const unsubscribe = guestMode
      ? subscribeToGuestTransactions(activeWorkspaceId, (data) => {
          setTransactions(data);
          setResolvedSubscriptionKey(subscriptionKey);
        })
      : subscribeToTransactions(
          activeWorkspaceId,
          (data) => {
            setTransactions(data);
            setResolvedSubscriptionKey(subscriptionKey);
          },
          isLegacyMode
        );

    return () => unsubscribe();
  }, [activeWorkspaceId, guestMode, isLegacyMode, subscriptionKey]);

  const addNewTransaction = async (transaction) => {
    if (Array.isArray(transaction)) {
      if (guestMode) {
        await addGuestTransactions(activeWorkspaceId, user, transaction);
        return;
      }

      await addTransactions(activeWorkspaceId, user, transaction, isLegacyMode);
      return;
    }

    if (guestMode) {
      await addGuestTransaction(activeWorkspaceId, user, transaction);
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
      if (guestMode) {
        await deleteGuestTransactionPlan(activeWorkspaceId, transactionOrId.installmentPlanId);
        return;
      }

      await deleteTransactionPlan(
        activeWorkspaceId,
        transactionOrId.installmentPlanId,
        isLegacyMode
      );
      return;
    }

    const transactionId =
      typeof transactionOrId === "object" ? transactionOrId.id : transactionOrId;

    if (guestMode) {
      await deleteGuestTransaction(activeWorkspaceId, transactionId);
      return;
    }

    await deleteTransaction(activeWorkspaceId, transactionId, isLegacyMode);
  };

  const editTransaction = async (id, updates) => {
    if (guestMode) {
      await updateGuestTransaction(activeWorkspaceId, id, updates);
      return;
    }

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
