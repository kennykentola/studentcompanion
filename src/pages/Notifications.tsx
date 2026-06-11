import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Bell, Check, Trash2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const fetchNotifications = async () => {
            try {
                // Generate notifications dynamically from Tasks
                const now = new Date();
                const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                
                const res = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                    [
                        Query.equal("userId", user.$id),
                        Query.notEqual("status", "done"),
                        Query.limit(50)
                    ]
                );
                
                const generated = [];
                for (const task of res.documents) {
                    if (!task.dueDate) continue;
                    const dueDate = new Date(task.dueDate);
                    
                    if (dueDate < now) {
                        generated.push({
                            id: `overdue-${task.$id}`,
                            title: "Task Overdue!",
                            message: `"${task.title}" was due on ${dueDate.toLocaleDateString()}.`,
                            type: "error",
                            date: dueDate,
                            read: false
                        });
                    } else if (dueDate <= in24h) {
                        generated.push({
                            id: `soon-${task.$id}`,
                            title: "Deadline Approaching",
                            message: `"${task.title}" is due soon!`,
                            type: "warning",
                            date: dueDate,
                            read: false
                        });
                    }
                }
                
                // Sort newest first
                generated.sort((a, b) => b.date.getTime() - a.date.getTime());
                setNotifications(generated);
            } catch (error) {
                console.error("Failed to generate notifications:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [user]);

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Notifications</h1>
                        <p className="text-sm text-slate-500 font-medium">Your centralized system alerts.</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={markAllRead} className="font-bold uppercase text-[10px] tracking-widest">
                        <Check className="w-3 h-3 mr-1.5" /> Read All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAll} className="font-bold uppercase text-[10px] tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3 h-3 mr-1.5" /> Clear All
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-6 h-6 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">You're all caught up!</h3>
                    <p className="text-sm text-slate-500">No new notifications right now.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <div key={notif.id} className={`p-4 rounded-xl border flex items-start space-x-4 transition-colors ${notif.read ? 'bg-slate-50/50 border-slate-100 opacity-70' : 'bg-white border-indigo-100 shadow-sm'}`}>
                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notif.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500'}`}>
                                {notif.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={`text-sm font-bold ${notif.read ? 'text-slate-600' : 'text-slate-900'}`}>{notif.title}</h4>
                                    {!notif.read && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                                </div>
                                <p className="text-sm text-slate-500 mb-2">{notif.message}</p>
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">{notif.date.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
