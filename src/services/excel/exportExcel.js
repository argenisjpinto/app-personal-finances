import * as XLSX from "xlsx";
import { toBaseCurrency } from "../../utils/convertCurrency";

export const exportToExcel = (transactions, settings) => {

  if (!transactions || transactions.length === 0) {
    alert("No hay transacciones para exportar");
    return;
  }

  const base = settings?.baseCurrency || "USD";
  const wb = XLSX.utils.book_new();

  // ==================================
  // 1️⃣ TRANSACCIONES
  // ==================================

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const transactionsSheet = sorted.map(t => ({
    Fecha: t.date,
    Tipo: t.type,
    Categoria: t.category,
    Moneda: t.currency,
    Monto_Original: Number(t.amount),
    [`Monto_${base}`]: Number(
      toBaseCurrency(t.amount, t.currency, settings).toFixed(2)
    ),
    Descripcion: t.description || ""
  }));

  const wsTransactions = XLSX.utils.json_to_sheet(transactionsSheet);
  XLSX.utils.book_append_sheet(wb, wsTransactions, "Transacciones");

  // ==================================
  // 2️⃣ RESUMEN
  // ==================================

  let totalIncome = 0;
  let totalExpense = 0;

  sorted.forEach(t => {
    const converted = toBaseCurrency(t.amount, t.currency, settings);

    if (t.type === "income") totalIncome += converted;
    else totalExpense += converted;
  });

  const summarySheet = [
    { Concepto: `Total Ingresos (${base})`, Valor: Number(totalIncome.toFixed(2)) },
    { Concepto: `Total Gastos (${base})`, Valor: Number(totalExpense.toFixed(2)) },
    { Concepto: `Balance (${base})`, Valor: Number((totalIncome - totalExpense).toFixed(2)) }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summarySheet);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

  // ==================================
  // 3️⃣ GASTOS POR CATEGORIA
  // ==================================

  const expensesByCategory = {};

  sorted.forEach(t => {
    if (t.type === "expense") {
      const converted = toBaseCurrency(t.amount, t.currency, settings);

      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + converted;
    }
  });

  const categorySheet = Object.keys(expensesByCategory).map(cat => ({
    Categoria: cat,
    [`Total_${base}`]: Number(
      expensesByCategory[cat].toFixed(2)
    )
  }));

  const wsCategory = XLSX.utils.json_to_sheet(categorySheet);
  XLSX.utils.book_append_sheet(wb, wsCategory, "Gastos_por_Categoria");

  // ==================================
  // 4️⃣ EVOLUCION MENSUAL
  // ==================================

  const monthlyData = {};

  sorted.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    const converted = toBaseCurrency(t.amount, t.currency, settings);

    if (t.type === "income") {
      monthlyData[monthKey].income += converted;
    } else {
      monthlyData[monthKey].expense += converted;
    }
  });

  const monthlySheet = Object.keys(monthlyData)
    .sort()
    .map(month => ({
      Mes: month,
      [`Ingresos_${base}`]: Number(monthlyData[month].income.toFixed(2)),
      [`Gastos_${base}`]: Number(monthlyData[month].expense.toFixed(2)),
      [`Balance_${base}`]: Number(
        (monthlyData[month].income - monthlyData[month].expense).toFixed(2)
      )
    }));

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(monthlySheet),
    "Evolucion_Mensual"
  );

  const today = new Date().toISOString().split("T")[0];

  XLSX.writeFile(wb, `Reporte_Financiero_${today}.xlsx`);
};