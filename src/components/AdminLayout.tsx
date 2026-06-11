import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import Header from "./Header";

export default function AdminLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <AdminSidebar 
                mobileMenuOpen={mobileMenuOpen} 
                onClose={() => setMobileMenuOpen(false)} 
            />
            
            <div className="flex-1 flex flex-col md:pl-64 transition-all">
                <Header onMenuClick={() => setMobileMenuOpen(true)} />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
                    <Outlet />
                </main>
            </div>
            
            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
