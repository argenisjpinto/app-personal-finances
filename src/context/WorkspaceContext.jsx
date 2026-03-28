import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
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

const WorkspaceContext = createContext(null);

const WorkspaceProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
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
      setWorkspaces([]);
      setActiveWorkspaceIdState(null);
      setIsLegacyMode(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribeMemberships = () => {};

    const setup = async () => {
      setLoading(true);
      setIsLegacyMode(false);
      await initializeUserData(user);
      const profile = await getUserProfile(user.uid);

      if (cancelled) {
        return;
      }

      setActiveWorkspaceIdState(profile?.lastActiveWorkspaceId || null);

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
  }, [authLoading, user]);

  const setActiveWorkspaceId = async (workspaceId) => {
    if (!user?.uid || !workspaceId) {
      return;
    }

    setActiveWorkspaceIdState(workspaceId);
    if (isLegacyMode) {
      return;
    }

    await setLastActiveWorkspace(user.uid, workspaceId);
  };

  const createSharedWorkspace = async ({ workspaceName, inviteEmail }) => {
    if (!user) {
      return null;
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
    if (!workspaceId || !name?.trim() || isLegacyMode) {
      return;
    }

    await renameWorkspaceService({
      workspaceId,
      name: name.trim()
    });
  };

  const deleteWorkspace = async (workspaceId) => {
    if (!workspaceId || isLegacyMode || workspaces.length <= 1) {
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
      workspaces.find((workspace) => workspace.workspaceId === activeWorkspaceId) ||
      null,
    [activeWorkspaceId, workspaces]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        isLegacyMode,
        setActiveWorkspaceId,
        createSharedWorkspace,
        inviteToWorkspace,
        renameWorkspace,
        deleteWorkspace,
        loading
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

const useWorkspace = () => {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace debe usarse dentro de WorkspaceProvider");
  }

  return context;
};

export { WorkspaceProvider, useWorkspace };
