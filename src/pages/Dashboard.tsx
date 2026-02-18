import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, GraduationCap, AlertCircle, Loader2 } from "lucide-react";
import { Query } from "appwrite";
import { calculateCGPA } from "@/lib/utils";
import { format } from "date-fns";
import { WeatherWidget } from "@/components/WeatherWidget";

export default function Dashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingTasks: 0,
        dueSoon: 0,
        cgpa: 0,
        gradesCount: 0,
        assignments: 0
    });
    const [recentTasks, setRecentTasks] = useState<any[]>([]);
    const [todaySchedule, setTodaySchedule] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // 1. Fetch Tasks
                const tasksResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                    [Query.equal("userId", user.$id)]
                );

                const tasks = tasksResponse.documents;
                const pending = tasks.filter((t: any) => t.status === "todo" || t.status === "in-progress");
                const dueSoon = tasks.filter((t: any) => {
                    if (!t.dueDate || t.status === "done") return false;
                    const due = new Date(t.dueDate);
                    const now = new Date();
                    const diffTime = due.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 2;
                });
                const assignments = tasks.filter((t: any) => t.category?.toLowerCase().includes("assignment") && t.status !== "done");

                // 2. Fetch Grades
                const gradesResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.GRADES_COLLECTION_ID,
                    [Query.equal("userId", user.$id)]
                );

                const scale = (localStorage.getItem("gradingScale") as '5.0' | '4.0') || '5.0';
                const cgpa = calculateCGPA(gradesResponse.documents, scale);

                // 3. Fetch Schedule for Today
                // Note: Appwrite doesn't support complex substring matching easily on all fields, 
                // but we filter by dayOfWeek. 
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const dayName = days[new Date().getDay()];

                const scheduleResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.SCHEDULES_COLLECTION_ID,
                    [
                        Query.equal("userId", user.$id),
                        Query.equal("dayOfWeek", dayName)
                    ]
                );

                setStats({
                    pendingTasks: pending.length,
                    dueSoon: dueSoon.length,
                    cgpa,
                    gradesCount: gradesResponse.total,
                    assignments: assignments.length
                });

                setRecentTasks(tasks.slice(0, 3)); // Just show last 3 tasks for now
                setTodaySchedule(scheduleResponse.documents);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    const statCards = [
        {
            title: "Pending Tasks",
            value: stats.pendingTasks,
            description: `${stats.dueSoon} due soon`,
            icon: CheckSquare,
            color: "text-blue-500",
        },
        {
            title: "Current CGPA",
            value: stats.cgpa.toFixed(2),
            description: `Based on ${stats.gradesCount} courses`,
            icon: GraduationCap,
            color: "text-green-500",
        },
        {
            title: "Assignments",
            value: stats.assignments,
            description: "Pending assignments",
            icon: AlertCircle,
            color: "text-red-500",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {user?.name || "Student"}. Here's your academic overview.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <WeatherWidget />
                {statCards.map((item, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {item.title}
                            </CardTitle>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold truncate">{item.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {item.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentTasks.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No tasks found.</p>
                            ) : (
                                recentTasks.map((task) => (
                                    <div key={task.$id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{task.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"} • <span className="capitalize">{task.status}</span>
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs bg-muted px-2 py-1 rounded">
                                            {task.priority || "Normal"}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Today's Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {todaySchedule.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No classes today.</p>
                            ) : (
                                todaySchedule.map((cls) => (
                                    <div key={cls.$id} className="flex items-center">
                                        <div className="w-2 h-2 bg-primary rounded-full mr-4"></div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{cls.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(cls.startTime), "h:mm a")} - {format(new Date(cls.endTime), "h:mm a")}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{cls.location}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
