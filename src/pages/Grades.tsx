import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Plus, Trash2, Loader2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface Grade {
    $id: string;
    courseName: string;
    grade: string;
    creditUnits: number;
    semester: string;
}

const GRADE_POINTS: Record<string, number> = {
    "A": 5,
    "B": 4,
    "C": 3,
    "D": 2,
    "E": 1,
    "F": 0
};

export default function Grades() {
    const { user } = useAuth();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form State
    const [courseName, setCourseName] = useState("");
    const [gradeLetter, setGradeLetter] = useState("A");
    const [creditUnits, setCreditUnits] = useState(3);
    const [semester, setSemester] = useState("1st Semester");

    const fetchGrades = async () => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.GRADES_COLLECTION_ID,
                [Query.equal("userId", user.$id)]
            );
            setGrades(response.documents as unknown as Grade[]);
        } catch (error) {
            console.error("Failed to fetch grades:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, [user]);

    const handleAddGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseName || !user) return;

        setCreating(true);
        try {
            const newGrade = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.GRADES_COLLECTION_ID,
                ID.unique(),
                {
                    courseName,
                    grade: gradeLetter,
                    creditUnits: Number(creditUnits),
                    semester,
                    userId: user.$id,
                }
            );
            setGrades([...grades, newGrade as unknown as Grade]);
            setIsDialogOpen(false);

            // Reset form
            setCourseName("");
            setGradeLetter("A");
            setCreditUnits(3);
        } catch (error) {
            console.error("Failed to add grade:", error);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteGrade = async (gradeId: string) => {
        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.GRADES_COLLECTION_ID,
                gradeId
            );
            setGrades(grades.filter(g => g.$id !== gradeId));
        } catch (error) {
            console.error("Failed to delete grade:", error);
        }
    }

    const [currentScale, setCurrentScale] = useState<'5.0' | '4.0'>('5.0');

    useEffect(() => {
        const scale = (localStorage.getItem("gradingScale") as '5.0' | '4.0') || '5.0';
        setCurrentScale(scale);
    }, []);

    const getGradePoints = (grade: string) => {
        const g = grade.toUpperCase();
        if (currentScale === '5.0') {
            switch (g) {
                case "A": return 5;
                case "B": return 4;
                case "C": return 3;
                case "D": return 2;
                case "E": return 1;
                case "F": return 0;
                default: return 0;
            }
        } else {
            // 4.0 UI Scale
            switch (g) {
                case "A": return 4;
                case "B": return 3;
                case "C": return 2;
                case "D": return 1;
                case "E": return 0;
                case "F": return 0;
                default: return 0;
            }
        }
    };

    // ... (fetchGrades remains same)

    const calculateCGPA = (): number => {
        if (grades.length === 0) return 0;

        let totalPoints = 0;
        let totalUnits = 0;

        grades.forEach(g => {
            const points = getGradePoints(g.grade);
            totalPoints += points * g.creditUnits;
            totalUnits += g.creditUnits;
        });

        return totalUnits === 0 ? 0 : Number((totalPoints / totalUnits).toFixed(2));
    }

    const chartData = grades.map(g => ({
        ...g,
        gradeValue: getGradePoints(g.grade)
    }));

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Academic Performance</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Grade
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleAddGrade}>
                            <DialogHeader>
                                <DialogTitle>Add Course Grade</DialogTitle>
                                <DialogDescription>
                                    Enter your course details and grade.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="course" className="text-right">Course</Label>
                                    <Input id="course" value={courseName} onChange={e => setCourseName(e.target.value)} className="col-span-3" placeholder="e.g. MTH 101" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="grade" className="text-right">Grade</Label>
                                    <select
                                        id="grade"
                                        value={gradeLetter}
                                        onChange={e => setGradeLetter(e.target.value)}
                                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                        {Object.keys(GRADE_POINTS).map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="units" className="text-right">Units</Label>
                                    <Input type="number" id="units" value={creditUnits} onChange={e => setCreditUnits(Number(e.target.value))} className="col-span-3" min={0} max={10} required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="semester" className="text-right">Semester</Label>
                                    <Input id="semester" value={semester} onChange={e => setSemester(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Grade
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CGPA</CardTitle>
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{calculateCGPA().toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Based on {grades.length} courses
                        </p>
                        <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${(calculateCGPA() / 5) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Performance Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full mt-4">
                            {grades.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis
                                            dataKey="courseName"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                            domain={[0, 5]}
                                            ticks={[0, 1, 2, 3, 4, 5]}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="rounded-lg border bg-popover p-2 shadow-md">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                        Grade
                                                                    </span>
                                                                    <span className="font-bold text-popover-foreground">
                                                                        {data.grade}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                        Points
                                                                    </span>
                                                                    <span className="font-bold text-popover-foreground">
                                                                        {getGradePoints(data.grade)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="gradeValue"
                                            radius={[4, 4, 0, 0]}
                                        >
                                            {
                                                chartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={['A', 'B'].includes(entry.grade) ? '#4ade80' : ['C'].includes(entry.grade) ? '#facc15' : '#f87171'}
                                                    />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    Add grades to see visualization
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Grade History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {grades.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No grades recorded yet.</p>
                        ) : (
                            <div className="grid gap-4">
                                {grades.map((grade) => (
                                    <div key={grade.$id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                        <div>
                                            <p className="font-semibold">{grade.courseName}</p>
                                            <p className="text-sm text-muted-foreground">{grade.semester} • {grade.creditUnits} Units</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                        ${['A', 'B'].includes(grade.grade) ? 'bg-green-100 text-green-700' :
                                                    ['C'].includes(grade.grade) ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
                                      `}>
                                                {grade.grade}
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteGrade(grade.$id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
