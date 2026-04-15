import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Plus, Loader2, TrendingUp, TrendingDown, Wallet, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";

interface BudgetEntry {
    $id: string;
    userId: string;
    title: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
}

const EXPENSE_CATEGORIES = ["Food", "Transport", "Books", "Accommodation", "Entertainment", "Health", "Clothing", "Other"];
const INCOME_CATEGORIES = ["Allowance", "Scholarship", "Part-time Job", "Gift", "Other"];

export default function Budget() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<BudgetEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"income" | "expense">("expense");
    const [category, setCategory] = useState("Other");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    // Filter
    const [viewMonth, setViewMonth] = useState(format(new Date(), "yyyy-MM"));

    const fetchEntries = async () => {
        if (!user) return;
        try {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.BUDGET_ENTRIES_COLLECTION_ID,
                [Query.equal("userId", user.$id), Query.orderDesc("date"), Query.limit(200)]
            );
            setEntries(res.documents as unknown as BudgetEntry[]);
        } catch (e) {
            console.error("Failed to fetch budget entries:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEntries(); }, [user]);

    // Filter entries by selected month
    const monthStart = startOfMonth(parseISO(viewMonth + "-01"));
    const monthEnd = endOfMonth(parseISO(viewMonth + "-01"));
    const monthEntries = entries.filter(e => {
        try {
            return isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd });
        } catch { return false; }
    });

    const totalIncome = monthEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const totalExpense = monthEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    const balance = totalIncome - totalExpense;

    // Category breakdown for expenses
    const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
        cat,
        amount: monthEntries.filter(e => e.type === "expense" && e.category === cat).reduce((s, e) => s + e.amount, 0)
    })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    const maxExpense = expenseByCategory[0]?.amount || 1;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title || !amount || isNaN(+amount)) return;
        setCreating(true);
        try {
            const doc = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.BUDGET_ENTRIES_COLLECTION_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    title,
                    amount: parseFloat(amount),
                    type,
                    category,
                    date
                }
            );
            setEntries([doc as unknown as BudgetEntry, ...entries]);
            setTitle(""); setAmount(""); setType("expense"); setCategory("Other");
            setDate(new Date().toISOString().split("T")[0]);
            setIsDialogOpen(false);
        } catch (e) { console.error("Failed to create entry:", e); }
        finally { setCreating(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            await databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.BUDGET_ENTRIES_COLLECTION_ID, id);
            setEntries(entries.filter(e => e.$id !== id));
        } catch (e) { console.error(e); }
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
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Budget Tracker</h1>
                    <p className="text-slate-500 mt-1">Track your income and expenses month by month.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Input
                        type="month"
                        value={viewMonth}
                        onChange={e => setViewMonth(e.target.value)}
                        className="w-40 rounded-xl"
                    />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                                <Plus className="mr-2 h-4 w-4" />Add Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold">Add Entry</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    {/* Income / Expense Toggle */}
                                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                                        {(["expense", "income"] as const).map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => { setType(t); setCategory("Other"); }}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === t
                                                    ? t === "income" ? "bg-emerald-500 text-white shadow-md" : "bg-rose-500 text-white shadow-md"
                                                    : "text-slate-400"}`}
                                            >
                                                {t === "income" ? "💰 Income" : "💸 Expense"}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Canteen lunch" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Amount (₦)</Label>
                                            <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date</Label>
                                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={creating} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                        {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Entry"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className={`rounded-2xl border p-5 shadow-sm ${balance >= 0 ? 'bg-indigo-600 border-indigo-700' : 'bg-rose-600 border-rose-700'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-5 h-5 text-white/70" />
                        <span className="text-xs font-black text-white/70 uppercase tracking-widest">Balance</span>
                    </div>
                    <p className="text-2xl font-black text-white">₦{Math.abs(balance).toLocaleString()}</p>
                    {balance < 0 && <p className="text-xs text-white/60 mt-1">Deficit</p>}
                </div>
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Income</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">₦{totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-rose-50 rounded-2xl border border-rose-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-5 h-5 text-rose-500" />
                        <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Expenses</span>
                    </div>
                    <p className="text-2xl font-black text-rose-600">₦{totalExpense.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Spending Breakdown */}
                {expenseByCategory.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-black text-slate-900 mb-5 text-sm uppercase tracking-widest">Spending Breakdown</h3>
                        <div className="space-y-3">
                            {expenseByCategory.map(({ cat, amount: amt }) => (
                                <div key={cat}>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-slate-600">{cat}</span>
                                        <span className="text-slate-800">₦{amt.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                                            style={{ width: `${(amt / maxExpense) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transaction History */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-50">
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Transactions</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{format(monthStart, "MMMM yyyy")}</p>
                    </div>
                    {monthEntries.length === 0 ? (
                        <div className="text-center py-12">
                            <DollarSign className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium text-sm">No entries this month</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                            {monthEntries.map(e => (
                                <div key={e.$id} className="flex items-center px-5 py-3.5 hover:bg-slate-50/50 group transition-colors">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 shrink-0 ${e.type === "income" ? "bg-emerald-50" : "bg-rose-50"}`}>
                                        {e.type === "income"
                                            ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            : <TrendingDown className="w-4 h-4 text-rose-500" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{e.title}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{e.category} · {e.date}</p>
                                    </div>
                                    <span className={`text-sm font-black ml-3 ${e.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                                        {e.type === "income" ? "+" : "−"}₦{e.amount.toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(e.$id)}
                                        className="ml-3 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
