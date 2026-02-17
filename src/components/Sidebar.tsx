import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    GraduationCap,
    MessageSquare,
    Settings,
    LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: CheckSquare, label: "Tasks", href: "/tasks" },
    { icon: Calendar, label: "Timetable", href: "/timetable" },
    { icon: GraduationCap, label: "Grades", href: "/grades" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
    const { pathname } = useLocation();
    const { logout } = useAuth();

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen border-r bg-card fixed left-0 top-0">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                    <GraduationCap className="h-6 w-6" />
                    StudentApp
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {sidebarItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname === item.href
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
