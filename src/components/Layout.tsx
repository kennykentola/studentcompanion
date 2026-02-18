import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/context/AuthContext";

export default function Layout() {
    const { loading } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (loading) return null; // Or a spinner

    return (
        <div className="min-h-screen bg-muted/20">
            <Sidebar
                mobileMenuOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex flex-col min-h-screen">
                {/* Offset content for sidebar on desktop */}
                <Header onMenuClick={() => setMobileMenuOpen(true)} />
                <main className="flex-1 p-6 md:pl-72 pt-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
