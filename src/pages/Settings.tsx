import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Bell, Shield, LogOut, GraduationCap, Camera, Loader2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { databases, storage, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

export default function Settings() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Profile State
    const [profileId, setProfileId] = useState<string | null>(null);
    const [matricNumber, setMatricNumber] = useState("");
    const [nickname, setNickname] = useState("");
    const [department, setDepartment] = useState("");
    const [faculty, setFaculty] = useState("");
    const [university, setUniversity] = useState("");
    const [bio, setBio] = useState("");
    const [avatarId, setAvatarId] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Check if profile exists in collection
                const response = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.PROFILES_COLLECTION_ID,
                    [Query.equal("userId", user.$id)]
                );

                if (response.documents.length > 0) {
                    const profile = response.documents[0];
                    setProfileId(profile.$id);
                    setMatricNumber(profile.matricNumber || "");
                    setNickname(profile.nickname || "");
                    setDepartment(profile.department || "");
                    setFaculty(profile.faculty || "");
                    setUniversity(profile.university || "");
                    setBio(profile.bio || "");
                    setAvatarId(profile.avatarId || null);

                    if (profile.avatarId) {
                        const url = storage.getFilePreview(
                            APPWRITE_CONFIG.BUCKET_ID,
                            profile.avatarId
                        );
                        setAvatarUrl(url);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setSaving(true);
        try {
            // Upload file
            const response = await storage.createFile(
                APPWRITE_CONFIG.BUCKET_ID,
                ID.unique(),
                file
            );

            // Get preview URL
            const url = storage.getFilePreview(
                APPWRITE_CONFIG.BUCKET_ID,
                response.$id
            );

            setAvatarId(response.$id);
            setAvatarUrl(url);
        } catch (error) {
            console.error("Failed to upload avatar:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const profileData = {
                userId: user.$id,
                email: user.email,
                matricNumber,
                nickname,
                department,
                faculty,
                university,
                bio,
                avatarId
            };

            if (profileId) {
                // Update existing
                await databases.updateDocument(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.PROFILES_COLLECTION_ID,
                    profileId,
                    profileData
                );
            } else {
                // Create new
                const newProfile = await databases.createDocument(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.PROFILES_COLLECTION_ID,
                    ID.unique(),
                    profileData
                );
                setProfileId(newProfile.$id);
            }
            alert("Profile saved successfully!");
        } catch (error) {
            console.error("Failed to save profile:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;
    }

    return (
        <div className="space-y-6 pb-20">
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
                            <User className="h-5 w-5 text-indigo-600" />
                            <CardTitle>Profile Information</CardTitle>
                        </div>
                        <CardDescription>
                            Your personal and academic details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <User className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm">
                                    <Camera className="w-4 h-4" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            </div>
                            <div>
                                <h3 className="font-medium text-lg">{user?.name}</h3>
                                <p className="text-sm text-slate-500">{user?.email}</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Nickname</Label>
                                <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Ace" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Matric Number</Label>
                                <Input value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} placeholder="e.g. 123456" />
                            </div>
                            <div className="grid gap-2">
                                <Label>University</Label>
                                <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Your University" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Faculty</Label>
                                <Input value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="e.g. Science" />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Department</Label>
                                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science" />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Bio</Label>
                                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a bit about yourself..." />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end">
                        <Button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-indigo-600" />
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
                                <SelectTrigger className="w-full sm:w-[180px]">
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
                            <Bell className="h-5 w-5 text-indigo-600" />
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
                            <Shield className="h-5 w-5 text-indigo-600" />
                            <CardTitle>Account Actions</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" onClick={logout} className="w-full sm:w-auto">
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
