import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useWorkspace } from "../../context/WorkspaceContext"

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
