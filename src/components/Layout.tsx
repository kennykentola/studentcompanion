import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/context/AuthContext";

export default function Layout() {
    const { loading } = useAuth();

    if (loading) return null; // Or a spinner

    return (
        <div className="min-h-screen bg-muted/20">
            <Sidebar />
            <div className="flex flex-col min-h-screen">
                {/* Offset content for sidebar on desktop */}
                <Header />
                <main className="flex-1 p-6 md:pl-72 pt-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
