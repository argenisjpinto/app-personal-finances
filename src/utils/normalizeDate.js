const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)$/;
const DATE_WITH_SEPARATORS_REGEX =
  /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;

const pad = (value) => String(value).padStart(2, "0");

const isValidDateParts = (year, month, day) => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
};

const formatDateParts = (year, month, day) =>
  `${year}-${pad(month)}-${pad(day)}`;

const formatUTCDate = (date) =>
  formatDateParts(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );

const normalizeExcelSerialDate = (serial) => {
  if (!Number.isFinite(serial)) {
    return "";
  }

  const wholeDays = Math.floor(serial + 1e-8);

  if (wholeDays <= 0) {
    return "";
  }

  const utcDate = new Date(EXCEL_EPOCH_UTC + wholeDays * MS_PER_DAY);
  return formatUTCDate(utcDate);
};

const normalizeIsoDate = (value) => {
  const match = value.match(ISO_DATE_REGEX);

  if (!match) {
    return "";
  }

  const [, year, month, day] = match.map(Number);

  return isValidDateParts(year, month, day)
    ? formatDateParts(year, month, day)
    : "";
};

const normalizeIsoDateTime = (value) => {
  if (!ISO_DATE_TIME_REGEX.test(value)) {
    return "";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : formatUTCDate(date);
};

const normalizeSlashOrDashDate = (value) => {
  const match = value.match(DATE_WITH_SEPARATORS_REGEX);

  if (!match) {
    return "";
  }

  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = Number(match[3]);

  let day = first;
  let month = second;

  if (first <= 12 && second > 12) {
    day = second;
    month = first;
  }

  return isValidDateParts(year, month, day)
    ? formatDateParts(year, month, day)
    : "";
};

export const isIsoDateString = (value) => normalizeIsoDate(value) !== "";

export const normalizeDate = (value) => {
  if (value == null) {
    return "";
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : formatUTCDate(value);
  }

  if (typeof value === "number") {
    return normalizeExcelSerialDate(value);
  }

  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return (
    normalizeIsoDate(trimmed) ||
    normalizeIsoDateTime(trimmed) ||
    normalizeSlashOrDashDate(trimmed) ||
    ""
  );
};
