import { useEffect, useState } from "react";

export const useDarkMode = () => {

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");

    if (stored === null) {
      return true;
    }

    return stored === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  return { darkMode, setDarkMode };
};
