import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Plus, BookOpen, Loader2, Trash2, RotateCcw, CheckCircle, X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Flashcard {
    $id: string;
    userId: string;
    question: string;
    answer: string;
    courseTag: string;
    known: boolean;
}

export default function Flashcards() {
    const { user } = useAuth();
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [studyMode, setStudyMode] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [filterCourse, setFilterCourse] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [courseTag, setCourseTag] = useState("");

    const fetchCards = async () => {
        if (!user) return;
        try {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.FLASHCARDS_COLLECTION_ID,
                [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")]
            );
            setCards(res.documents as unknown as Flashcard[]);
        } catch (e) {
            console.error("Failed to fetch flashcards:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCards(); }, [user]);

    const courses = ["all", ...Array.from(new Set(cards.map(c => c.courseTag).filter(Boolean)))];
    const filteredCards = filterCourse === "all" ? cards : cards.filter(c => c.courseTag === filterCourse);
    const studyCards = filteredCards.filter(c => !c.known);
    const knownCount = filteredCards.filter(c => c.known).length;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !question || !answer) return;
        setCreating(true);
        try {
            const doc = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.FLASHCARDS_COLLECTION_ID,
                ID.unique(),
                { userId: user.$id, question, answer, courseTag: courseTag.toUpperCase(), known: false }
            );
            setCards([doc as unknown as Flashcard, ...cards]);
            setQuestion(""); setAnswer(""); setCourseTag("");
            setIsDialogOpen(false);
        } catch (e) { console.error("Failed to create card:", e); }
        finally { setCreating(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            await databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.FLASHCARDS_COLLECTION_ID, id);
            setCards(cards.filter(c => c.$id !== id));
        } catch (e) { console.error(e); }
    };

    const markKnown = async (known: boolean) => {
        const card = studyCards[currentIndex];
        if (!card) return;
        try {
            await databases.updateDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.FLASHCARDS_COLLECTION_ID, card.$id, { known });
            setCards(prev => prev.map(c => c.$id === card.$id ? { ...c, known } : c));
        } catch (e) { console.error(e); }
        setFlipped(false);
        if (currentIndex < studyCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setStudyMode(false);
            setCurrentIndex(0);
        }
    };

    const resetAllCards = async () => {
        const prev = [...cards];
        setCards(prev.map(c => ({ ...c, known: false })));
        try {
            await Promise.all(prev.map(c =>
                databases.updateDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.FLASHCARDS_COLLECTION_ID, c.$id, { known: false })
            ));
        } catch (e) {
            setCards(prev);
            console.error(e);
        }
        setCurrentIndex(0);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        </div>
    );

    // ── Study Mode ──────────────────────────────────────────────────────────────
    if (studyMode) {
        const card = studyCards[currentIndex];
        if (!card) return (
            <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900">Session Complete!</h2>
                <p className="text-slate-500 max-w-sm">You've reviewed all cards. Keep it up!</p>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => { resetAllCards(); setStudyMode(true); setCurrentIndex(0); }}>
                        <RotateCcw className="mr-2 h-4 w-4" />Reset & Restart
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setStudyMode(false); setCurrentIndex(0); }}>
                        Back to Cards
                    </Button>
                </div>
            </div>
        );

        const progress = (currentIndex / studyCards.length) * 100;
        return (
            <div className="max-w-2xl mx-auto space-y-6 py-8">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 pr-4">
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                            <span>Card {currentIndex + 1} of {studyCards.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setStudyMode(false)}>
                        <X className="mr-2 h-4 w-4" />Exit
                    </Button>
                </div>

                {card.courseTag && (
                    <span className="inline-block text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                        {card.courseTag}
                    </span>
                )}

                {/* Flip Card */}
                <div
                    className="cursor-pointer select-none"
                    style={{ perspective: "1200px" }}
                    onClick={() => setFlipped(!flipped)}
                >
                    <div
                        className="relative transition-transform duration-700 ease-in-out"
                        style={{
                            transformStyle: "preserve-3d",
                            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                            minHeight: "280px"
                        }}
                    >
                        {/* Front */}
                        <div
                            className="absolute inset-0 bg-white rounded-3xl border-2 border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col items-center justify-center p-10"
                            style={{ backfaceVisibility: "hidden" }}
                        >
                            <Brain className="w-8 h-8 text-indigo-200 mb-6" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Question</span>
                            <p className="text-xl font-bold text-slate-900 text-center leading-relaxed">{card.question}</p>
                            <p className="text-xs text-slate-300 mt-8 font-medium">Tap to reveal answer ↓</p>
                        </div>
                        {/* Back */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-2xl shadow-indigo-200/50 flex flex-col items-center justify-center p-10"
                            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-4">Answer</span>
                            <p className="text-xl font-bold text-white text-center leading-relaxed">{card.answer}</p>
                        </div>
                    </div>
                </div>

                {flipped ? (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <button
                            onClick={() => markKnown(false)}
                            className="py-4 bg-rose-50 border-2 border-rose-200 text-rose-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-100 hover:border-rose-300 transition-all active:scale-95"
                        >
                            😕 Still Learning
                        </button>
                        <button
                            onClick={() => markKnown(true)}
                            className="py-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-100 hover:border-emerald-300 transition-all active:scale-95"
                        >
                            ✓ Got It!
                        </button>
                    </div>
                ) : (
                    <p className="text-center text-xs text-slate-400 font-medium animate-pulse">Tap the card to reveal the answer</p>
                )}
            </div>
        );
    }

    // ── Card List View ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Flashcards</h1>
                    <p className="text-slate-500 mt-1">Study smarter with active recall.</p>
                </div>
                <div className="flex gap-3">
                    {studyCards.length > 0 && (
                        <Button variant="outline" onClick={() => { setStudyMode(true); setCurrentIndex(0); setFlipped(false); }}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Study ({studyCards.length})
                        </Button>
                    )}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                                <Plus className="mr-2 h-4 w-4" />New Card
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold">Create Flashcard</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Question</Label>
                                        <textarea
                                            className="w-full h-24 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none"
                                            value={question}
                                            onChange={e => setQuestion(e.target.value)}
                                            placeholder="Enter your question..."
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Answer</Label>
                                        <textarea
                                            className="w-full h-24 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none"
                                            value={answer}
                                            onChange={e => setAnswer(e.target.value)}
                                            placeholder="Enter the answer..."
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Course Tag (optional)</Label>
                                        <Input value={courseTag} onChange={e => setCourseTag(e.target.value)} placeholder="e.g. CSC301" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={creating} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                        {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Card"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            {filteredCards.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-sm">
                        <p className="text-3xl font-black text-slate-900">{filteredCards.length}</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-widest">Total</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 text-center shadow-sm">
                        <p className="text-3xl font-black text-emerald-600">{knownCount}</p>
                        <p className="text-xs text-emerald-400 mt-1 font-medium uppercase tracking-widest">Known</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 text-center shadow-sm">
                        <p className="text-3xl font-black text-amber-600">{studyCards.length}</p>
                        <p className="text-xs text-amber-400 mt-1 font-medium uppercase tracking-widest">To Learn</p>
                    </div>
                </div>
            )}

            {/* Course Filter */}
            {courses.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {courses.map(c => (
                        <button
                            key={c}
                            onClick={() => setFilterCourse(c)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${filterCourse === c ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {c === "all" ? "All Courses" : c}
                        </button>
                    ))}
                </div>
            )}

            {/* Cards Grid */}
            {filteredCards.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <BookOpen className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                    <h3 className="font-black text-lg text-slate-400">No flashcards yet</h3>
                    <p className="text-sm text-slate-300 mt-1">Create your first card to start studying.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCards.map(card => (
                        <div
                            key={card.$id}
                            className={`bg-white rounded-2xl border p-5 space-y-3 shadow-sm hover:shadow-lg transition-all duration-300 group ${card.known ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 hover:border-indigo-100'}`}
                        >
                            <div className="flex items-start justify-between">
                                {card.courseTag
                                    ? <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg uppercase tracking-wide">{card.courseTag}</span>
                                    : <span />
                                }
                                <button
                                    onClick={() => handleDelete(card.$id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-rose-500 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Question</p>
                                <p className="text-sm font-bold text-slate-800 line-clamp-2">{card.question}</p>
                            </div>
                            <div className="border-t border-slate-50 pt-3">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Answer</p>
                                <p className="text-sm text-slate-500 line-clamp-2">{card.answer}</p>
                            </div>
                            <div className="pt-1">
                                {card.known
                                    ? <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Known</span>
                                    : <span className="text-[10px] font-black text-amber-500">Study needed</span>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
