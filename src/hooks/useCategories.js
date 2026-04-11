import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";
import {
  addGuestCategory,
  isGuestCategoryUsed,
  isGuestUser,
  removeGuestCategory,
  subscribeToGuestCategories
} from "../services/localData";

export const useCategories = () => {
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const guestMode = isGuestUser(user);

  useEffect(() => {
    if (!activeWorkspaceId) {
      return;
    }

    if (guestMode) {
      const unsubscribeGuest = subscribeToGuestCategories(activeWorkspaceId, setCategories);
      return () => unsubscribeGuest();
    }

    const scopeRoot = isLegacyMode ? "users" : "workspaces";
    const ref = collection(db, scopeRoot, activeWorkspaceId, "categories");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs
        .map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data()
        }))
        .filter((category) => category.active !== false);

      setCategories(data);
    });

    return () => unsubscribe();
  }, [activeWorkspaceId, guestMode, isLegacyMode]);

  const addCategory = async (name, type, color) => {
    if (guestMode) {
      await addGuestCategory(activeWorkspaceId, {
        name,
        type,
        color: color || "#3498db"
      });
      return;
    }

    const ref = collection(
      db,
      isLegacyMode ? "users" : "workspaces",
      activeWorkspaceId,
      "categories"
    );

    await addDoc(ref, {
      name,
      type,
      color: color || "#3498db",
      active: true,
      createdAt: serverTimestamp()
    });
  };

  const isCategoryUsed = async (name) => {
    const txRef = collection(
      db,
      isLegacyMode ? "users" : "workspaces",
      activeWorkspaceId,
      "transactions"
    );

    const snapshot = await getDocs(
      query(txRef, where("category", "==", name), limit(1))
    );

    return !snapshot.empty;
  };

  const removeCategory = async (id, name) => {
    const used = guestMode
      ? isGuestCategoryUsed(activeWorkspaceId, name)
      : await isCategoryUsed(name);

    if (used) {
      alert("No puedes desactivar una categoria que tiene transacciones asociadas.");
      return;
    }

    if (guestMode) {
      await removeGuestCategory(activeWorkspaceId, id);
      return;
    }

    const ref = doc(
      db,
      isLegacyMode ? "users" : "workspaces",
      activeWorkspaceId,
      "categories",
      id
    );

    await updateDoc(ref, {
      active: false
    });
  };

  return {
    categories: activeWorkspaceId ? categories : [],
    addCategory,
    removeCategory
  };
};
