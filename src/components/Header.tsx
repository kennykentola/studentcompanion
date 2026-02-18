import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell, Search, Menu, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { databases, client, APPWRITE_CONFIG } from "@/lib/appwrite";
import { Query } from "appwrite";
import { format } from "date-fns";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.NOTIFICATIONS_COLLECTION_ID,
                [
                    Query.equal("userId", user.$id),
                    Query.orderDesc("$createdAt"),
                    Query.limit(10)
                ]
            );
            setNotifications(response.documents);
            setUnreadCount(response.documents.filter((n: any) => !n.isRead).length);
        } catch (error) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time notifications
        const unsubscribe = client.subscribe(
            `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.NOTIFICATIONS_COLLECTION_ID}.documents`,
            (response: any) => {
                if (response.events.includes("databases.*.collections.*.documents.*.create")) {
                    const newNotif = response.payload;
                    if (newNotif.userId === user?.$id) {
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    }
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.NOTIFICATIONS_COLLECTION_ID,
                id,
                { isRead: true }
            );
            setNotifications(notifications.map(n => n.$id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark read");
        }
    }

    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10 md:pl-72">
            <div className="md:hidden">
                <Button variant="ghost" size="icon" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex-1 max-w-md hidden md:block">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="pl-8 bg-muted/50 border-none focus-visible:ring-1"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4 border-b">
                            <h4 className="font-semibold leading-none">Notifications</h4>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No notifications
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div key={notif.$id} className={`p-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}>
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="space-y-1">
                                                <p className="text-sm">{notif.message}</p>
                                                <p className="text-[10px] text-muted-foreground">{format(new Date(notif.$createdAt), 'PP p')}</p>
                                            </div>
                                            {!notif.isRead && (
                                                <button onClick={() => markAsRead(notif.$id)} className="text-primary hover:bg-primary/10 rounded p-1" title="Mark as read">
                                                    <Check className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                        {user?.name?.charAt(0) || "U"}
                    </div>
                    <div className="hidden md:block text-sm">
                        <p className="font-medium leading-none">{user?.name || "User"}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
