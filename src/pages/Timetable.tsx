import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite"; // Using generic ID.unique()
import { ID, Query } from "appwrite";
import { Plus, Trash2, Loader2, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Schedule {
    $id: string;
    title: string;
    dayOfWeek: string;
    startTime: string; // ISO datetime
    endTime: string;   // ISO datetime
    location?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export default function Timetable() {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [day, setDay] = useState("Monday");
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("09:00");
    const [location, setLocation] = useState("");

    const fetchSchedules = async () => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.SCHEDULES_COLLECTION_ID,
                [Query.equal("userId", user.$id)]
            );
            setSchedules(response.documents as unknown as Schedule[]);
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [user]);

    const handleAddSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !user) return;

        setCreating(true);
        try {
            // Construct dummy dates for time storage
            // We only care about the time part for display, but DB expects datetime
            const today = new Date().toISOString().split('T')[0];
            const startDt = new Date(`${today}T${startTime}:00`);
            const endDt = new Date(`${today}T${endTime}:00`);

            const newSchedule = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.SCHEDULES_COLLECTION_ID,
                ID.unique(),
                {
                    title,
                    dayOfWeek: day,
                    startTime: startDt.toISOString(),
                    endTime: endDt.toISOString(),
                    location,
                    userId: user.$id
                }
            );

            setSchedules([...schedules, newSchedule as unknown as Schedule]);
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Failed to create schedule:", error);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.SCHEDULES_COLLECTION_ID,
                id
            );
            setSchedules(schedules.filter(s => s.$id !== id));
        } catch (error) {
            console.error("Failed to delete schedule:", error);
        }
    }

    const resetForm = () => {
        setTitle("");
        setDay("Monday");
        setStartTime("08:00");
        setEndTime("09:00");
        setLocation("");
    }

    // Helper to find schedule for a specific slot
    const getScheduleForSlot = (d: string, t: string) => {
        return schedules.find(s => {
            // Extract hour from stored datetime
            const sTime = new Date(s.startTime);
            const sHour = sTime.getHours();
            // compare with t (e.g. "08:00" -> 8)
            const tHour = parseInt(t.split(':')[0]);

            return s.dayOfWeek === d && sHour === tHour;
        });
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleAddSchedule}>
                            <DialogHeader>
                                <DialogTitle>Add to Schedule</DialogTitle>
                                <DialogDescription>
                                    Add a recurring class or event.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Event Title</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chemistry Lab" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Day</Label>
                                        <Select value={day} onValueChange={setDay}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Location</Label>
                                        <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Room 101" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Start Time</Label>
                                        <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>End Time</Label>
                                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Event
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="overflow-x-auto">
                <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent className="min-w-[800px]">
                    <div className="grid grid-cols-6 border-t border-l">
                        {/* Header */}
                        <div className="p-4 font-medium text-muted-foreground border-r border-b bg-muted/20">Time</div>
                        {DAYS.map(day => (
                            <div key={day} className="p-4 font-medium text-center border-r border-b bg-muted/20">{day}</div>
                        ))}

                        {/* Grid */}
                        {TIMES.map(time => (
                            <div key={time} className="contents">
                                <div className="p-4 text-sm text-muted-foreground border-r border-b">{time}</div>
                                {DAYS.map(day => {
                                    const schedule = getScheduleForSlot(day, time);
                                    return (
                                        <div key={`${day}-${time}`} className="p-2 border-r border-b min-h-[100px] relative group">
                                            {schedule && (
                                                <div className="bg-primary/10 text-primary p-2 rounded text-xs font-medium h-full flex flex-col justify-between border-l-2 border-primary">
                                                    <div>
                                                        <div className="font-bold">{schedule.title}</div>
                                                        {schedule.location && (
                                                            <div className="flex items-center gap-1 mt-1 opacity-80">
                                                                <MapPin className="h-3 w-3" />
                                                                <span>{schedule.location}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 mt-1 opacity-80">
                                                            <Clock className="h-3 w-3" />
                                                            <span>
                                                                {format(new Date(schedule.startTime), "HH:mm")} - {format(new Date(schedule.endTime), "HH:mm")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSchedule(schedule.$id)}
                                                        className="self-end opacity-0 group-hover:opacity-100 transition-opacity text-destructive p-1 hover:bg-destructive/10 rounded"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
