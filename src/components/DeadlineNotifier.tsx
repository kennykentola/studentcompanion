import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { Query } from "appwrite";

/**
 * DeadlineNotifier — silent background component mounted in Layout.
 * Requests browser notification permission and fires notifications
 * for tasks due within the next 24 hours.
 */
export function DeadlineNotifier() {
    const { user } = useAuth();
    const notifiedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!user) return;

        const checkDeadlines = async () => {
            // Request permission on first run
            if (Notification.permission === "default") {
                await Notification.requestPermission();
            }
            if (Notification.permission !== "granted") return;

            try {
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

                for (const task of res.documents) {
                    if (!task.dueDate) continue;
                    const dueDate = new Date(task.dueDate);
                    if (dueDate >= now && dueDate <= in24h && !notifiedRef.current.has(task.$id)) {
                        const hoursLeft = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
                        new Notification("⏰ Deadline Approaching", {
                            body: `"${task.title}" is due in ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}!`,
                            icon: "/favicon.ico",
                            tag: task.$id, // prevent duplicate notifications
                        });
                        notifiedRef.current.add(task.$id);
                    }
                }
            } catch (e) {
                // Fail silently — this is a background component
                console.warn("DeadlineNotifier error:", e);
            }
        };

        // Run immediately, then every 30 minutes
        checkDeadlines();
        const interval = setInterval(checkDeadlines, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user]);

    return null; // No UI
}
