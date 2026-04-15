import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, storage, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Plus, Loader2, Trash2, FileText, Link as LinkIcon, BookMarked, Upload, ExternalLink, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Resource {
    $id: string;
    userId: string;
    title: string;
    type: "notes" | "past_paper" | "link";
    courseTag: string;
    fileId: string;
    url: string;
    description: string;
}

const TYPE_OPTIONS = [
    { value: "notes", label: "📄 Notes", color: "bg-blue-50 text-blue-600 border-blue-100" },
    { value: "past_paper", label: "📝 Past Paper", color: "bg-purple-50 text-purple-600 border-purple-100" },
    { value: "link", label: "🔗 Link", color: "bg-amber-50 text-amber-600 border-amber-100" },
];

const getTypeStyle = (type: string) => TYPE_OPTIONS.find(t => t.value === type)?.color || "bg-slate-50 text-slate-600";
const getTypeLabel = (type: string) => TYPE_OPTIONS.find(t => t.value === type)?.label || type;

export default function Resources() {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterCourse, setFilterCourse] = useState("all");

    // Form state
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"notes" | "past_paper" | "link">("notes");
    const [courseTag, setCourseTag] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(false);

    const fetchResources = async () => {
        if (!user) return;
        try {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.RESOURCES_COLLECTION_ID,
                [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")]
            );
            setResources(res.documents as unknown as Resource[]);
        } catch (e) {
            console.error("Failed to fetch resources:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchResources(); }, [user]);

    const courses = ["all", ...Array.from(new Set(resources.map(r => r.courseTag).filter(Boolean)))];

    const filtered = resources.filter(r => {
        const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.courseTag?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchType = filterType === "all" || r.type === filterType;
        const matchCourse = filterCourse === "all" || r.courseTag === filterCourse;
        return matchSearch && matchType && matchCourse;
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title) return;
        setCreating(true);
        try {
            let fileId = "";
            if (selectedFile && type !== "link") {
                setUploadProgress(true);
                const uploaded = await storage.createFile(APPWRITE_CONFIG.BUCKET_ID, ID.unique(), selectedFile);
                fileId = uploaded.$id;
                setUploadProgress(false);
            }
            const doc = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.RESOURCES_COLLECTION_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    title,
                    type,
                    courseTag: courseTag.toUpperCase(),
                    fileId,
                    url: type === "link" ? url : "",
                    description
                }
            );
            setResources([doc as unknown as Resource, ...resources]);
            resetForm();
            setIsDialogOpen(false);
        } catch (e) {
            console.error("Failed to create resource:", e);
        } finally {
            setCreating(false);
            setUploadProgress(false);
        }
    };

    const handleDelete = async (r: Resource) => {
        try {
            if (r.fileId) await storage.deleteFile(APPWRITE_CONFIG.BUCKET_ID, r.fileId);
            await databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.RESOURCES_COLLECTION_ID, r.$id);
            setResources(resources.filter(res => res.$id !== r.$id));
        } catch (e) { console.error(e); }
    };

    const openFile = (r: Resource) => {
        if (r.type === "link" && r.url) {
            window.open(r.url, "_blank");
        } else if (r.fileId) {
            const fileUrl = storage.getFileView(APPWRITE_CONFIG.BUCKET_ID, r.fileId);
            window.open(fileUrl, "_blank");
        }
    };

    const resetForm = () => {
        setTitle(""); setType("notes"); setCourseTag("");
        setUrl(""); setDescription(""); setSelectedFile(null);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Resource Library</h1>
                    <p className="text-slate-500 mt-1">Your notes, past papers, and study links in one place.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                            <Plus className="mr-2 h-4 w-4" />Add Resource
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg rounded-2xl">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Add New Resource</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <div className="flex gap-2">
                                        {TYPE_OPTIONS.map(t => (
                                            <button
                                                key={t.value}
                                                type="button"
                                                onClick={() => setType(t.value as any)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${type === t.value ? t.color + ' border-current shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. CSC301 Lecture Notes Week 4" required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Course Tag</Label>
                                        <Input value={courseTag} onChange={e => setCourseTag(e.target.value)} placeholder="e.g. CSC301" />
                                    </div>
                                </div>
                                {type === "link" ? (
                                    <div className="space-y-2">
                                        <Label>URL</Label>
                                        <Input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." required />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>File (PDF, Image, etc.)</Label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                                        >
                                            {selectedFile ? (
                                                <p className="text-sm font-medium text-indigo-600">{selectedFile.name}</p>
                                            ) : (
                                                <>
                                                    <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                                    <p className="text-sm text-slate-400">Click to upload file</p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Description (optional)</Label>
                                    <textarea
                                        className="w-full h-20 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Brief description..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    {creating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadProgress ? "Uploading file..." : "Saving..."}</>
                                    ) : "Add Resource"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        className="pl-9"
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-40">
                        <Filter className="h-4 w-4 mr-2 text-slate-400" />
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {TYPE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                        {courses.map(c => <SelectItem key={c} value={c}>{c === "all" ? "All Courses" : c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {TYPE_OPTIONS.map(t => {
                    const count = resources.filter(r => r.type === t.value).length;
                    return (
                        <div key={t.value} className={`rounded-2xl border p-4 text-center ${t.color}`}>
                            <p className="text-2xl font-black">{count}</p>
                            <p className="text-xs font-bold mt-1">{t.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Resource Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <BookMarked className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                    <h3 className="font-black text-lg text-slate-400">
                        {resources.length === 0 ? "No resources yet" : "No results found"}
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">
                        {resources.length === 0 ? "Add your first note or past paper." : "Try a different search or filter."}
                    </p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(r => (
                        <div key={r.$id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all group cursor-pointer" onClick={() => openFile(r)}>
                            <div className="flex items-start justify-between mb-3">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wide ${getTypeStyle(r.type)}`}>
                                    {getTypeLabel(r.type)}
                                </span>
                                <button
                                    onClick={e => { e.stopPropagation(); handleDelete(r); }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-rose-500 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getTypeStyle(r.type)}`}>
                                    {r.type === "link" ? <LinkIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">{r.title}</h3>
                                    {r.courseTag && (
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wide">{r.courseTag}</span>
                                    )}
                                    {r.description && (
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] text-slate-300 font-medium">Click to open</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
