import { useState, useEffect } from "react";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { Query } from "appwrite";
import { AlertOctagon, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IssueResolution() {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchIssues = async () => {
        try {
            const res = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.ISSUE_REPORTS_COLLECTION_ID, [
                Query.orderDesc('$createdAt')
            ]);
            setIssues(res.documents);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const markResolved = async (id: string) => {
        try {
            await databases.updateDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.ISSUE_REPORTS_COLLECTION_ID, id, {
                status: 'resolved'
            });
            fetchIssues();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Issue Tickets</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Review and resolve problems reported by students.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : issues.length === 0 ? (
                <div className="text-center p-16 bg-slate-50 rounded-3xl border border-slate-100">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No active issues</h3>
                    <p className="text-sm text-slate-500">All student reports have been resolved.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {issues.map(issue => (
                        <div key={issue.$id} className={`p-6 border rounded-xl shadow-sm ${issue.status === 'resolved' ? 'bg-slate-50 opacity-70' : 'bg-white border-red-100'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center ${issue.status === 'resolved' ? 'bg-slate-200 text-slate-500' : 'bg-red-100 text-red-500'}`}>
                                        {issue.status === 'resolved' ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{issue.title}</h3>
                                        <div className="flex items-center space-x-3 mt-1 mb-3">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {issue.status}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center font-medium">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(issue.$createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm whitespace-pre-wrap">{issue.description}</p>
                                    </div>
                                </div>
                                {issue.status !== 'resolved' && (
                                    <Button onClick={() => markResolved(issue.$id)} variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                                        Mark Resolved
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
