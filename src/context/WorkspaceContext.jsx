import { useEffect, useMemo, useState } from "react";
import {
  createSharedWorkspaceWithInvite,
  deleteWorkspace as deleteWorkspaceService,
  getWorkspaceById,
  getUserProfile,
  initializeUserData,
  initializeLegacyUserData,
  inviteUserToWorkspace,
  isPermissionError,
  renameWorkspace as renameWorkspaceService,
  setLastActiveWorkspace,
  subscribeToUserMemberships
} from "../services/apiFirebase";
import {
  renameGuestWorkspace,
  setGuestLastActiveWorkspace,
  subscribeToGuestWorkspaces
} from "../services/localData";
import { useAuth } from "../hooks/useAuth";
import { WorkspaceContext } from "./workspaceContextObject";

const WorkspaceProvider = ({ children }) => {
  const { user, loading: authLoading, isGuestMode } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLegacyMode, setIsLegacyMode] = useState(false);

  const hydrateWorkspaces = async (memberships) => {
    const resolved = await Promise.all(
      memberships.map(async (membership) => {
        try {
          const workspace = await getWorkspaceById(membership.workspaceId);

          if (!workspace) {
            return membership;
          }

          return {
            ...membership,
            workspaceName: workspace.name || membership.workspaceName,
            workspaceType: workspace.type || membership.workspaceType,
            ownerUid: workspace.ownerUid || null
          };
        } catch (error) {
          if (isPermissionError(error)) {
            return null;
          }

          throw error;
        }
      })
    );

    const unique = new Map();

    resolved.filter(Boolean).forEach((workspace) => {
      if (!unique.has(workspace.workspaceId)) {
        unique.set(workspace.workspaceId, workspace);
      }
    });

    return Array.from(unique.values());
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      return;
    }

    if (isGuestMode) {
      const unsubscribeGuest = subscribeToGuestWorkspaces((nextSnapshot) => {
        setWorkspaces(nextSnapshot.workspaces);
        setActiveWorkspaceIdState((currentId) => {
          if (
            currentId &&
            nextSnapshot.workspaces.some((workspace) => workspace.workspaceId === currentId)
          ) {
            return currentId;
          }

          return (
            nextSnapshot.activeWorkspaceId ||
            nextSnapshot.workspaces[0]?.workspaceId ||
            null
          );
        });
        setIsLegacyMode(false);
        setLoading(false);
      });

      return () => unsubscribeGuest();
    }

    let cancelled = false;
    let unsubscribeMemberships = () => {};

    const setup = async () => {
      await initializeUserData(user);
      const profile = await getUserProfile(user.uid);

      if (cancelled) {
        return;
      }

      unsubscribeMemberships = subscribeToUserMemberships(user.uid, async (nextWorkspaces) => {
        if (cancelled) {
          return;
        }

        const hydratedWorkspaces = await hydrateWorkspaces(nextWorkspaces);

        if (cancelled) {
          return;
        }

        setWorkspaces(hydratedWorkspaces);
        setIsLegacyMode(false);
        setActiveWorkspaceIdState((currentId) => {
          if (
            currentId &&
            hydratedWorkspaces.some((workspace) => workspace.workspaceId === currentId)
          ) {
            return currentId;
          }

          return profile?.lastActiveWorkspaceId || hydratedWorkspaces[0]?.workspaceId || null;
        });
        setLoading(false);
      });
    };

    setup().catch((error) => {
      console.error("Error initializing workspaces:", error);
      if (!cancelled) {
        if (isPermissionError(error)) {
          initializeLegacyUserData(user)
            .then(() => {
              if (cancelled) {
                return;
              }

              setIsLegacyMode(true);
              setWorkspaces([
                {
                  id: user.uid,
                  workspaceId: user.uid,
                  workspaceName: "Mi espacio",
                  workspaceType: "legacy",
                  role: "owner"
                }
              ]);
              setActiveWorkspaceIdState(user.uid);
            })
            .finally(() => {
              if (!cancelled) {
                setLoading(false);
              }
            });
          return;
        }

        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribeMemberships();
    };
  }, [authLoading, isGuestMode, user]);

  const setActiveWorkspaceId = async (workspaceId) => {
    if (!workspaceId) {
      return;
    }

    setActiveWorkspaceIdState(workspaceId);
    if (isGuestMode) {
      await setGuestLastActiveWorkspace(workspaceId);
      return;
    }

    if (!user?.uid) {
      return;
    }

    if (isLegacyMode) {
      return;
    }

    await setLastActiveWorkspace(user.uid, workspaceId);
  };

  const createSharedWorkspace = async ({ workspaceName, inviteEmail }) => {
    if (!user) {
      return null;
    }

    if (isGuestMode) {
      throw new Error("El modo invitado guarda datos en este navegador y no permite espacios compartidos.");
    }

    if (isLegacyMode) {
      throw new Error("Tu Firestore aun no permite workspaces compartidos.");
    }

    const workspace = await createSharedWorkspaceWithInvite({
      user,
      workspaceName,
      inviteEmail
    });

    await setActiveWorkspaceId(workspace.id);
    return workspace;
  };

  const inviteToWorkspace = async ({ workspaceId, workspaceName, inviteEmail }) => {
    if (!user || !workspaceId || !inviteEmail?.trim()) {
      return;
    }

    if (isGuestMode) {
      throw new Error("El modo invitado no permite enviar invitaciones.");
    }

    if (isLegacyMode) {
      throw new Error("Tu Firestore aun no permite invitaciones a workspaces.");
    }

    await inviteUserToWorkspace({
      workspaceId,
      workspaceName,
      inviteEmail,
      user
    });
  };

  const renameWorkspace = async (workspaceId, name) => {
    if (!workspaceId || !name?.trim()) {
      return;
    }

    if (isGuestMode) {
      await renameGuestWorkspace({
        workspaceId,
        name: name.trim()
      });
      return;
    }

    if (isLegacyMode) {
      return;
    }

    await renameWorkspaceService({
      workspaceId,
      name: name.trim()
    });
  };

  const deleteWorkspace = async (workspaceId) => {
    if (!workspaceId || isLegacyMode || workspaces.length <= 1 || isGuestMode) {
      return;
    }

    const workspace = workspaces.find((current) => current.workspaceId === workspaceId);

    await deleteWorkspaceService({
      workspaceId,
      ownerUid: workspace?.ownerUid || user?.uid || null
    });

    if (activeWorkspaceId === workspaceId) {
      const fallbackWorkspace = workspaces.find((workspace) => workspace.workspaceId !== workspaceId);

      if (fallbackWorkspace) {
        await setActiveWorkspaceId(fallbackWorkspace.workspaceId);
      }
    }
  };

  const activeWorkspace = useMemo(
    () =>
      (user ? workspaces : []).find((workspace) => workspace.workspaceId === activeWorkspaceId) ||
      null,
    [activeWorkspaceId, user, workspaces]
  );

  const resolvedWorkspaces = user ? workspaces : [];
  const resolvedActiveWorkspaceId = user ? activeWorkspaceId : null;
  const resolvedLoading = authLoading ? true : user ? loading : false;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces: resolvedWorkspaces,
        activeWorkspace,
        activeWorkspaceId: resolvedActiveWorkspaceId,
        isLegacyMode,
        setActiveWorkspaceId,
        createSharedWorkspace,
        inviteToWorkspace,
        renameWorkspace,
        deleteWorkspace,
        loading: resolvedLoading
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export { WorkspaceProvider };
