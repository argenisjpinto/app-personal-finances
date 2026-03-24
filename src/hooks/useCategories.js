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

export const useCategories = (user) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "categories");

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
  }, [user]);

  const addCategory = async (name, type, color) => {
    const ref = collection(db, "users", user.uid, "categories");

    await addDoc(ref, {
      name,
      type,
      color: color || "#3498db",
      active: true,
      createdAt: serverTimestamp()
    });
  };

  const isCategoryUsed = async (name) => {
    const txRef = collection(db, "users", user.uid, "transactions");

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

    const ref = doc(db, "users", user.uid, "categories", id);

    await updateDoc(ref, {
      active: false
    });
  };

  return { categories, addCategory, removeCategory };
};