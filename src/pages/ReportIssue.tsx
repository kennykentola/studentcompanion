import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID } from "appwrite";
import { AlertOctagon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportIssue() {
    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title || !description) return;
        setSubmitting(true);
        try {
            await databases.createDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.ISSUE_REPORTS_COLLECTION_ID, ID.unique(), {
                userId: user.$id,
                title,
                description,
                status: 'pending'
            });
            setSuccess(true);
            setTitle("");
            setDescription("");
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-10">
            <div className="flex items-center space-x-4 border-b pb-6">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                    <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Report an Issue</h1>
                    <p className="text-sm text-slate-500 font-medium">Send a ticket directly to the campus administrators.</p>
                </div>
            </div>

            {success ? (
                <div className="p-8 text-center bg-emerald-50 border border-emerald-100 rounded-xl">
                    <h3 className="text-lg font-bold text-emerald-800 mb-2">Ticket Submitted!</h3>
                    <p className="text-sm text-emerald-600 mb-6">Administrators will review your issue shortly.</p>
                    <Button onClick={() => setSuccess(false)} variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-100">Report Another Issue</Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[10px]">Issue Title</label>
                        <input
                            type="text"
                            required
                            placeholder="Briefly describe the issue..."
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[10px]">Detailed Description</label>
                        <textarea
                            required
                            rows={5}
                            placeholder="Provide details about location, error codes, or context..."
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full font-bold uppercase tracking-widest">
                        {submitting ? "Submitting..." : <><Send className="w-4 h-4 mr-2" /> Submit Ticket</>}
                    </Button>
                </form>
            )}
        </div>
    );
}
