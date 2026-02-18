import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
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
import { Card, CardContent } from "@/components/ui/card";
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
    const navigate = useNavigate();
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

            // Fetch again or append to local state (appending is faster but we need to match type)
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
            // Extract hour from stored datetime (UTC/Local conversion might be needed in real app, keeping simple for now)
            const sTime = localDateFromISO(s.startTime); // Use helper to handle potential offsets if needed
            const sHour = sTime.getHours();
            // compare with t (e.g. "08:00" -> 8)
            const tHour = parseInt(t.split(':')[0]);

            return s.dayOfWeek === d && sHour === tHour;
        });
    }

    // Helper to just parse the ISO string directly to Date object
    const localDateFromISO = (iso: string) => new Date(iso);


    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6 pb-20 relative h-[calc(100vh-100px)] flex flex-col">
            <div className="flex-none">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-all mb-4 group"
                >
                    <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                    Back to Intelligence Hub
                </button>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Temporal Grid</h1>
                        <p className="text-slate-500 font-medium italic">Synchronize your academic vectors.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200">
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
            </div>

            <Card className="flex-1 min-h-0 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <CardContent className="flex-1 overflow-auto p-0 scrollbar-hide">
                    <div className="min-w-[1000px] h-full flex flex-col">
                        <div className="grid grid-cols-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                            <div className="p-6 font-black text-xs text-slate-400 uppercase tracking-widest text-center border-r border-slate-100">Time</div>
                            {DAYS.map(day => (
                                <div key={day} className="p-6 font-black text-xs text-slate-900 uppercase tracking-widest text-center border-r border-slate-100 last:border-r-0">{day}</div>
                            ))}
                        </div>

                        <div className="flex-1 bg-white">
                            {TIMES.map(time => (
                                <div key={time} className="grid grid-cols-6 border-b border-slate-50 last:border-b-0 group/row hover:bg-slate-50/30 transition-colors">
                                    <div className="p-6 text-xs font-bold text-slate-400 border-r border-slate-50 text-center flex items-center justify-center">
                                        {time}
                                    </div>
                                    {DAYS.map(day => {
                                        const schedule = getScheduleForSlot(day, time);
                                        return (
                                            <div key={`${day}-${time}`} className="p-2 border-r border-slate-50 min-h-[120px] relative hover:bg-indigo-50/10 transition-colors">
                                                {schedule && (
                                                    <div className="bg-indigo-600 text-white p-4 rounded-2xl h-full flex flex-col justify-between shadow-lg shadow-indigo-200 group/item hover:scale-[1.02] transition-transform animate-in zoom-in-95 duration-200">
                                                        <div>
                                                            <div className="font-black text-xs uppercase tracking-tight mb-1">{schedule.title}</div>
                                                            {schedule.location && (
                                                                <div className="flex items-center gap-1.5 opacity-80 mb-2">
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span className="text-[10px] font-bold uppercase">{schedule.location}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-lg w-fit">
                                                                <Clock className="h-3 w-3" />
                                                                <span className="text-[9px] font-bold">
                                                                    {format(new Date(schedule.startTime), "HH:mm")} - {format(new Date(schedule.endTime), "HH:mm")}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteSchedule(schedule.$id)}
                                                            className="self-end opacity-0 group-hover/item:opacity-100 transition-opacity text-white/50 hover:text-rose-300 transform hover:scale-110 active:scale-95"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
