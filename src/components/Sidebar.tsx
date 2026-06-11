import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    GraduationCap,
    MessageSquare,
    Settings,
    LogOut,
    Calculator,
    X,
    Bell,
    Clock
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const mainItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Calendar, label: "Timetable", href: "/timetable" },
];

const todoItems = [
    { icon: Clock, label: "Reminder Service", href: "/reminders" },
    { icon: CheckSquare, label: "Task Manager Service", href: "/tasks" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
];

const cgpaItems = [
    { icon: Calculator, label: "Calculator", href: "/calculator" },
];

/* Study Tools Section (Hidden per request)
const studyItems = [
    { icon: Brain, label: "Flashcards", href: "/flashcards" },
    { icon: BookMarked, label: "Resources", href: "/resources" },
    { icon: Users, label: "Study Rooms", href: "/study-rooms" },
    { icon: Star, label: "Course Reviews", href: "/reviews" },
    { icon: Wallet, label: "Budget", href: "/budget" },
];
*/

const systemItems = [
    { icon: Bell, label: "Notification Service", href: "/notifications" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
    mobileMenuOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ mobileMenuOpen, onClose }: SidebarProps) {
    const { pathname } = useLocation();
    const { user, logout } = useAuth();
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!user) return;
        const checkNotifications = async () => {
            try {
                const now = new Date();
                const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const res = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                    [
                        Query.equal("userId", user.$id),
                        Query.notEqual("status", "done"),
                        Query.limit(10)
                    ]
                );
                
                const hasAlert = res.documents.some(t => {
                    if (!t.dueDate) return false;
                    const d = new Date(t.dueDate);
                    return d <= in24h;
                });
                setHasUnread(hasAlert);
            } catch (e) {
                console.error(e);
            }
        };
        checkNotifications();
    }, [user]);

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col w-64 h-screen border-r bg-card transition-transform duration-300 ease-in-out md:translate-x-0",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="p-6 border-b flex items-center justify-between">
                <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                    <GraduationCap className="h-6 w-6" />
                    StudentApp
                </h1>
                <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground" aria-label="Close menu" title="Close menu">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {mainItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
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

                <div className="pt-4 pb-1">
                    <p className="px-3 text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-2">To Do List</p>
                </div>
                {todoItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
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

                <div className="pt-4 pb-1">
                    <p className="px-3 text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-2">CGPA Calculator Service</p>
                </div>
                {cgpaItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
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

                {/* Study Tools Section (Hidden per request)
                <div className="pt-4 pb-1">
                    <p className="px-3 text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-2">Study Tools</p>
                </div>
                {studyItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
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
                */}

                <div className="pt-4 pb-1">
                    <p className="px-3 text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-2">System</p>
                </div>
                {systemItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                            pathname === item.href
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        {item.label === "Notification Service" && hasUnread && (
                            <span className="absolute right-3 w-2 h-2 rounded-full bg-red-500 shadow-sm animate-pulse"></span>
                        )}
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

