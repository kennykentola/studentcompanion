import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Bell, Shield, LogOut, GraduationCap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
    const { user, logout } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <CardTitle>Profile Information</CardTitle>
                        </div>
                        <CardDescription>
                            Your personal details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input value={user?.name || ""} disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ""} disabled />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            <CardTitle>Academic Preferences</CardTitle>
                        </div>
                        <CardDescription>
                            Configure your grading system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="grading-scale">Grading Scale</Label>
                            <Select
                                value={localStorage.getItem("gradingScale") || "5.0"}
                                onValueChange={(val) => {
                                    localStorage.setItem("gradingScale", val);
                                    window.location.reload(); // Simple reload to apply changes everywhere
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select scale" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5.0">5.0 Scale (General)</SelectItem>
                                    <SelectItem value="4.0">4.0 Scale (UI Standard)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>
                            Configure how you receive alerts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="email-notifs" className="rounded border-gray-300" defaultChecked />
                            <Label htmlFor="email-notifs">Email Notifications</Label>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle>Account Actions</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
