import { useState, useEffect } from "react";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { Building2, Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ID } from "appwrite";

export default function CampusManager() {
    const [buildings, setBuildings] = useState<any[]>([]);
    const [pathways, setPathways] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [newBuilding, setNewBuilding] = useState({ name: "", code: "" });

    const fetchData = async () => {
        try {
            const bRes = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.BUILDINGS_COLLECTION_ID);
            setBuildings(bRes.documents);
            const pRes = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.PATHWAYS_COLLECTION_ID);
            setPathways(pRes.documents);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddBuilding = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBuilding.name || !newBuilding.code) return;
        try {
            await databases.createDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.BUILDINGS_COLLECTION_ID, ID.unique(), newBuilding);
            setNewBuilding({ name: "", code: "" });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteBuilding = async (id: string) => {
        try {
            await databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.BUILDINGS_COLLECTION_ID, id);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Campus Manager</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Manage Buildings, Rooms, and Pathways data.</p>
                </div>
                <Button className="font-bold tracking-widest uppercase">
                    <Plus className="w-4 h-4 mr-2" /> Add Entity
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Building2 className="w-5 h-5 mr-2 text-indigo-500" />
                            Buildings & Departments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddBuilding} className="flex gap-2 mb-6">
                            <input
                                type="text"
                                placeholder="Building Name (e.g. Science Block)"
                                className="flex-1 p-2 border rounded-md text-sm"
                                value={newBuilding.name}
                                onChange={e => setNewBuilding({ ...newBuilding, name: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Code (e.g. SB)"
                                className="w-24 p-2 border rounded-md text-sm"
                                value={newBuilding.code}
                                onChange={e => setNewBuilding({ ...newBuilding, code: e.target.value })}
                            />
                            <Button type="submit" variant="secondary">Add</Button>
                        </form>

                        {loading ? <div className="animate-pulse h-10 bg-slate-100 rounded"></div> : (
                            <div className="space-y-2">
                                {buildings.length === 0 ? <p className="text-sm text-slate-500">No buildings added yet.</p> : null}
                                {buildings.map(b => (
                                    <div key={b.$id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{b.name}</p>
                                            <p className="text-xs text-slate-500 font-mono">Code: {b.code}</p>
                                        </div>
                                        <button onClick={() => handleDeleteBuilding(b.$id)} className="text-red-500 hover:text-red-700 p-2" aria-label="Delete building" title="Delete building">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
                            Pathways
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500 mb-4">Add navigational instructions between key locations.</p>
                        {loading ? <div className="animate-pulse h-10 bg-slate-100 rounded"></div> : (
                            <div className="space-y-2">
                                {pathways.length === 0 ? <p className="text-sm text-slate-500 border border-dashed border-slate-200 p-4 text-center rounded-lg">No pathways defined.</p> : null}
                                {pathways.map(p => (
                                    <div key={p.$id} className="p-3 border rounded-lg bg-slate-50">
                                        <p className="font-bold text-slate-800 text-sm">{p.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
