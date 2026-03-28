import { useEffect, useState } from "react";
import { 
  collection,
  addDoc,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  limit
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useWorkspace } from "../context/WorkspaceContext";

export const useCategories = () => {
  const { activeWorkspaceId, isLegacyMode } = useWorkspace();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setCategories([]);
      return;
    }

    const scopeRoot = isLegacyMode ? "users" : "workspaces";
    const ref = collection(db, scopeRoot, activeWorkspaceId, "categories");

    const unsubscribe = onSnapshot(ref, snapshot => {
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(c => c.active !== false);

      setCategories(data);
    });

    return () => unsubscribe();
  }, [activeWorkspaceId, isLegacyMode]);

  const addCategory = async (name, type, color) => {
    const ref = collection(db, isLegacyMode ? "users" : "workspaces", activeWorkspaceId, "categories");

    await addDoc(ref, {
      name,
      type,
      color: color || "#3498db",
      active: true,
      createdAt: serverTimestamp()
    });
  };

  const isCategoryUsed = async (name) => {
    const txRef = collection(db, isLegacyMode ? "users" : "workspaces", activeWorkspaceId, "transactions");

    const q = query(
      txRef,
      where("category", "==", name),
      limit(1)
    );

    const snapshot = await getDocs(q);

    return !snapshot.empty;
  };

  const removeCategory = async (id, name) => {
    const used = await isCategoryUsed(name);

    if (used) {
      alert("No puedes desactivar una categoría que tiene transacciones asociadas.");
      return;
    }

    const ref = doc(db, isLegacyMode ? "users" : "workspaces", activeWorkspaceId, "categories", id);

    await updateDoc(ref, {
      active: false
    });
  };

  return { categories, addCategory, removeCategory };
};
