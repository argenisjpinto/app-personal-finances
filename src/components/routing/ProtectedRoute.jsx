import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { useWorkspace } from "../../hooks/useWorkspace"

const ProtectedRoute = ({ children, redirectTo = '/register-login' }) => {
    const { user, loading } = useAuth()
    const { loading: workspaceLoading } = useWorkspace()

    if (loading || workspaceLoading) {
        return null;
    }

    if (!user) {
        return <Navigate to={redirectTo} replace />;
    }    
    return children ? children : <Outlet />;
};

export { ProtectedRoute }
