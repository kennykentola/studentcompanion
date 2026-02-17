import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, storage, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Plus, Trash2, Loader2, Calendar, Clock, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface Task {
    $id: string;
    title: string;
    status: "todo" | "in-progress" | "done";
    dueDate?: string;
    content?: string;
    priority?: "Low" | "Medium" | "High";
    category?: string;
    estimatedTime?: string;
    attachments?: string[];
}

export default function Tasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
    const [category, setCategory] = useState("Study");
    const [estimatedTime, setEstimatedTime] = useState("");
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchTasks = async () => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                [Query.equal("userId", user.$id)]
            );
            setTasks(response.documents as unknown as Task[]);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [user]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !user) return;

        setCreating(true);
        try {
            let attachmentIds: string[] = [];
            // Upload attachments
            if (attachments.length > 0) {
                const uploadPromises = attachments.map(async (file) => {
                    const response = await storage.createFile(
                        APPWRITE_CONFIG.BUCKET_ID,
                        ID.unique(),
                        file
                    );
                    return response.$id;
                });
                attachmentIds = await Promise.all(uploadPromises);
            }

            const newTask = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                ID.unique(),
                {
                    title,
                    content,
                    status: "todo",
                    userId: user.$id,
                    dueDate: new Date(dueDate).toISOString(),
                    priority,
                    category,
                    estimatedTime,
                    attachments: attachmentIds
                }
            );
            setTasks([...tasks, newTask as unknown as Task]);
            resetForm();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to create task:", error);
        } finally {
            setCreating(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setContent("");
        setPriority("Medium");
        setCategory("Study");
        setEstimatedTime("");
        setDueDate(new Date().toISOString().split('T')[0]);
        setAttachments([]);
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                taskId
            );
            setTasks(tasks.filter(t => t.$id !== taskId));
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    }

    const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
        const updatedTasks = tasks.map(t =>
            t.$id === taskId ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);

        try {
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                taskId,
                { status: newStatus }
            );
        } catch (error) {
            console.error("Failed to update status:", error);
            fetchTasks();
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }

    const getTasksByStatus = (status: string) => {
        return tasks.filter((task) => task.status === status);
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case "High": return "bg-red-100 text-red-800 border-red-200";
            case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "Low": return "bg-green-100 text-green-800 border-green-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleCreateTask}>
                            <DialogHeader>
                                <DialogTitle>Add New Task</DialogTitle>
                                <DialogDescription>
                                    Create a detailed task to track your progress.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Complete Calculus Assignment" required />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="content">Description</Label>
                                    <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} placeholder="Add details..." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Input id="category" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Exam Prep" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Low">Low (Green)</SelectItem>
                                                <SelectItem value="Medium">Medium (Yellow)</SelectItem>
                                                <SelectItem value="High">High (Red)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="dueDate">Due Date</Label>
                                        <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="estimatedTime">Est. Time</Label>
                                        <Input id="estimatedTime" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder="e.g. 2 hours" />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Attachments</Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {attachments.map((file, i) => (
                                            <div key={i} className="relative bg-muted p-2 rounded-md flex items-center gap-2 text-xs border">
                                                <span className="max-w-[100px] truncate">{file.name}</span>
                                                <button type="button" onClick={() => removeAttachment(i)} className="hover:text-destructive">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        <Paperclip className="mr-2 h-4 w-4" /> Attach Files
                                    </Button>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Task
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(["todo", "in-progress", "done"] as const).map((status) => (
                    <div key={status} className="bg-muted/50 p-4 rounded-lg min-h-[500px]">
                        <h2 className="font-semibold mb-4 text-muted-foreground flex items-center justify-between capitalize">
                            {status.replace("-", " ")}
                            <Badge variant="secondary">{getTasksByStatus(status).length}</Badge>
                        </h2>
                        <div className="space-y-3">
                            {getTasksByStatus(status).map((task) => (
                                <Card key={task.$id} className="relative group">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium leading-none">{task.title}</h3>
                                            <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-[10px] px-1 py-0`}>
                                                {task.priority || "Medium"}
                                            </Badge>
                                        </div>

                                        {task.content && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{task.content}</p>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                            {task.dueDate && (
                                                <div className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{format(new Date(task.dueDate), "MMM d")}</span>
                                                </div>
                                            )}
                                            {task.estimatedTime && (
                                                <div className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{task.estimatedTime}</span>
                                                </div>
                                            )}
                                            {task.attachments && task.attachments.length > 0 && (
                                                <div className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded text-blue-500">
                                                    <Paperclip className="h-3 w-3" />
                                                    <span>{task.attachments.length}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2 flex items-center justify-between border-t mt-2">
                                            <Badge variant="outline" className="text-[10px] font-normal opacity-70">
                                                {task.category || "General"}
                                            </Badge>

                                            <div className="flex gap-1">
                                                {/* Status Movers */}
                                                {status !== 'todo' && <div onClick={() => handleStatusChange(task.$id, "todo")} className="w-3 h-3 rounded-full bg-red-400 cursor-pointer hover:scale-110" title="Todo" />}
                                                {status !== 'in-progress' && <div onClick={() => handleStatusChange(task.$id, "in-progress")} className="w-3 h-3 rounded-full bg-blue-400 cursor-pointer hover:scale-110" title="In Progress" />}
                                                {status !== 'done' && <div onClick={() => handleStatusChange(task.$id, "done")} className="w-3 h-3 rounded-full bg-green-400 cursor-pointer hover:scale-110" title="Done" />}
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteTask(task.$id)}
                                        >
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {getTasksByStatus(status).length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm italic border-2 border-dashed rounded-lg">
                                    No tasks
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
