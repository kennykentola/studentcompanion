import { useAuth } from "@/context/AuthContext";
import { Building2, AlertOctagon, Users, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
    const { user } = useAuth();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Welcome, Admin {user?.name || "User"}</h1>
                <p className="text-slate-500 font-medium">System Overview and Health Metrics</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Campuses / Buildings</CardTitle>
                        <Building2 className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-slate-500">Active structures</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Issue Reports</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-red-500">Requires attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Registered Students</CardTitle>
                        <Users className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,204</div>
                        <p className="text-xs text-slate-500">+12 this week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">84</div>
                        <p className="text-xs text-slate-500">Across 15 departments</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Link to="/admin/campus" className="p-4 border rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors">
                            <span className="font-medium text-slate-900">Manage Buildings & Rooms</span>
                            <Building2 className="w-4 h-4 text-slate-400" />
                        </Link>
                        <Link to="/admin/issues" className="p-4 border rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors">
                            <span className="font-medium text-slate-900">Resolve Issue Tickets</span>
                            <AlertOctagon className="w-4 h-4 text-slate-400" />
                        </Link>
                    </CardContent>
                </Card>
                
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>System Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center text-sm border-b pb-2">
                                <span className="font-mono text-xs text-slate-400 w-20">10:42 AM</span>
                                <span className="text-slate-700">Database backup completed successfully.</span>
                            </div>
                            <div className="flex items-center text-sm border-b pb-2">
                                <span className="font-mono text-xs text-slate-400 w-20">09:15 AM</span>
                                <span className="text-slate-700">Admin login: ateniolapeace7@gmail.com</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="font-mono text-xs text-slate-400 w-20">Yesterday</span>
                                <span className="text-slate-700">New collection "courses" provisioned.</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
