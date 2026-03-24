import { useMemo } from "react";

export const useFilters = (transactions, filters) => {

  return useMemo(() => {

    let filtered = [...transactions];

    // 🔎 Filtro por tipo
    if (filters.type !== "all") {
      filtered = filtered.filter(
        t => t.type === filters.type
      );
    }

    // 🔎 Filtro por categoría
    if (filters.category) {
      filtered = filtered.filter(
        t =>
          t.category
            .toLowerCase()
            .includes(filters.category.toLowerCase())
      );
    }

    // 📅 Filtro desde fecha
    if (filters.dateFrom) {
      filtered = filtered.filter(
        t => t.date >= filters.dateFrom
      );
    }

    // 📅 Filtro hasta fecha
    if (filters.dateTo) {
      filtered = filtered.filter(
        t => t.date <= filters.dateTo
      );
    }

    // ↕ Orden
    filtered.sort((a, b) => {
      if (filters.order === "asc") {
        return new Date(a.date) - new Date(b.date);
      } else {
        return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;

  }, [transactions, filters]);

};