import { useState, useEffect } from "react";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, Search, Plus, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CourseRegistration() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<any[]>([]);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const MAX_UNITS = 24;

    const fetchData = async () => {
        if (!user) return;
        try {
            const cRes = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COURSES_COLLECTION_ID);
            setCourses(cRes.documents);
            
            const rRes = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.REGISTRATIONS_COLLECTION_ID, [
                Query.equal("userId", user.$id)
            ]);
            setRegistrations(rRes.documents);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleRegister = async (courseId: string) => {
        if (!user) return;
        setSubmitting(true);
        try {
            await databases.createDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.REGISTRATIONS_COLLECTION_ID, ID.unique(), {
                userId: user.$id,
                courseId: courseId,
                semester: "Current"
            });
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDrop = async (regId: string) => {
        setSubmitting(true);
        try {
            await databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.REGISTRATIONS_COLLECTION_ID, regId);
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const registeredCourseIds = registrations.map(r => r.courseId);
    
    // Calculate units
    const currentUnits = registrations.reduce((total, reg) => {
        const course = courses.find(c => c.$id === reg.courseId);
        return total + (course ? course.units : 0);
    }, 0);

    const filteredCourses = courses.filter(c => 
        !registeredCourseIds.includes(c.$id) && 
        (c.code.toLowerCase().includes(searchTerm.toLowerCase()) || c.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Course Registration</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Select and finalize your courses for the semester.</p>
                </div>
                <div className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100">
                    <span className="font-bold text-sm uppercase tracking-widest">Total Units:</span>
                    <span className={`text-xl font-black ${currentUnits > MAX_UNITS ? 'text-red-500' : 'text-indigo-900'}`}>{currentUnits} / {MAX_UNITS}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="grid gap-8 md:grid-cols-12">
                    {/* Left Col: Available Courses */}
                    <div className="md:col-span-7 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search courses by code or title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Available Courses
                            </h3>
                            
                            {filteredCourses.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed rounded-xl border-slate-200 text-slate-400">
                                    No available courses found.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredCourses.map(course => (
                                        <div key={course.$id} className="bg-white border rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-indigo-200 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded font-bold">{course.code}</span>
                                                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">{course.units} Units</span>
                                                </div>
                                                <p className="font-bold text-slate-900">{course.title}</p>
                                                {course.department && <p className="text-xs text-slate-500 mt-1">{course.department}</p>}
                                            </div>
                                            <Button 
                                                onClick={() => handleRegister(course.$id)}
                                                disabled={submitting || (currentUnits + course.units > MAX_UNITS)}
                                                size="sm" 
                                                className="uppercase tracking-widest text-[10px] font-bold"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Registered Courses */}
                    <div className="md:col-span-5">
                        <Card className="sticky top-6 border-indigo-100 shadow-md">
                            <CardHeader className="bg-indigo-50 border-b border-indigo-100 rounded-t-xl pb-4">
                                <CardTitle className="text-lg flex items-center text-indigo-900">
                                    <CheckCircle className="w-5 h-5 mr-2 text-indigo-500" />
                                    Your Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {registrations.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        You haven't registered for any courses yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {registrations.map(reg => {
                                            const course = courses.find(c => c.$id === reg.courseId);
                                            if (!course) return null;
                                            return (
                                                <div key={reg.$id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{course.code}</p>
                                                        <p className="text-xs text-slate-500 line-clamp-1">{course.title}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{course.units}u</span>
                                                        <button 
                                                            onClick={() => handleDrop(reg.$id)}
                                                            disabled={submitting}
                                                            className="text-red-400 hover:text-red-600 p-1 transition-colors"
                                                            title="Drop Course"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {currentUnits > MAX_UNITS && (
                                    <div className="p-4 bg-red-50 border-t border-red-100 flex items-start gap-3 rounded-b-xl">
                                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                        <p className="text-xs text-red-700 font-medium">You have exceeded the maximum allowed credit units ({MAX_UNITS}). Please drop some courses.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
