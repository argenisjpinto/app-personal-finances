import * as XLSX from "xlsx";
import {
  Timestamp,
  collection,
  doc,
  writeBatch
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { normalizeDate } from "../../utils/normalizeDate";
import { addGuestTransactions, isGuestUser } from "../localData";

const HEADER_MAP = {
  type: "type",
  amount: "amount",
  category: "category",
  currency: "currency",
  date: "date",
  description: "description",
  Tipo: "type",
  Monto_Original: "amount",
  Categoria: "category",
  Moneda: "currency",
  Fecha: "date",
  Descripcion: "description",
  Monto: "amount",
  Categoría: "category",
  Moneda_Original: "currency",
  Descripción: "description"
};

const REQUIRED = ["type", "amount", "category", "currency", "date"];

const normalizeRow = (row) => {
  const normalized = {};

  Object.keys(row).forEach((key) => {
    const mapped = HEADER_MAP[key];

    if (mapped) {
      normalized[mapped] = row[key];
    }
  });

  return normalized;
};

const parseAmount = (value) => {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  let str = value.toString().trim();
  const lastComma = str.lastIndexOf(",");
  const lastDot = str.lastIndexOf(".");

  if (lastComma > lastDot) {
    str = str.replace(/\./g, "");
    str = str.replace(",", ".");
  } else if (lastDot > lastComma) {
    str = str.replace(/,/g, "");
  } else {
    str = str.replace(",", ".");
  }

  const parsed = parseFloat(str);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const importFromExcel = async (
  file,
  user,
  scopeId,
  categories,
  currencies,
  isLegacyMode = false
) => {
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  if (!file) {
    throw new Error("Archivo no valido");
  }

  if (!scopeId) {
    throw new Error("Espacio de trabajo no disponible");
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (!rawRows.length) {
    throw new Error("El archivo esta vacio");
  }

  const rows = rawRows.map(normalizeRow);
  const keys = Object.keys(rows[0] || {});

  for (const col of REQUIRED) {
    if (!keys.includes(col)) {
      throw new Error(
        `Falta columna obligatoria: ${col}\nColumnas detectadas: ${keys.join(", ")}`
      );
    }
  }

  const validCategories = new Set(
    (categories || []).filter((category) => category.active !== false).map((category) => category.name)
  );
  const validCurrencies = new Set(
    (currencies || []).filter((currency) => currency.active !== false).map((currency) => currency.code)
  );

  const errors = [];

  rows.forEach((row, idx) => {
    const line = idx + 2;
    const type = String(row.type).trim().toLowerCase();
    const amount = parseAmount(row.amount);
    const category = String(row.category).trim();
    const currency = String(row.currency).trim().toUpperCase();
    const date = normalizeDate(row.date);

    if (!["income", "expense"].includes(type)) {
      errors.push(`Fila ${line}: type invalido`);
    }

    if (!Number.isFinite(amount)) {
      errors.push(`Fila ${line}: monto invalido`);
    }

    if (!category) {
      errors.push(`Fila ${line}: category obligatoria`);
    } else if (!validCategories.has(category)) {
      errors.push(`Fila ${line}: categoria inexistente (${category})`);
    }

    if (!currency) {
      errors.push(`Fila ${line}: currency obligatoria`);
    } else if (!validCurrencies.has(currency)) {
      errors.push(`Fila ${line}: moneda inexistente (${currency})`);
    }

    if (!date) {
      errors.push(`Fila ${line}: date invalida o vacia`);
    }
  });

  if (errors.length) {
    throw new Error(
      errors.slice(0, 15).join("\n") +
      (errors.length > 15 ? `\n...y ${errors.length - 15} mas` : "")
    );
  }

  const mappedRows = rows.map((row) => ({
    type: String(row.type).trim().toLowerCase(),
    amount: parseAmount(row.amount),
    category: String(row.category).trim(),
    currency: String(row.currency).trim().toUpperCase(),
    date: normalizeDate(row.date),
    description: String(row.description || "").trim()
  }));

  if (isGuestUser(user)) {
    await addGuestTransactions(scopeId, user, mappedRows);
    return mappedRows.length;
  }

  const transactionsRef = collection(
    db,
    isLegacyMode ? "users" : "workspaces",
    scopeId,
    "transactions"
  );
  const chunkSize = 500;
  let totalInserted = 0;

  for (let index = 0; index < mappedRows.length; index += chunkSize) {
    const chunk = mappedRows.slice(index, index + chunkSize);
    const batch = writeBatch(db);

    for (const row of chunk) {
      batch.set(doc(transactionsRef), {
        ...row,
        ...(isLegacyMode ? {} : { workspaceId: scopeId }),
        createdByUid: user.uid,
        createdByName: user.displayName || "",
        createdByEmail: user.email || "",
        createdAt: Timestamp.now()
      });
    }

    await batch.commit();
    totalInserted += chunk.length;
  }

  return totalInserted;
};
