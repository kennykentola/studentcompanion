import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../types';
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const REMINDER_OPTIONS = ['15 minutes before', '1 hour before', '3 hours before', '6 hours before', '12 hours before', '1 day before', '2 days before', '1 week before'];

const Assignments: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'in-progress'>('all');
    const [expandedTask, setExpandedTask] = useState<string | null>(null);

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        course: '',
        dueDate: '',
        priority: 'medium',
        subtasks: []
    });

    const fetchTasks = async () => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                [Query.equal("userId", user.$id)]
            );

            // Map Appwrite documents to our Task interface
            const mappedTasks: Task[] = response.documents.map((doc: any) => ({
                $id: doc.$id,
                id: doc.$id,
                title: doc.title,
                course: doc.category || 'General', // Fallback
                dueDate: doc.dueDate ? doc.dueDate.split('T')[0] : '',
                status: doc.status === 'todo' ? 'pending' : doc.status,
                priority: (doc.priority?.toLowerCase() as any) || 'medium',
                description: doc.content || '',
                notes: '', // Not in DB yet
                reminders: [], // Not in DB yet
                subtasks: [] // Not in DB yet
            }));
            setTasks(mappedTasks);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [user]);

    const filteredTasks = tasks.filter(t => {
        if (activeTab === 'all') return true;
        if (activeTab === 'pending') return t.status === 'pending' || t.status === 'in-progress';
        return t.status === activeTab;
    });

    const calculateProgress = (task: Task) => {
        if (task.status === 'completed') return 100;
        if (!task.subtasks || task.subtasks.length === 0) return 0;
        const completed = task.subtasks.filter(s => s.completed).length;
        return Math.round((completed / task.subtasks.length) * 100);
    };

    const toggleTask = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newStatus = task.status === 'completed' ? 'pending' : 'completed';

        // Optimistic update
        setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));

        try {
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                id,
                { status: newStatus === 'pending' ? 'todo' : 'done' }
            );
        } catch (error) {
            console.error("Failed to update status", error);
            // Revert on error
            setTasks(tasks.map(t => t.id === id ? { ...t, status: task.status } : t));
        }
    };

    const deleteTask = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('De-initialize this task from ecosystem?')) {
            // Optimistic update
            const prevTasks = [...tasks];
            setTasks(tasks.filter(t => t.id !== id));

            try {
                await databases.deleteDocument(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                    id
                );
            } catch (error) {
                console.error("Failed to delete task", error);
                setTasks(prevTasks);
            }
        }
    };

    // Subtasks are purely local for now as per "the one you have not add it" instruction (no backend support yet)
    const toggleSubtask = (taskId: string, subId: string) => {
        setTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            const updatedSubtasks = t.subtasks?.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
            return {
                ...t,
                subtasks: updatedSubtasks,
                // Optional: Auto-complete parent task if all subtasks done
                // status: allCompleted ? 'completed' : 'pending' 
            };
        }));
    };

    const updatePriority = async (taskId: string, priority: 'low' | 'medium' | 'high') => {
        // Optimistic
        const prevTasks = [...tasks];
        setTasks(tasks.map(t => t.id === taskId ? { ...t, priority } : t));

        try {
            // Capitalize for compatibility with existing backend enum if needed ("Low", "Medium", "High")
            const backendPriority = priority.charAt(0).toUpperCase() + priority.slice(1);
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                taskId,
                { priority: backendPriority }
            );
        } catch (error) {
            console.error("Failed to update priority", error);
            setTasks(prevTasks);
        }
    };

    const updateDescription = (taskId: string, val: string) => {
        // Local only for now to avoid excessive API calls on change
        // Ideally debounced update to DB
        setTasks(tasks.map(t => t.id === taskId ? { ...t, description: val } : t));
    };

    const updateNotes = (taskId: string, val: string) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, notes: val } : t));
    };

    const addReminder = (taskId: string, reminder: string) => {
        if (!reminder) return;
        setTasks(tasks.map(t => {
            if (t.id === taskId) {
                if (t.reminders?.includes(reminder)) return t;
                return { ...t, reminders: [...(t.reminders || []), reminder] };
            }
            return t;
        }));
    };

    const removeReminder = (taskId: string, reminder: string) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, reminders: t.reminders?.filter(r => r !== reminder) } : t));
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title || !newTask.course || !user) return;

        try {
            const createdDoc = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                ID.unique(),
                {
                    title: newTask.title,
                    status: 'todo',
                    userId: user.$id,
                    dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
                    priority: newTask.priority ? newTask.priority.charAt(0).toUpperCase() + newTask.priority.slice(1) : 'Medium',
                    category: newTask.course, // Mapping Course to Category
                    content: ''
                    // Note: Subtasks/Reminders not saved to DB yet
                }
            );

            const taskToAdd: Task = {
                $id: createdDoc.$id,
                id: createdDoc.$id,
                title: createdDoc.title,
                course: createdDoc.category,
                dueDate: createdDoc.dueDate ? createdDoc.dueDate.split('T')[0] : '',
                status: 'pending',
                priority: (newTask.priority as any) || 'medium',
                subtasks: newTask.subtasks || [],
                description: '',
                notes: '',
                reminders: []
            };

            setTasks([taskToAdd, ...tasks]);
            setShowCreateModal(false);
            setNewTask({ title: '', course: '', dueDate: '', priority: 'medium', subtasks: [] });
        } catch (error) {
            console.error("Failed to create task", error);
        }
    };

    const getCalendarLink = (task: Task) => {
        const text = encodeURIComponent(`Deadline: ${task.title} (${task.course})`);
        // Handle potentially undefined fields
        const desc = task.description || '';
        const notes = task.notes || '';
        const details = encodeURIComponent(`${desc}\n\nNotes: ${notes}\n\nPriority: ${task.priority}.`);

        let date = "";
        if (task.dueDate) {
            date = task.dueDate.replace(/-/g, '');
        } else {
            // Default to tomorrow if no date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            date = tomorrow.toISOString().split('T')[0].replace(/-/g, '');
        }

        const gDate = `${date}T235959Z`;
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&dates=${gDate}/${gDate}`;
    };

    return (
        <div className="space-y-6 pb-20 relative">
            {/* Decorative Arrow in Background */}
            <div className="fixed top-1/2 right-10 opacity-[0.03] pointer-events-none transform -translate-y-1/2 rotate-12">
                <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
            </div>

            <button
                onClick={() => navigate('/')}
                className="flex items-center text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-all mb-4 group"
            >
                <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                Back to Intelligence Hub
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Academic Tracker</h1>
                    <p className="text-slate-500 font-medium italic">Master your workload. One milestone at a time.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 group flex items-center"
                >
                    <svg className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                    </svg>
                    Initialize Task
                </button>
            </div>

            {/* Initialize Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-slate-100 animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Provision New Task</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Identity Descriptor</label>
                                <input
                                    required
                                    type="text"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                    placeholder="e.g. Quantum Physics Analysis"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Course Node</label>
                                    <input
                                        required
                                        type="text"
                                        value={newTask.course}
                                        onChange={e => setNewTask({ ...newTask, course: e.target.value.toUpperCase() })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                        placeholder="CSC301"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Temporal Limit</label>
                                    <input
                                        required
                                        type="date"
                                        value={newTask.dueDate}
                                        onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Criticality Level</label>
                                <div className="flex p-1 bg-slate-100 rounded-2xl">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setNewTask({ ...newTask, priority: p as any })}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newTask.priority === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex space-x-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                                >
                                    Commit Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative z-10">
                <div className="p-4 border-b border-slate-100 flex space-x-2 bg-slate-50/50">
                    {['all', 'pending', 'completed'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-lg ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredTasks.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">No Active Protocols</h3>
                            <p className="text-sm text-slate-400 mt-2 font-medium">Your tracker is empty for this segment.</p>
                        </div>
                    )}

                    {filteredTasks.map(task => {
                        const progress = calculateProgress(task);
                        const isExpanded = expandedTask === task.id;
                        const completedCount = task.subtasks?.filter(s => s.completed).length || 0;
                        const totalCount = task.subtasks?.length || 0;

                        return (
                            <div key={task.id} className="flex flex-col group transition-all">
                                <div
                                    className={`p-8 hover:bg-slate-50/50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/30' : ''}`}
                                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-6">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                                className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-100' : 'border-slate-300 group-hover:border-indigo-400 bg-white'
                                                    }`}
                                            >
                                                {task.status === 'completed' && (
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                            <div>
                                                <h3 className={`font-black text-xl tracking-tight transition-all ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                    {task.title}
                                                </h3>
                                                <div className="flex items-center mt-2 space-x-4">
                                                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-indigo-100/50">{task.course}</span>
                                                    <div className="flex items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                        <svg className="w-4 h-4 mr-1.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {task.dueDate}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={(e) => deleteTask(task.id, e)}
                                                className="p-3 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" /></svg>
                                            </button>
                                            <div className="hidden md:flex flex-col items-end">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${task.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100' :
                                                    task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100'
                                                    }`}>
                                                    {task.priority || 'MEDIUM'}
                                                </span>
                                            </div>
                                            <div className={`p-3 rounded-2xl transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                                                <svg className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-14">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Velocity</span>
                                                <span className="text-[10px] font-black text-indigo-400 uppercase">({completedCount}/{totalCount} Milestones)</span>
                                            </div>
                                            <span className="text-sm font-black text-indigo-600 tracking-tighter">{progress}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                                            <div
                                                className={`h-full transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) rounded-full ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-indigo-500 to-indigo-700'
                                                    }`}
                                                style={{ width: `${progress}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></div>
                                            </div>
                                            {/* Subtask Markers in Progress Bar */}
                                            {totalCount > 1 && Array.from({ length: totalCount - 1 }).map((_, i) => (
                                                <div key={i} className="absolute top-0 w-0.5 h-full bg-black/5" style={{ left: `${((i + 1) / totalCount) * 100}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1500px] border-t border-slate-100 bg-white' : 'max-h-0'}`}>
                                    <div className="p-10 ml-14 space-y-10">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            <div className="space-y-8">
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Detailed Objective</h4>
                                                    <div className="relative group">
                                                        <textarea
                                                            value={task.description || ""}
                                                            onChange={(e) => updateDescription(task.id, e.target.value)}
                                                            placeholder="Describe the core mission and scope of this assignment..."
                                                            className="w-full h-40 bg-indigo-50/20 border border-indigo-100 rounded-[1.5rem] p-6 text-sm text-slate-800 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all resize-none shadow-inner font-medium leading-relaxed"
                                                        />
                                                        <div className="absolute bottom-4 right-6 text-[9px] font-black text-indigo-300 uppercase tracking-widest pointer-events-none transition-colors group-focus-within:text-indigo-500">Assignment Scope</div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Strategic Notes</h4>
                                                    <div className="relative group">
                                                        <textarea
                                                            value={task.notes || ""}
                                                            onChange={(e) => updateNotes(task.id, e.target.value)}
                                                            placeholder="Capture quick thoughts, research links, or stumbling blocks..."
                                                            className="w-full h-40 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm text-slate-700 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all resize-none shadow-inner font-medium leading-relaxed"
                                                        />
                                                        <div className="absolute bottom-4 right-6 text-[9px] font-black text-slate-300 uppercase tracking-widest pointer-events-none transition-colors group-focus-within:text-indigo-500">Refinement Layer</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Strategic Priority</h4>
                                                        </div>
                                                        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
                                                            {(['low', 'medium', 'high'] as const).map((p) => (
                                                                <button
                                                                    key={p}
                                                                    onClick={() => updatePriority(task.id, p)}
                                                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${task.priority === p
                                                                        ? p === 'high' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' :
                                                                            p === 'medium' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' :
                                                                                'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                                        : 'text-slate-400 hover:text-slate-600'
                                                                        }`}
                                                                >
                                                                    {p}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Temporal Alerts</h4>
                                                            <div className="relative group/rem">
                                                                <select
                                                                    onChange={(e) => { addReminder(task.id, e.target.value); e.target.value = ""; }}
                                                                    className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border-none focus:ring-0 outline-none cursor-pointer appearance-none pr-6"
                                                                >
                                                                    <option value="">+ Add Alert</option>
                                                                    {REMINDER_OPTIONS.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                                <svg className="w-3 h-3 text-indigo-400 absolute right-1.5 top-1.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {task.reminders?.map(rem => (
                                                                <div key={rem} className="flex items-center bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-xl group/tag animate-in zoom-in-90 duration-200">
                                                                    <span className="text-[10px] font-black uppercase tracking-tight mr-2">{rem}</span>
                                                                    <button onClick={() => removeReminder(task.id, rem)} className="text-indigo-300 hover:text-rose-500 transition-colors">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {(!task.reminders || task.reminders.length === 0) && <p className="text-[10px] text-slate-400 italic font-medium px-1">No alerts scheduled.</p>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tactical Milestones</h4>
                                                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{completedCount} / {totalCount} Done</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {task.subtasks?.length === 0 && <p className="text-xs text-muted-foreground italic">No milestones defined.</p>}
                                                        {task.subtasks?.map(sub => (
                                                            <div
                                                                key={sub.id}
                                                                onClick={() => toggleSubtask(task.id, sub.id)}
                                                                className={`flex items-center p-4 rounded-[1.25rem] border transition-all cursor-pointer group/sub ${sub.completed ? 'bg-emerald-50/50 border-emerald-100 shadow-sm shadow-emerald-50' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'
                                                                    }`}
                                                            >
                                                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all mr-4 shrink-0 ${sub.completed ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-100' : 'bg-white border-slate-200 group-hover/sub:border-indigo-400'
                                                                    }`}>
                                                                    {sub.completed && (
                                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <span className={`text-sm font-bold transition-all ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                                    {sub.title}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-600/40 transition-all duration-700"></div>
                                                    <div className="flex items-center space-x-5 mb-8 relative z-10">
                                                        <div className="w-14 h-14 bg-white rounded-[1.25rem] flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
                                                            <img src="https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png" className="w-8 h-8" alt="GCal" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-black uppercase tracking-tight">Ecosystem Sync</h5>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Export to Google Calendar</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => window.open(getCalendarLink(task), '_blank')}
                                                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/40 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 relative z-10"
                                                    >
                                                        Synchronize Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Assignments;
