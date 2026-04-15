import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Plus, Loader2, Star, GraduationCap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

interface CourseReview {
    $id: string;
    userId: string;
    username: string;
    courseCode: string;
    courseName: string;
    rating: number;
    review: string;
    $createdAt: string;
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <button
                    key={i}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(i)}
                    onMouseEnter={() => !readonly && setHovered(i)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                    className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                >
                    <Star
                        className={`w-6 h-6 transition-colors ${i <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function CourseReviews() {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<CourseReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("all");

    // Form
    const [courseCode, setCourseCode] = useState("");
    const [courseName, setCourseName] = useState("");
    const [rating, setRating] = useState(3);
    const [reviewText, setReviewText] = useState("");

    const fetchReviews = async () => {
        try {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COURSE_REVIEWS_COLLECTION_ID,
                [Query.orderDesc("$createdAt"), Query.limit(100)]
            );
            setReviews(res.documents as unknown as CourseReview[]);
        } catch (e) {
            console.error("Failed to fetch reviews:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    const courses = ["all", ...Array.from(new Set(reviews.map(r => r.courseCode).filter(Boolean))).sort()];

    const filtered = reviews.filter(r => {
        const matchSearch = r.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
            || r.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
            || r.review?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCourse = selectedCourse === "all" || r.courseCode === selectedCourse;
        return matchSearch && matchCourse;
    });

    // Average rating per course for filtered view
    const courseGroups = filtered.reduce((acc, r) => {
        if (!acc[r.courseCode]) acc[r.courseCode] = [];
        acc[r.courseCode].push(r);
        return acc;
    }, {} as Record<string, CourseReview[]>);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !courseCode || !rating) return;
        setCreating(true);
        try {
            const doc = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COURSE_REVIEWS_COLLECTION_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    username: user.name || "Anonymous",
                    courseCode: courseCode.toUpperCase(),
                    courseName,
                    rating,
                    review: reviewText
                }
            );
            setReviews([doc as unknown as CourseReview, ...reviews]);
            setCourseCode(""); setCourseName(""); setRating(3); setReviewText("");
            setIsDialogOpen(false);
        } catch (e) { console.error("Failed to submit review:", e); }
        finally { setCreating(false); }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        </div>
    );

    const avgRating = (list: CourseReview[]) =>
        list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : "–";

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Course Reviews</h1>
                    <p className="text-slate-500 mt-1">Honest ratings and reviews from fellow students.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                            <Plus className="mr-2 h-4 w-4" />Write Review
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg rounded-2xl">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Write a Course Review</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Course Code</Label>
                                        <Input value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="CSC301" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Course Name (optional)</Label>
                                        <Input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Data Structures" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Rating</Label>
                                    <StarRating value={rating} onChange={setRating} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Your Review</Label>
                                    <textarea
                                        className="w-full h-32 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none"
                                        value={reviewText}
                                        onChange={e => setReviewText(e.target.value)}
                                        placeholder="Share your experience — workload, lecturer quality, tips..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Review"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="pl-9" placeholder="Search by course code, name, or keyword..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            {/* Course Filter Pills */}
            {courses.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {courses.map(c => (
                        <button
                            key={c}
                            onClick={() => setSelectedCourse(c)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${selectedCourse === c ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {c === "all" ? "All Courses" : c}
                        </button>
                    ))}
                </div>
            )}

            {/* Reviews by Course */}
            {Object.keys(courseGroups).length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <GraduationCap className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                    <h3 className="font-black text-lg text-slate-400">
                        {reviews.length === 0 ? "No reviews yet" : "No results found"}
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">Be the first to review a course!</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(courseGroups).map(([code, courseReviews]) => (
                        <div key={code} className="space-y-3">
                            {/* Course Header */}
                            <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-black text-slate-900 text-lg uppercase">{code}</h2>
                                        {courseReviews[0].courseName && (
                                            <span className="text-slate-400 text-sm font-medium">— {courseReviews[0].courseName}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(Number(avgRating(courseReviews))) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                            ))}
                                        </div>
                                        <span className="text-sm font-black text-amber-500">{avgRating(courseReviews)}</span>
                                        <span className="text-xs text-slate-400">({courseReviews.length} review{courseReviews.length !== 1 ? 's' : ''})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Review Cards */}
                            <div className="grid sm:grid-cols-2 gap-3">
                                {courseReviews.map(r => (
                                    <div key={r.$id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{r.username}</p>
                                                <p className="text-xs text-slate-400">{format(new Date(r.$createdAt), "MMM d, yyyy")}</p>
                                            </div>
                                            <StarRating value={r.rating} readonly />
                                        </div>
                                        {r.review && (
                                            <p className="text-sm text-slate-600 leading-relaxed italic">"{r.review}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
