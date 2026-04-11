import { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { loginWithGoogle, logoutUser } from "../services/apiFirebase";
import {
  clearGuestSession,
  getStoredGuestUser,
  isGuestUser,
  startGuestSession
} from "../services/localData";
import { AuthContext } from "./authContextObject";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const guestUser = getStoredGuestUser();
      setUser(currentUser || guestUser || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoading(true);
    clearGuestSession();
    const loggedUser = await loginWithGoogle();
    setUser(loggedUser);
    setLoading(false);
    return loggedUser;
  };

  const loginAsGuest = async () => {
    setLoading(true);
    const guestUser = startGuestSession();
    setUser(guestUser);
    setLoading(false);
    return guestUser;
  };

  const logout = async () => {
    setLoading(true);

    if (isGuestUser(user)) {
      clearGuestSession();
      setUser(null);
      setLoading(false);
      return;
    }

    await logoutUser();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginAsGuest,
        logout,
        loading,
        isGuestMode: isGuestUser(user)
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
