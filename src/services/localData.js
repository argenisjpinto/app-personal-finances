const GUEST_AUTH_KEY = "adia-finance-auth";
const GUEST_STORE_KEY = "adia-finance-guest-store-v1";
const GUEST_STORE_EVENT = "adia-finance-guest-store-changed";
const GUEST_WORKSPACE_ID = "guest-local-workspace";
const GUEST_USER_ID = "guest-local-user";

const DEFAULT_SETTINGS = {
  baseCurrency: "USD",
  savingsGoal: 0,
  expenseLimit: 0,
  expenseLimitCurrency: "USD",
  goals: [],
  activeGoalId: null
};

const DEFAULT_CURRENCIES = [
  {
    id: "USD",
    code: "USD",
    rate: 1,
    active: true
  },
  {
    id: "ARS",
    code: "ARS",
    rate: 1200,
    active: true
  }
];

const DEFAULT_CATEGORIES = [
  { id: "cat-food", name: "Comida", type: "expense", color: "#FF7A59", active: true },
  { id: "cat-home", name: "Hogar", type: "expense", color: "#46E6B0", active: true },
  { id: "cat-transport", name: "Transporte", type: "expense", color: "#16DBFF", active: true },
  { id: "cat-entertainment", name: "Entretenimiento", type: "expense", color: "#FFD447", active: true },
  { id: "cat-salary", name: "Salario", type: "income", color: "#8A7BFF", active: true },
  { id: "cat-freelance", name: "Freelance", type: "income", color: "#00C2A8", active: true }
];

const buildGuestUser = () => ({
  uid: GUEST_USER_ID,
  displayName: "Invitado",
  email: "",
  photoURL: "",
  isGuest: true
});

const createId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const nowIso = () => new Date().toISOString();

const getDefaultBucket = () => ({
  settings: { ...DEFAULT_SETTINGS },
  currencies: DEFAULT_CURRENCIES.map((currency) => ({ ...currency })),
  categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
  transactions: []
});

const createDefaultGuestStore = () => ({
  version: 1,
  profile: {
    lastActiveWorkspaceId: GUEST_WORKSPACE_ID
  },
  workspaces: [
    {
      id: GUEST_WORKSPACE_ID,
      workspaceId: GUEST_WORKSPACE_ID,
      workspaceName: "Espacio local",
      workspaceType: "local",
      role: "owner",
      ownerUid: GUEST_USER_ID
    }
  ],
  data: {
    [GUEST_WORKSPACE_ID]: getDefaultBucket()
  }
});

const clone = (value) => JSON.parse(JSON.stringify(value));

const normalizeBucket = (bucket = {}) => ({
  settings: {
    ...DEFAULT_SETTINGS,
    ...(bucket.settings || {})
  },
  currencies: Array.isArray(bucket.currencies) && bucket.currencies.length
    ? bucket.currencies.map((currency) => ({
        ...currency,
        id: currency.id || currency.code
      }))
    : DEFAULT_CURRENCIES.map((currency) => ({ ...currency })),
  categories: Array.isArray(bucket.categories) && bucket.categories.length
    ? bucket.categories.map((category) => ({
        ...category,
        id: category.id || createId("cat")
      }))
    : DEFAULT_CATEGORIES.map((category) => ({ ...category })),
  transactions: Array.isArray(bucket.transactions) ? bucket.transactions.map((item) => ({ ...item })) : []
});

const normalizeGuestStore = (store) => {
  const fallback = createDefaultGuestStore();
  const safeStore = store && typeof store === "object" ? store : fallback;
  const workspaces = Array.isArray(safeStore.workspaces) && safeStore.workspaces.length
    ? safeStore.workspaces.map((workspace) => ({
        ...workspace,
        id: workspace.id || workspace.workspaceId,
        workspaceId: workspace.workspaceId || workspace.id || GUEST_WORKSPACE_ID,
        workspaceName: workspace.workspaceName || "Espacio local",
        workspaceType: workspace.workspaceType || "local",
        role: workspace.role || "owner",
        ownerUid: workspace.ownerUid || GUEST_USER_ID
      }))
    : fallback.workspaces;
  const data = { ...(safeStore.data || {}) };

  workspaces.forEach((workspace) => {
    data[workspace.workspaceId] = normalizeBucket(data[workspace.workspaceId]);
  });

  const lastActiveWorkspaceId = workspaces.some(
    (workspace) => workspace.workspaceId === safeStore?.profile?.lastActiveWorkspaceId
  )
    ? safeStore.profile.lastActiveWorkspaceId
    : workspaces[0]?.workspaceId || GUEST_WORKSPACE_ID;

  return {
    version: 1,
    profile: {
      lastActiveWorkspaceId
    },
    workspaces,
    data
  };
};

const isBrowser = () => typeof window !== "undefined";

const dispatchGuestStoreChange = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(GUEST_STORE_EVENT));
};

const readGuestStore = () => {
  if (!isBrowser()) {
    return createDefaultGuestStore();
  }

  try {
    const raw = window.localStorage.getItem(GUEST_STORE_KEY);
    const normalized = normalizeGuestStore(raw ? JSON.parse(raw) : null);

    if (!raw) {
      window.localStorage.setItem(GUEST_STORE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch {
    const fallback = createDefaultGuestStore();
    window.localStorage.setItem(GUEST_STORE_KEY, JSON.stringify(fallback));
    return fallback;
  }
};

const writeGuestStore = (store) => {
  const normalized = normalizeGuestStore(store);

  if (isBrowser()) {
    window.localStorage.setItem(GUEST_STORE_KEY, JSON.stringify(normalized));
    dispatchGuestStoreChange();
  }

  return normalized;
};

const updateGuestStore = (updater) => {
  const current = readGuestStore();
  const next = typeof updater === "function" ? updater(clone(current)) : current;
  return writeGuestStore(next);
};

const subscribeToGuestStore = (callback) => {
  if (!isBrowser()) {
    callback(readGuestStore());
    return () => {};
  }

  const emit = () => callback(readGuestStore());
  const handleStorage = (event) => {
    if (event.key === GUEST_STORE_KEY) {
      emit();
    }
  };

  emit();
  window.addEventListener(GUEST_STORE_EVENT, emit);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(GUEST_STORE_EVENT, emit);
    window.removeEventListener("storage", handleStorage);
  };
};

const getBucket = (store, workspaceId) =>
  normalizeBucket(store.data?.[workspaceId] || getDefaultBucket());

const getGuestActor = (user) => ({
  createdByUid: user?.uid || GUEST_USER_ID,
  createdByName: user?.displayName || "Invitado",
  createdByEmail: user?.email || ""
});

const hydrateTransactions = (items = []) =>
  [...items]
    .map((item) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : null
    }))
    .sort((left, right) => {
      const leftTime = left.createdAt instanceof Date ? left.createdAt.getTime() : 0;
      const rightTime = right.createdAt instanceof Date ? right.createdAt.getTime() : 0;
      return rightTime - leftTime;
    });

export const isGuestUser = (user) => user?.isGuest === true;

export const getStoredGuestUser = () => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(GUEST_AUTH_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed?.mode === "guest" ? { ...buildGuestUser(), ...parsed.user, isGuest: true } : null;
  } catch {
    return null;
  }
};

export const startGuestSession = () => {
  const user = buildGuestUser();

  if (isBrowser()) {
    window.localStorage.setItem(
      GUEST_AUTH_KEY,
      JSON.stringify({
        mode: "guest",
        user
      })
    );
  }

  readGuestStore();
  return user;
};

export const clearGuestSession = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(GUEST_AUTH_KEY);
};

export const getGuestWorkspaceSnapshot = () => {
  const store = readGuestStore();
  return {
    workspaces: store.workspaces,
    activeWorkspaceId: store.profile.lastActiveWorkspaceId
  };
};

export const subscribeToGuestWorkspaces = (callback) =>
  subscribeToGuestStore((store) => {
    callback({
      workspaces: store.workspaces,
      activeWorkspaceId: store.profile.lastActiveWorkspaceId
    });
  });

export const setGuestLastActiveWorkspace = async (workspaceId) => {
  updateGuestStore((store) => {
    store.profile.lastActiveWorkspaceId = workspaceId;
    return store;
  });
};

export const renameGuestWorkspace = async ({ workspaceId, name }) => {
  updateGuestStore((store) => {
    store.workspaces = store.workspaces.map((workspace) =>
      workspace.workspaceId === workspaceId
        ? {
            ...workspace,
            workspaceName: name
          }
        : workspace
    );
    return store;
  });
};

export const subscribeToGuestSettings = (workspaceId, callback) =>
  subscribeToGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    const rates = bucket.currencies.reduce((accumulator, currency) => {
      if (currency.active !== false) {
        accumulator[currency.code] = Number(currency.rate) || 0;
      }
      return accumulator;
    }, {});

    callback({
      ...bucket.settings,
      rates
    });
  });

export const updateGuestSettings = async (workspaceId, updates) => {
  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    store.data[workspaceId] = {
      ...bucket,
      settings: {
        ...bucket.settings,
        ...updates
      }
    };
    return store;
  });
};

export const subscribeToGuestCurrencies = (workspaceId, callback) =>
  subscribeToGuestStore((store) => {
    callback(getBucket(store, workspaceId).currencies);
  });

export const addGuestCurrency = async (workspaceId, currency) => {
  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    const nextCurrency = {
      ...currency,
      id: currency.code,
      active: true,
      createdAt: nowIso()
    };
    const existingIndex = bucket.currencies.findIndex((item) => item.id === nextCurrency.id);

    if (existingIndex >= 0) {
      bucket.currencies[existingIndex] = nextCurrency;
    } else {
      bucket.currencies.push(nextCurrency);
    }

    store.data[workspaceId] = bucket;
    return store;
  });
};

export const updateGuestCurrency = async (workspaceId, id, updates) => {
  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    bucket.currencies = bucket.currencies.map((currency) =>
      currency.id === id ? { ...currency, ...updates } : currency
    );
    store.data[workspaceId] = bucket;
    return store;
  });
};

export const removeGuestCurrency = async (workspaceId, id) => {
  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    bucket.currencies = bucket.currencies.filter((currency) => currency.id !== id);
    store.data[workspaceId] = bucket;
    return store;
  });
};

export const isGuestCurrencyUsed = (workspaceId, code) => {
  const store = readGuestStore();
  return getBucket(store, workspaceId).transactions.some(
    (transaction) => transaction.currency === code
  );
};

export const subscribeToGuestCategories = (workspaceId, callback) =>
  subscribeToGuestStore((store) => {
    callback(getBucket(store, workspaceId).categories.filter((category) => category.active !== false));
  });

export const addGuestCategory = async (workspaceId, category) => {
  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    bucket.categories.push({
      ...category,
      id: category.id || createId("cat"),
      active: true,
      createdAt: nowIso()
    });
    store.data[workspaceId] = bucket;
    return store;
  });
};

export const removeGuestCategory = async (workspaceId, id) => {
  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    bucket.categories = bucket.categories.map((category) =>
      category.id === id ? { ...category, active: false } : category
    );
    store.data[workspaceId] = bucket;
    return store;
  });
};

export const isGuestCategoryUsed = (workspaceId, name) => {
  const store = readGuestStore();
  return getBucket(store, workspaceId).transactions.some(
    (transaction) => transaction.category === name
  );
};

export const subscribeToGuestTransactions = (workspaceId, callback) =>
  subscribeToGuestStore((store) => {
    callback(hydrateTransactions(getBucket(store, workspaceId).transactions));
  });

export const addGuestTransaction = async (workspaceId, user, data) => {
  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    bucket.transactions.unshift({
      id: createId("tx"),
      ...data,
      workspaceId,
      ...getGuestActor(user),
      createdAt: nowIso()
    });
    store.data[workspaceId] = bucket;
    return store;
  });
};

export const addGuestTransactions = async (workspaceId, user, items) => {
  const safeItems = Array.isArray(items) ? items : [];

  if (!safeItems.length) {
    return;
  }

  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    const createdAt = nowIso();
    const nextItems = safeItems.map((item) => ({
      id: createId("tx"),
      ...item,
      workspaceId,
      ...getGuestActor(user),
      createdAt
    }));

    bucket.transactions = [...nextItems, ...bucket.transactions];
    store.data[workspaceId] = bucket;
    return store;
  });
};

export const updateGuestTransaction = async (workspaceId, id, updates) => {
  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    bucket.transactions = bucket.transactions.map((transaction) =>
      transaction.id === id ? { ...transaction, ...updates } : transaction
    );
    store.data[workspaceId] = bucket;
    return store;
  });
};

export const deleteGuestTransaction = async (workspaceId, id) => {
  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    bucket.transactions = bucket.transactions.filter((transaction) => transaction.id !== id);
    store.data[workspaceId] = bucket;
    return store;
  });
};

export const deleteGuestTransactionPlan = async (workspaceId, installmentPlanId) => {
  updateGuestStore((store) => {
    const bucket = getBucket(store, workspaceId);
    bucket.transactions = bucket.transactions.filter(
      (transaction) => transaction.installmentPlanId !== installmentPlanId
    );
    store.data[workspaceId] = bucket;
    return store;
  });
};

export { DEFAULT_SETTINGS };
