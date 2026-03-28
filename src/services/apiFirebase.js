import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider, db } from "../config/firebase";

const DEFAULT_SETTINGS = {
  baseCurrency: "USD",
  savingsGoal: 0,
  expenseLimit: 0,
  expenseLimitCurrency: "USD",
  goals: [],
  activeGoalId: null
};

const getUserRef = (uid) => doc(db, "users", uid);
const getUserMembershipsRef = (uid) => collection(db, "users", uid, "memberships");
const getWorkspaceRef = (workspaceId) => doc(db, "workspaces", workspaceId);
const getInviteRef = (inviteId) => doc(db, "workspaceInvites", inviteId);
const getWorkspaceMembersRef = (workspaceId) => collection(db, "workspaces", workspaceId, "members");

export const isPermissionError = (error) =>
  error?.code === "permission-denied" ||
  error?.message?.toLowerCase?.().includes("insufficient permissions");

export const getScopedCollectionRef = (scopeId, key, isLegacyMode = false) =>
  collection(db, isLegacyMode ? "users" : "workspaces", scopeId, key);

export const getScopedDocRef = (scopeId, collectionName, docId, isLegacyMode = false) =>
  doc(db, isLegacyMode ? "users" : "workspaces", scopeId, collectionName, docId);

const createWorkspaceId = () =>
  `ws_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const getFirstName = (user) => {
  const first = user?.displayName?.trim()?.split(/\s+/)?.[0];
  return first || "My";
};

const createPersonalWorkspaceName = (user) => `${getFirstName(user)} Personal`;
const createSharedWorkspaceName = (user) => `${getFirstName(user)} Home`;

const ensureWorkspaceBaseData = async (scopeId, isLegacyMode = false) => {
  const settingsRef = getScopedDocRef(scopeId, "settings", "config", isLegacyMode);
  const settingsSnap = await getDoc(settingsRef);

  if (!settingsSnap.exists()) {
    await setDoc(settingsRef, {
      ...DEFAULT_SETTINGS,
      createdAt: serverTimestamp()
    });
  }

  const usdRef = getScopedDocRef(scopeId, "currencies", "USD", isLegacyMode);
  const usdSnap = await getDoc(usdRef);

  if (!usdSnap.exists()) {
    await setDoc(usdRef, {
      code: "USD",
      rate: 1,
      active: true,
      createdAt: serverTimestamp()
    });
  }
};

const createUserMembership = async ({
  user,
  workspaceId,
  workspaceName,
  workspaceType,
  role
}) => {
  const membershipRef = doc(db, "users", user.uid, "memberships", workspaceId);

  await setDoc(
    membershipRef,
    {
      workspaceId,
      workspaceName,
      workspaceType,
      role,
      joinedAt: serverTimestamp()
    },
    { merge: true }
  );
};

const createWorkspaceMember = async ({
  user,
  workspaceId,
  role,
  inviteId = null
}) => {
  const memberRef = doc(db, "workspaces", workspaceId, "members", user.uid);
  const payload = {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    role,
    joinedAt: serverTimestamp()
  };

  if (inviteId) {
    payload.inviteId = inviteId;
  }

  await setDoc(memberRef, payload, { merge: true });
};

const linkUserToWorkspace = async ({
  user,
  workspaceId,
  workspaceName,
  workspaceType,
  role,
  inviteId = null
}) => {
  await createWorkspaceMember({
    user,
    workspaceId,
    role,
    inviteId
  });

  await createUserMembership({
    user,
    workspaceId,
    workspaceName,
    workspaceType,
    role
  });

  await ensureWorkspaceBaseData(workspaceId);
};

const createWorkspace = async ({ user, name, type, role = "owner" }) => {
  const workspaceId = createWorkspaceId();
  const workspaceRef = getWorkspaceRef(workspaceId);

  await setDoc(workspaceRef, {
    name,
    type,
    ownerUid: user.uid,
    createdByUid: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await linkUserToWorkspace({
    user,
    workspaceId,
    workspaceName: name,
    workspaceType: type,
    role
  });

  return {
    id: workspaceId,
    name,
    type
  };
};

const migrateLegacyUserDataToWorkspace = async (user, workspaceId) => {
  const workspaceRef = getWorkspaceRef(workspaceId);
  const workspaceSnap = await getDoc(workspaceRef);

  if (workspaceSnap.data()?.legacyMigratedFromUid === user.uid) {
    return;
  }

  const legacySettingsRef = doc(db, "users", user.uid, "settings", "config");
  const legacyCurrenciesRef = collection(db, "users", user.uid, "currencies");
  const legacyCategoriesRef = collection(db, "users", user.uid, "categories");
  const legacyTransactionsRef = collection(db, "users", user.uid, "transactions");

  const [settingsSnap, currenciesSnap, categoriesSnap, transactionsSnap] = await Promise.all([
    getDoc(legacySettingsRef),
    getDocs(legacyCurrenciesRef),
    getDocs(legacyCategoriesRef),
    getDocs(legacyTransactionsRef)
  ]);

  const settingsRef = doc(db, "workspaces", workspaceId, "settings", "config");
  const settingsData = settingsSnap.exists() ? settingsSnap.data() : DEFAULT_SETTINGS;

  await setDoc(
    settingsRef,
    {
      ...DEFAULT_SETTINGS,
      ...settingsData,
      migratedAt: serverTimestamp()
    },
    { merge: true }
  );

  const operations = [];

  currenciesSnap.forEach((currencyDoc) => {
    operations.push({
      ref: doc(db, "workspaces", workspaceId, "currencies", currencyDoc.id),
      data: currencyDoc.data()
    });
  });

  categoriesSnap.forEach((categoryDoc) => {
    operations.push({
      ref: doc(db, "workspaces", workspaceId, "categories", categoryDoc.id),
      data: categoryDoc.data()
    });
  });

  transactionsSnap.forEach((transactionDoc) => {
    operations.push({
      ref: doc(db, "workspaces", workspaceId, "transactions", transactionDoc.id),
      data: {
        ...transactionDoc.data(),
        workspaceId,
        createdByUid: user.uid,
        createdByName: user.displayName || "",
        createdByEmail: user.email || ""
      }
    });
  });

  for (let index = 0; index < operations.length; index += 400) {
    const batch = writeBatch(db);
    operations.slice(index, index + 400).forEach(({ ref, data }) => {
      batch.set(ref, data, { merge: true });
    });
    await batch.commit();
  }

  await ensureWorkspaceBaseData(workspaceId);
  await updateDoc(workspaceRef, {
    legacyMigratedFromUid: user.uid,
    updatedAt: serverTimestamp()
  });
};

const acceptWorkspaceInvite = async (user, inviteDoc) => {
  const invite = inviteDoc.data();
  const membershipRef = doc(db, "users", user.uid, "memberships", invite.workspaceId);
  const membershipSnap = await getDoc(membershipRef);

  if (!membershipSnap.exists()) {
    await linkUserToWorkspace({
      user,
      workspaceId: invite.workspaceId,
      workspaceName: invite.workspaceName,
      workspaceType: invite.workspaceType || "shared",
      role: "member",
      inviteId: inviteDoc.id
    });
  }

  await updateDoc(inviteDoc.ref, {
    status: "accepted",
    acceptedByUid: user.uid,
    acceptedAt: serverTimestamp()
  });
};

const acceptPendingInvites = async (user) => {
  const emailLower = user?.email?.toLowerCase();

  if (!emailLower) {
    return;
  }

  const invitesQuery = query(
    collection(db, "workspaceInvites"),
    where("emailLower", "==", emailLower)
  );

  const invitesSnap = await getDocs(invitesQuery);

  for (const inviteDoc of invitesSnap.docs) {
    if (inviteDoc.data().status === "pending") {
      await acceptWorkspaceInvite(user, inviteDoc);
    }
  }
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const initializeUserData = async (user) => {
  if (!user?.uid) {
    return;
  }

  const userRef = getUserRef(user.uid);
  await setDoc(
    userRef,
    {
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  const membershipsRef = getUserMembershipsRef(user.uid);
  let membershipsSnap = await getDocs(membershipsRef);

  if (membershipsSnap.empty) {
    const personalWorkspace = await createWorkspace({
      user,
      name: createPersonalWorkspaceName(user),
      type: "personal"
    });

    await migrateLegacyUserDataToWorkspace(user, personalWorkspace.id);
    membershipsSnap = await getDocs(membershipsRef);
  }

  await acceptPendingInvites(user);
  membershipsSnap = await getDocs(membershipsRef);

  const membershipIds = membershipsSnap.docs.map((membership) => membership.id);
  const userSnap = await getDoc(userRef);
  const currentActiveId = userSnap.data()?.lastActiveWorkspaceId;
  const fallbackActiveId =
    currentActiveId && membershipIds.includes(currentActiveId)
      ? currentActiveId
      : membershipIds[0] || null;

  if (fallbackActiveId) {
    await setDoc(
      userRef,
      {
        lastActiveWorkspaceId: fallbackActiveId
      },
      { merge: true }
    );
  }
};

export const initializeLegacyUserData = async (user) => {
  if (!user?.uid) {
    return;
  }

  const userRef = getUserRef(user.uid);
  await setDoc(
    userRef,
    {
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await ensureWorkspaceBaseData(user.uid, true);
};

export const subscribeToUserMemberships = (uid, callback) => {
  const ref = collection(db, "users", uid, "memberships");

  return onSnapshot(ref, (snapshot) => {
    callback(
      snapshot.docs.map((membershipDoc) => ({
        id: membershipDoc.id,
        ...membershipDoc.data()
      }))
    );
  });
};

export const getUserProfile = async (uid) => {
  const userSnap = await getDoc(getUserRef(uid));
  return userSnap.exists() ? userSnap.data() : null;
};

export const getWorkspaceById = async (workspaceId) => {
  const workspaceSnap = await getDoc(getWorkspaceRef(workspaceId));
  return workspaceSnap.exists() ? { id: workspaceSnap.id, ...workspaceSnap.data() } : null;
};

export const setLastActiveWorkspace = async (uid, workspaceId) => {
  await setDoc(
    getUserRef(uid),
    {
      lastActiveWorkspaceId: workspaceId,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const subscribeToTransactions = (scopeId, callback, isLegacyMode = false) => {
  if (!scopeId) {
    return () => {};
  }

  const transactionsRef = getScopedCollectionRef(scopeId, "transactions", isLegacyMode);
  const transactionsQuery = query(transactionsRef, orderBy("createdAt", "desc"));

  return onSnapshot(transactionsQuery, (snapshot) => {
    const data = snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
      createdAt: snapshotDoc.data().createdAt?.toDate?.() || null
    }));

    callback(data);
  });
};

export const addTransaction = async (scopeId, user, data, isLegacyMode = false) => {
  await addDoc(getScopedCollectionRef(scopeId, "transactions", isLegacyMode), {
    ...data,
    ...(isLegacyMode ? {} : { workspaceId: scopeId }),
    createdByUid: user.uid,
    createdByName: user.displayName || "",
    createdByEmail: user.email || "",
    createdAt: serverTimestamp()
  });
};

export const deleteTransaction = async (scopeId, id, isLegacyMode = false) => {
  await deleteDoc(getScopedDocRef(scopeId, "transactions", id, isLegacyMode));
};

export const updateTransaction = async (scopeId, id, updates, isLegacyMode = false) => {
  await updateDoc(getScopedDocRef(scopeId, "transactions", id, isLegacyMode), updates);
};

export const createSharedWorkspaceWithInvite = async ({
  user,
  workspaceName,
  inviteEmail
}) => {
  const workspace = await createWorkspace({
    user,
    name: workspaceName?.trim() || createSharedWorkspaceName(user),
    type: "shared"
  });

  if (inviteEmail?.trim()) {
    await addDoc(collection(db, "workspaceInvites"), {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceType: "shared",
      emailLower: inviteEmail.trim().toLowerCase(),
      invitedByUid: user.uid,
      invitedByEmail: user.email || "",
      status: "pending",
      createdAt: serverTimestamp()
    });
  }

  return workspace;
};

export const inviteUserToWorkspace = async ({
  workspaceId,
  workspaceName,
  inviteEmail,
  user
}) => {
  await addDoc(collection(db, "workspaceInvites"), {
    workspaceId,
    workspaceName,
    workspaceType: "shared",
    emailLower: inviteEmail.trim().toLowerCase(),
    invitedByUid: user.uid,
    invitedByEmail: user.email || "",
    status: "pending",
    createdAt: serverTimestamp()
  });
};

export const getInvite = async (inviteId) => {
  const inviteSnap = await getDoc(getInviteRef(inviteId));
  return inviteSnap.exists() ? { id: inviteSnap.id, ...inviteSnap.data() } : null;
};

export const renameWorkspace = async ({ workspaceId, name }) => {
  const workspaceRef = getWorkspaceRef(workspaceId);
  const membersSnap = await getDocs(getWorkspaceMembersRef(workspaceId));

  await updateDoc(workspaceRef, {
    name,
    updatedAt: serverTimestamp()
  });

  for (let index = 0; index < membersSnap.docs.length; index += 400) {
    const batch = writeBatch(db);

    membersSnap.docs.slice(index, index + 400).forEach((memberDoc) => {
      batch.set(
        doc(db, "users", memberDoc.id, "memberships", workspaceId),
        { workspaceName: name },
        { merge: true }
      );
    });

    await batch.commit();
  }
};

export const deleteWorkspace = async ({ workspaceId, ownerUid }) => {
  const membersSnap = await getDocs(getWorkspaceMembersRef(workspaceId));
  const collectionsToDelete = ["transactions", "currencies", "categories", "settings"];
  const nonOwnerMembershipRefs = [];
  const nonOwnerMemberRefs = [];
  const collectionRefs = [];

  membersSnap.docs.forEach((memberDoc) => {
    if (memberDoc.id === ownerUid) {
      return;
    }

    nonOwnerMembershipRefs.push(doc(db, "users", memberDoc.id, "memberships", workspaceId));
    nonOwnerMemberRefs.push(memberDoc.ref);
  });

  for (const collectionName of collectionsToDelete) {
    const collectionSnap = await getDocs(collection(db, "workspaces", workspaceId, collectionName));
    collectionSnap.docs.forEach((collectionDoc) => {
      collectionRefs.push(collectionDoc.ref);
    });
  }

  const invitesSnap = await getDocs(
    query(collection(db, "workspaceInvites"), where("workspaceId", "==", workspaceId))
  );
  const inviteRefs = invitesSnap.docs.map((inviteDoc) => inviteDoc.ref);

  const runDeletes = async (refs) => {
    for (let index = 0; index < refs.length; index += 400) {
      const batch = writeBatch(db);
      refs.slice(index, index + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  };

  await runDeletes([
    ...collectionRefs,
    ...inviteRefs,
    ...nonOwnerMembershipRefs,
    ...nonOwnerMemberRefs
  ]);

  await deleteDoc(getWorkspaceRef(workspaceId));

  if (ownerUid) {
    await deleteDoc(doc(db, "users", ownerUid, "memberships", workspaceId));
    await deleteDoc(doc(db, "workspaces", workspaceId, "members", ownerUid));
  }
};
