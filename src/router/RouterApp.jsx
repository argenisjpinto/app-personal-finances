import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout"
import { Home } from "../views/Home";
import { RegisterLogin } from "../views/RegisterLogin"
import { NotFound } from "../views/NotFound";
import { ProtectedRoute } from "../components/routing/ProtectedRoute"
import { Dashboard } from "../views/Dashboard";
import { Settings } from "../views/Settings";
import { Movements } from "../views/Movements";
import { Goals } from "../views/Goals";

const REDIRECT_STORAGE_KEY = "adia-finance-redirect-path";

const RedirectRestorer = () => {
    const navigate = useNavigate();

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const redirectPath = window.sessionStorage.getItem(REDIRECT_STORAGE_KEY);

        if (!redirectPath) {
            return;
        }

        window.sessionStorage.removeItem(REDIRECT_STORAGE_KEY);

        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

        if (redirectPath !== currentPath) {
            navigate(redirectPath, { replace: true });
        }
    }, [navigate]);

    return null;
}

const RouterApp = () => {
    return (
        <BrowserRouter>
            <RedirectRestorer />
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="register-login" element={<RegisterLogin />} />
                    <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="movements" element={<ProtectedRoute><Movements /></ProtectedRoute>} />
                    <Route path="goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
                    <Route path="settings" element={<ProtectedRoute><Settings />  </ProtectedRoute>}/>
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export { RouterApp };
