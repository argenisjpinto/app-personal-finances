const parseDateString = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInput = (date) => {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date, amount) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  next.setDate(next.getDate() - 1);
  return next;
};

const addYears = (date, amount) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + amount);
  next.setDate(next.getDate() - 1);
  return next;
};

const startOfWeek = (date) => {
  const next = new Date(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  return next;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);

const getDefaultRangeStart = (type) => {
  const today = new Date();

  if (type === "weekly") {
    return startOfWeek(today);
  }

  if (type === "monthly") {
    return startOfMonth(today);
  }

  if (type === "yearly") {
    return startOfYear(today);
  }

  return today;
};

const resolveGoalDates = ({ type, startDate, endDate }) => {
  const safeStart = parseDateString(startDate) || getDefaultRangeStart(type);

  if (type === "weekly") {
    return {
      startDate: toDateInput(safeStart),
      endDate: endDate || toDateInput(addDays(safeStart, 6))
    };
  }

  if (type === "monthly") {
    return {
      startDate: toDateInput(safeStart),
      endDate: endDate || toDateInput(addMonths(safeStart, 1))
    };
  }

  if (type === "yearly") {
    return {
      startDate: toDateInput(safeStart),
      endDate: endDate || toDateInput(addYears(safeStart, 1))
    };
  }

  if (type === "custom_range") {
    return {
      startDate: startDate || "",
      endDate: endDate || ""
    };
  }

  return {
    startDate: startDate || "",
    endDate: ""
  };
};

const isTransactionInGoalRange = (transactionDate, goal) => {
  if (!transactionDate) {
    return false;
  }

  const current = parseDateString(transactionDate);
  const start = parseDateString(goal?.startDate);
  const end = parseDateString(goal?.endDate);

  if (!current) {
    return false;
  }

  if (start && current < start) {
    return false;
  }

  if (end && current > end) {
    return false;
  }

  return true;
};

const getSuggestedGoalDates = (type, startDate = "") => {
  return resolveGoalDates({ type, startDate, endDate: "" });
};

const formatGoalRange = (goal, locale = "es-AR") => {
  const start = parseDateString(goal?.startDate);
  const end = parseDateString(goal?.endDate);

  if (!start && !end) {
    return locale.startsWith("es") ? "Sin fecha definida" : "No fixed period";
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  if (start && end) {
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }

  if (start) {
    return locale.startsWith("es")
      ? `Desde ${formatter.format(start)}`
      : `From ${formatter.format(start)}`;
  }

  return formatter.format(end);
};

export { formatGoalRange, getSuggestedGoalDates, isTransactionInGoalRange, resolveGoalDates };
