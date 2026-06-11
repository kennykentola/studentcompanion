import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Clock, Calendar, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Reminders() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchTasks = async () => {
            try {
                const res = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                    [
                        Query.equal("userId", user.$id),
                        Query.notEqual("status", "done"),
                        Query.limit(100)
                    ]
                );
                
                const tasksWithDates = res.documents.filter(t => t.dueDate);
                tasksWithDates.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                setTasks(tasksWithDates);
            } catch (error) {
                console.error("Failed to fetch reminders:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [user]);

    const now = new Date();
    now.setHours(0,0,0,0);
    
    const overdue = tasks.filter(t => new Date(t.dueDate) < now);
    const today = tasks.filter(t => {
        const d = new Date(t.dueDate);
        return d.toDateString() === now.toDateString();
    });
    const upcoming = tasks.filter(t => {
        const d = new Date(t.dueDate);
        return d > now && d.toDateString() !== now.toDateString();
    });

    const renderTaskGroup = (title: string, group: any[], icon: any, colorClass: string) => {
        if (group.length === 0) return null;
        const Icon = icon;
        return (
            <div className="mb-8">
                <h3 className={`flex items-center text-sm font-black uppercase tracking-widest mb-4 ${colorClass}`}>
                    <Icon className="w-4 h-4 mr-2" />
                    {title} ({group.length})
                </h3>
                <div className="space-y-3">
                    {group.map(task => (
                        <div key={task.$id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-4">
                                <div className={`w-2 h-2 rounded-full ${colorClass.split(' ')[0].replace('text-', 'bg-')}`}></div>
                                <div>
                                    <p className="font-bold text-slate-900">{task.title}</p>
                                    <div className="flex items-center text-xs text-slate-500 font-medium mt-1">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider mr-2">{task.category || 'General'}</span>
                                        {new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                            <Link to="/tasks">
                                <Button variant="outline" size="sm" className="text-xs font-bold uppercase tracking-wider">
                                    View Task
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Reminder Service</h1>
                    <p className="text-slate-500 font-medium italic">Synced with your active tasks and assignments.</p>
                </div>
                <Link to="/tasks">
                    <Button className="font-bold uppercase tracking-widest">
                        <Plus className="w-4 h-4 mr-2" />
                        New Reminder
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="mt-8">
                    {tasks.length === 0 ? (
                        <div className="text-center p-16 bg-slate-50 rounded-3xl border border-slate-100">
                            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-2">No active reminders</h3>
                            <p className="text-sm text-slate-500">All caught up! Any tasks you add with a due date will appear here automatically.</p>
                        </div>
                    ) : (
                        <>
                            {renderTaskGroup("Overdue", overdue, AlertCircle, "text-red-500")}
                            {renderTaskGroup("Due Today", today, Clock, "text-amber-500")}
                            {renderTaskGroup("Upcoming", upcoming, Calendar, "text-indigo-600")}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
