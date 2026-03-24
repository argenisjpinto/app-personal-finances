import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const ProtectedRoute = ({ children, redirectTo = '/register-login' }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to={redirectTo} replace />;
    }    
    return children ? children : <Outlet />;
};

export { ProtectedRoute }
