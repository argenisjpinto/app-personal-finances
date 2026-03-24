import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "./Header"
import { Footer } from './Footer'
import "../../styles/Dashboard.css";

const Layout = () => {
    const location = useLocation();

    useEffect(() => {
        if (!location.hash) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        const id = location.hash.replace("#", "");
        const element = document.getElementById(id);

        if (element) {
            window.setTimeout(() => {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 50);
        }
    }, [location.hash, location.pathname]);

    return (
        <div className="layout-shell">
            <Header />
            <main className="layout-main">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export { Layout }
