import { useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CourseRow {
    id: number;
    courseCode: string;
    creditUnits: number;
    grade: string;
}

const UI_GRADING = {
    "A": 4,
    "B": 3,
    "C": 2,
    "D": 1,
    "E": 0,
    "F": 0
};

export default function Calculator() {
    const [rows, setRows] = useState<CourseRow[]>([
        { id: 1, courseCode: "", creditUnits: 0, grade: "A" }
    ]);

    const addRow = () => {
        setRows([...rows, { id: Date.now(), courseCode: "", creditUnits: 0, grade: "A" }]);
    };

    const removeRow = (id: number) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id: number, field: keyof CourseRow, value: any) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const calculate = () => {
        let tgp = 0;
        let tcu = 0;

        rows.forEach(r => {
            const units = Number(r.creditUnits);
            const points = UI_GRADING[r.grade as keyof typeof UI_GRADING] || 0;

            if (units > 0) {
                tgp += units * points;
                tcu += units;
            }
        });

        return { tgp, tcu, cgpa: tcu === 0 ? 0 : (tgp / tcu) };
    };

    const { tgp, tcu, cgpa } = calculate();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Manual CGPA Calculator</h1>
                <p className="text-muted-foreground">
                    Calculate your semester or cumulative GPA using the UI (4.0) Standard.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Course Entries</CardTitle>
                        <CardDescription>Enter your courses, credit units, and grades.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-2">Course</TableHead>
                                        <TableHead className="w-[70px] px-2 text-center">Units</TableHead>
                                        <TableHead className="w-[80px] px-2">Grade</TableHead>
                                        <TableHead className="w-[60px] px-2 text-right">GP</TableHead>
                                        <TableHead className="w-[40px] px-2"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <Input
                                                    placeholder="e.g. ENG 101"
                                                    value={row.courseCode}
                                                    onChange={(e) => updateRow(row.id, "courseCode", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={row.creditUnits || ""}
                                                    onChange={(e) => updateRow(row.id, "creditUnits", Number(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={row.grade}
                                                    onValueChange={(val) => updateRow(row.id, "grade", val)}
                                                >
                                                    <SelectTrigger className="h-9 px-2">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.keys(UI_GRADING).map(g => (
                                                            <SelectItem key={g} value={g}>{g} ({UI_GRADING[g as keyof typeof UI_GRADING]})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {(Number(row.creditUnits) * (UI_GRADING[row.grade as keyof typeof UI_GRADING] || 0))}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Button className="mt-4" variant="outline" onClick={addRow}>
                            <Plus className="mr-2 h-4 w-4" /> Add Row
                        </Button>
                    </CardContent>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Total Units (TCU)</span>
                            <span className="font-bold text-lg">{tcu}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Total Points (TGP)</span>
                            <span className="font-bold text-lg">{tgp}</span>
                        </div>
                        <div className="mt-4 pt-4 text-center bg-primary/5 rounded-2xl p-4">
                            <span className="block text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Your CGPA</span>
                            <div className="text-4xl md:text-5xl font-black text-primary tracking-tight">{cgpa.toFixed(2)}</div>
                        </div>

                        <Button
                            className="w-full mt-6"
                            variant="destructive"
                            onClick={() => setRows([{ id: Date.now(), courseCode: "", creditUnits: 0, grade: "A" }])}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
