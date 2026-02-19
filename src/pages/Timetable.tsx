import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Plus, Trash2, Loader2, MapPin, Clock, ChevronLeft } from "lucide-react";
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
import { format } from "date-fns";

interface Schedule {
    $id: string;
    title: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
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

    const getScheduleForSlot = (d: string, t: string) => {
        return schedules.find(s => {
            const sTime = localDateFromISO(s.startTime);
            const sHour = sTime.getHours();
            const tHour = parseInt(t.split(':')[0]);
            return s.dayOfWeek === d && sHour === tHour;
        });
    }

    const localDateFromISO = (iso: string) => new Date(iso);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="group flex items-center text-slate-500 hover:text-indigo-600 font-medium text-sm mb-4 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Back to Hub
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Weekly Timetable</h1>
                        <p className="text-slate-500 mt-2 text-lg">Manage your classes and academic schedule.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 text-white rounded-xl px-6 py-6 text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
                                <Plus className="mr-2 h-5 w-5" /> Add Class
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-2xl">
                            <form onSubmit={handleAddSchedule}>
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-slate-900">Add New Class</DialogTitle>
                                    <DialogDescription>
                                        Add a recurring class or event to your schedule.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-6">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event Title</Label>
                                        <Input
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="e.g. Advanced Calculus"
                                            required
                                            className="rounded-xl border-slate-200 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Day</Label>
                                            <Select value={day} onValueChange={setDay}>
                                                <SelectTrigger className="rounded-xl border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</Label>
                                            <Input
                                                value={location}
                                                onChange={e => setLocation(e.target.value)}
                                                placeholder="Room 304"
                                                className="rounded-xl border-slate-200 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Time</Label>
                                            <Input
                                                type="time"
                                                value={startTime}
                                                onChange={e => setStartTime(e.target.value)}
                                                required
                                                className="rounded-xl border-slate-200 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Time</Label>
                                            <Input
                                                type="time"
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                required
                                                className="rounded-xl border-slate-200 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={creating} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-6 text-base shadow-lg shadow-indigo-200">
                                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Add to Schedule
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Timetable Grid */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-[1000px]">
                            {/* Header Row */}
                            <div className="grid grid-cols-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100">
                                    Time
                                </div>
                                {DAYS.map(day => (
                                    <div key={day} className="p-6 text-center text-sm font-bold text-slate-700 uppercase tracking-tight border-r border-slate-100 last:border-r-0">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Time Slots */}
                            <div className="bg-white">
                                {TIMES.map(time => (
                                    <div key={time} className="grid grid-cols-6 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors group">
                                        <div className="p-6 text-xs font-medium text-slate-400 border-r border-slate-50 text-center flex items-center justify-center">
                                            {time}
                                        </div>
                                        {DAYS.map(day => {
                                            const schedule = getScheduleForSlot(day, time);
                                            return (
                                                <div key={`${day}-${time}`} className="p-2 border-r border-slate-50 min-h-[140px] relative transition-colors hover:bg-indigo-50/5">
                                                    {schedule && (
                                                        <div className="group/card relative h-full bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-indigo-100 hover:border-indigo-100 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500" />

                                                            <div className="space-y-2">
                                                                <h3 className="font-bold text-slate-900 text-sm leading-tight pr-6">{schedule.title}</h3>

                                                                {schedule.location && (
                                                                    <div className="flex items-center gap-1.5 text-slate-500">
                                                                        <MapPin className="h-3 w-3 text-indigo-500" />
                                                                        <span className="text-xs font-medium">{schedule.location}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                                    <span className="text-[10px] font-bold text-slate-500">
                                                                        {format(new Date(schedule.startTime), "HH:mm")} - {format(new Date(schedule.endTime), "HH:mm")}
                                                                    </span>
                                                                </div>

                                                                <button
                                                                    onClick={() => handleDeleteSchedule(schedule.$id)}
                                                                    className="opacity-0 group-hover/card:opacity-100 transition-all text-slate-300 hover:text-red-500 transform hover:scale-110 active:scale-95"
                                                                    title="Remove Class"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
