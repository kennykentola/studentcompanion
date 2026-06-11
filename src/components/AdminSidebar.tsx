import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    AlertOctagon,
    LogOut,
    X,
    Shield
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const adminItems = [
    { icon: LayoutDashboard, label: "Admin Overview", href: "/admin/dashboard" },
    { icon: Building2, label: "Campus Manager", href: "/admin/campus" },
    { icon: AlertOctagon, label: "Issue Resolution", href: "/admin/issues" },
];

interface SidebarProps {
    mobileMenuOpen?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ mobileMenuOpen, onClose }: SidebarProps) {
    const { pathname } = useLocation();
    const { logout } = useAuth();

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col w-64 h-screen border-r bg-slate-900 text-white transition-transform duration-300 ease-in-out md:translate-x-0",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Shield className="h-6 w-6 text-indigo-400" />
                    Admin Portal
                </h1>
                <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white" aria-label="Close admin menu" title="Close admin menu">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {adminItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname === item.href
                                ? "bg-indigo-600 text-white"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 mb-2 w-full text-sm font-medium text-slate-400 hover:text-white transition-colors">
                    Back to Student View
                </Link>
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
