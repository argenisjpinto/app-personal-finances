import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "../components/layout/Layout"
import { Home } from "../views/Home";
import { RegisterLogin } from "../views/RegisterLogin"
import { NotFound } from "../views/NotFound";
import { ProtectedRoute } from "../components/routing/ProtectedRoute"
import { Dashboard } from "../views/Dashboard";
import { Settings } from "../views/Settings";
import { Movements } from "../views/Movements";
import { Goals } from "../views/Goals";


const RouterApp = () => {
    return (
        <BrowserRouter>
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
