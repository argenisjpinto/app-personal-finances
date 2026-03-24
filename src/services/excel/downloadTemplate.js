import * as XLSX from "xlsx";

export const downloadImportTemplate = () => {

  const templateData = [
    {
      type: "income",
      amount: 1000,
      category: "Salary",
      currency: "USD",
      date: "2026-01-01",
      description: "Ejemplo ingreso"
    },
    {
      type: "expense",
      amount: 250,
      category: "Food",
      currency: "USD",
      date: "2026-01-05",
      description: "Ejemplo gasto"
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

  XLSX.writeFile(wb, "Plantilla_Importacion_Finanzas.xlsx");
};