import * as XLSX from "xlsx";
import {
  collection,
  doc,
  writeBatch,
  Timestamp 
} from "firebase/firestore";
import { db } from "../../config/firebase";

// Mapea headers posibles -> nombre interno
const HEADER_MAP = {
  // Inglés (interno)
  type: "type",
  amount: "amount",
  category: "category",
  currency: "currency",
  date: "date",
  description: "description",

  // Español (export actual)
  Tipo: "type",
  Monto_Original: "amount",
  Categoria: "category",
  Moneda: "currency",
  Fecha: "date",
  Descripcion: "description",

  // Variantes comunes
  Monto: "amount",
  Categoría: "category",
  Moneda_Original: "currency",
  "Descripción": "description"
};

const REQUIRED = ["type", "amount", "category", "currency", "date"];

const normalizeRow = (row) => {
  const normalized = {};

  Object.keys(row).forEach((key) => {
    const mapped = HEADER_MAP[key];
    if (mapped) normalized[mapped] = row[key];
  });

  return normalized;
};

const parseAmount = (value) => {
  if (typeof value === "number") return value;

  if (!value) return 0;

  let str = value.toString().trim();

  // Detectamos cuál es el separador decimal real
  const lastComma = str.lastIndexOf(",");
  const lastDot = str.lastIndexOf(".");

  if (lastComma > lastDot) {
    // Formato tipo 1.234,56
    str = str.replace(/\./g, "");
    str = str.replace(",", ".");
  } else if (lastDot > lastComma) {
    // Formato tipo 1,234.56
    str = str.replace(/,/g, "");
  } else {
    // Solo números simples
    str = str.replace(",", ".");
  }

  const parsed = parseFloat(str);

  return isNaN(parsed) ? 0 : parsed;
};

export const importFromExcel = async (file, user, categories, currencies) => {
  if (!user) throw new Error("Usuario no autenticado");
  if (!file) throw new Error("Archivo no válido");

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (!rawRows.length) throw new Error("El archivo está vacío");

  const rows = rawRows.map(normalizeRow);

  const keys = Object.keys(rows[0] || {});
  for (const col of REQUIRED) {
    if (!keys.includes(col)) {
      throw new Error(
        `Falta columna obligatoria: ${col}\n` +
        `Columnas detectadas: ${keys.join(", ")}`
      );
    }
  }

  const validCategories = new Set(
    (categories || []).filter(c => c.active !== false).map(c => c.name)
  );

  const validCurrencies = new Set(
    (currencies || []).filter(c => c.active !== false).map(c => c.code)
  );

  const errors = [];

  rows.forEach((row, idx) => {
    const line = idx + 2;

    const type = String(row.type).trim().toLowerCase();
    const amount = parseAmount(row.amount);
    const category = String(row.category).trim();
    const currency = String(row.currency).trim().toUpperCase();
    const date = String(row.date).trim();

    if (!["income", "expense"].includes(type)) {
      errors.push(`Fila ${line}: type inválido`);
    }

    if (!Number.isFinite(amount)) {
      errors.push(`Fila ${line}: monto inválido`);
    }

    if (!category) {
      errors.push(`Fila ${line}: category obligatoria`);
    } else if (!validCategories.has(category)) {
      errors.push(`Fila ${line}: categoría inexistente (${category})`);
    }

    if (!currency) {
      errors.push(`Fila ${line}: currency obligatoria`);
    } else if (!validCurrencies.has(currency)) {
      errors.push(`Fila ${line}: moneda inexistente (${currency})`);
    }

    if (!date) {
      errors.push(`Fila ${line}: date obligatoria`);
    }
  });

  if (errors.length) {
    throw new Error(
      errors.slice(0, 15).join("\n") +
      (errors.length > 15 ? `\n...y ${errors.length - 15} más` : "")
    );
  }

  // 🔥 Batch insert con chunking (máx 500 por batch)
  const txRef = collection(db, "users", user.uid, "transactions");
  const CHUNK_SIZE = 500;
  let totalInserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const row of chunk) {
      const data = {
        type: String(row.type).trim().toLowerCase(),
        amount: parseAmount(row.amount),
        category: String(row.category).trim(),
        currency: String(row.currency).trim().toUpperCase(),
        date: String(row.date).trim(),
        description: String(row.description || "").trim(),
        createdAt: Timestamp.now()
      };

      const newDoc = doc(txRef);
      batch.set(newDoc, data);
    }

    await batch.commit();
    totalInserted += chunk.length;
  }

  return totalInserted;
};