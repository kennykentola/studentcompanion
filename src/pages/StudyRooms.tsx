import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Plus, Loader2, Users, MessageSquare, Send, ChevronLeft, BookOpen, Lock, Unlock, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

interface StudyRoom {
    $id: string;
    name: string;
    courseTag: string;
    description: string;
    createdBy: string;
    createdByName: string;
    isPrivate: boolean;
    roomCode?: string;
}

interface RoomMessage {
    $id: string;
    body: string;
    userId: string;
    username: string;
    roomId: string;
    $createdAt: string;
}

export default function StudyRooms() {
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [rooms, setRooms] = useState<StudyRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
    const [messages, setMessages] = useState<RoomMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [sending, setSending] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Join Code State
    const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
    const [attemptRoom, setAttemptRoom] = useState<StudyRoom | null>(null);
    const [joinCode, setJoinCode] = useState("");
    const [joinError, setJoinError] = useState("");

    // Form
    const [roomName, setRoomName] = useState("");
    const [roomCourse, setRoomCourse] = useState("");
    const [roomDesc, setRoomDesc] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [roomCode, setRoomCode] = useState("");

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchRooms = async () => {
        try {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.STUDY_ROOMS_COLLECTION_ID,
                [Query.orderDesc("$createdAt")]
            );
            setRooms(res.documents as unknown as StudyRoom[]);
        } catch (e) {
            console.error("Failed to fetch rooms:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (roomId: string) => {
        try {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.MESSAGES_COLLECTION_ID,
                [Query.equal("roomId", roomId), Query.orderAsc("$createdAt"), Query.limit(100)]
            );
            setMessages(res.documents.map((d: any) => ({
                $id: d.$id,
                body: d.body || d.content || "",
                userId: d.userId,
                username: d.username,
                roomId: d.roomId,
                $createdAt: d.$createdAt
            })));
        } catch (e) {
            console.error("Failed to fetch messages:", e);
        }
    };

    useEffect(() => { fetchRooms(); }, [user]);

    useEffect(() => {
        if (activeRoom) {
            setMessagesLoading(true);
            fetchMessages(activeRoom.$id).finally(() => setMessagesLoading(false));
            // Poll for new messages every 5 seconds
            pollingRef.current = setInterval(() => fetchMessages(activeRoom.$id), 5000);
        } else {
            if (pollingRef.current) clearInterval(pollingRef.current);
        }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [activeRoom]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !roomName) return;
        setCreating(true);
        try {
            const doc = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.STUDY_ROOMS_COLLECTION_ID,
                ID.unique(),
                {
                    name: roomName,
                    courseTag: roomCourse.toUpperCase(),
                    description: roomDesc,
                    createdBy: user.$id,
                    createdByName: user.name || "Anonymous",
                    isPrivate: isPrivate,
                    roomCode: isPrivate ? roomCode : null
                }
            );
            const newRoom = doc as unknown as StudyRoom;
            setRooms([newRoom, ...rooms]);
            setRoomName(""); setRoomCourse(""); setRoomDesc(""); setIsPrivate(false); setRoomCode("");
            setIsDialogOpen(false);
            // Automatically enter the room you just created
            setActiveRoom(newRoom);
        } catch (e) { console.error("Failed to create room:", e); }
        finally { setCreating(false); }
    };

    const generateCode = () => {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setRoomCode(code);
    };

    const handleEntryAttempt = (room: StudyRoom) => {
        if (!room.isPrivate || room.createdBy === user?.$id) {
            setActiveRoom(room);
        } else {
            setAttemptRoom(room);
            setJoinCode("");
            setJoinError("");
            setIsAccessDialogOpen(true);
        }
    };

    const verifyCode = () => {
        if (attemptRoom && joinCode === attemptRoom.roomCode) {
            setActiveRoom(attemptRoom);
            setIsAccessDialogOpen(false);
            setAttemptRoom(null);
        } else {
            setJoinError("Incorrect code. Please try again.");
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activeRoom || !messageText.trim()) return;
        setSending(true);
        try {
            const doc = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.MESSAGES_COLLECTION_ID,
                ID.unique(),
                {
                    body: messageText.trim(),
                    userId: user.$id,
                    username: user.name || "Anonymous",
                    roomId: activeRoom.$id,
                    fileId: null,
                    fileName: null,
                    attachments: []
                }
            );
            setMessages(prev => [...prev, {
                $id: doc.$id,
                body: messageText.trim(),
                userId: user.$id,
                username: user.name || "Anonymous",
                roomId: activeRoom.$id,
                $createdAt: doc.$createdAt
            }]);
            setMessageText("");
        } catch (e) { console.error("Failed to send message:", e); }
        finally { setSending(false); }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        </div>
    );

    // ── Room Chat View ──────────────────────────────────────────────────────────
    if (activeRoom) {
        return (
            <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
                {/* Room Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100 mb-4">
                    <button
                        onClick={() => setActiveRoom(null)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="font-black text-slate-900 text-lg">{activeRoom.name}</h2>
                            {activeRoom.isPrivate && (
                                <Lock className="w-4 h-4 text-rose-500" />
                            )}
                            {activeRoom.courseTag && (
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">{activeRoom.courseTag}</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">Created by {activeRoom.createdByName}</p>
                    </div>
                    {activeRoom.isPrivate && activeRoom.createdBy === user?.$id && (
                        <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                            <Share2 className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-xs font-black text-rose-600 tracking-wider">CODE: {activeRoom.roomCode}</span>
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {messagesLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin w-6 h-6 text-slate-300" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                            <p className="font-bold text-slate-400">No messages yet</p>
                            <p className="text-sm text-slate-300 mt-1">Be the first to say something!</p>
                        </div>
                    ) : (
                        messages.map(msg => {
                            const isMe = msg.userId === user?.$id;
                            return (
                                <div key={msg.$id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                        {!isMe && (
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide px-1">{msg.username}</span>
                                        )}
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${isMe
                                            ? "bg-indigo-600 text-white rounded-br-sm"
                                            : "bg-white border border-slate-100 text-slate-800 shadow-sm rounded-bl-sm"
                                            }`}>
                                            {msg.body}
                                        </div>
                                        <span className="text-[9px] text-slate-300 px-1">
                                            {format(new Date(msg.$createdAt), "h:mm a")}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                    <Input
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl"
                        disabled={sending}
                    />
                    <Button type="submit" disabled={sending || !messageText.trim()} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-4">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        );
    }

    // ── Room List View ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Study Rooms</h1>
                    <p className="text-slate-500 mt-1">Collaborate with peers by course or topic.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                            <Plus className="mr-2 h-4 w-4" />Create Room
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-3xl">
                        <form onSubmit={handleCreateRoom}>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Create Study Room</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Room Name</Label>
                                    <Input value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="e.g. CSC301 Exam Prep" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Course Tag</Label>
                                        <Input value={roomCourse} onChange={e => setRoomCourse(e.target.value)} placeholder="e.g. CSC301" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="block mb-2">Privacy</Label>
                                        <div className="flex items-center gap-2 h-10 px-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = !isPrivate;
                                                    setIsPrivate(next);
                                                    if (next && !roomCode) generateCode();
                                                }}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isPrivate ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </button>
                                            <span className="text-xs font-bold text-slate-600">{isPrivate ? "Private" : "Public"}</span>
                                        </div>
                                    </div>
                                </div>

                                {isPrivate && (
                                    <div className="space-y-2 bg-rose-50 p-4 rounded-2xl border border-rose-100 animate-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <Label className="text-rose-700">Entry Code</Label>
                                            <Button type="button" variant="ghost" size="sm" onClick={generateCode} className="h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-100">
                                                <RefreshCw className="w-3 h-3 mr-1" /> Random
                                            </Button>
                                        </div>
                                        <Input
                                            value={roomCode}
                                            onChange={e => setRoomCode(e.target.value)}
                                            placeholder="Set a code"
                                            maxLength={10}
                                            className="bg-white border-rose-200 text-rose-600 font-bold tracking-widest text-center text-lg h-12"
                                        />
                                        <p className="text-[10px] text-rose-500 font-medium">Share this code with people you want to study with.</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Description (optional)</Label>
                                    <textarea
                                        className="w-full h-20 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none"
                                        value={roomDesc}
                                        onChange={e => setRoomDesc(e.target.value)}
                                        placeholder="What will you study here?"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-base font-bold">
                                    {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Room"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Password Access Dialog */}
            <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-indigo-600 p-8 text-center text-white">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold">{attemptRoom?.name}</h2>
                        <p className="text-indigo-100 text-sm mt-1">This is a private study room.</p>
                    </div>
                    <div className="p-8 bg-white">
                        <div className="space-y-4">
                            <div className="space-y-2 text-center">
                                <Label className="text-slate-500 text-xs font-bold uppercase tracking-widest">Enter Study Code</Label>
                                <Input
                                    type="text"
                                    value={joinCode}
                                    onChange={e => { setJoinCode(e.target.value); setJoinError(""); }}
                                    className="h-14 text-center text-2xl font-black tracking-[0.5em] rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="----"
                                    autoFocus
                                />
                                {joinError && <p className="text-rose-500 text-xs font-bold">{joinError}</p>}
                            </div>
                            <Button onClick={verifyCode} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-lg font-bold shadow-lg shadow-indigo-100">
                                Join Session
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {rooms.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Users className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                    <h3 className="font-black text-lg text-slate-400">No study rooms yet</h3>
                    <p className="text-sm text-slate-300 mt-1">Create one to start collaborating.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map(room => (
                        <button
                            key={room.$id}
                            onClick={() => handleEntryAttempt(room)}
                            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all text-left group relative overflow-hidden"
                        >
                            {room.isPrivate && (
                                <div className="absolute top-0 right-0 p-2">
                                    <div className="bg-rose-50 p-1.5 rounded-lg">
                                        <Lock className="w-3.5 h-3.5 text-rose-500" />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                </div>
                                {room.courseTag && (
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${room.isPrivate ? "text-rose-600 bg-rose-50" : "text-indigo-600 bg-indigo-50"}`}>
                                        {room.courseTag}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-black text-slate-900 text-base leading-snug">{room.name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wide">By {room.createdByName}</p>
                            {room.description && (
                                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{room.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                                {room.isPrivate ? (
                                    <Unlock className="w-3.5 h-3.5 text-rose-400" />
                                ) : (
                                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                                )}
                                <span className={`text-xs font-bold ${room.isPrivate ? "text-rose-500" : "text-indigo-500"}`}>
                                    {room.isPrivate ? "Unlock & Enter →" : "Join Discussion →"}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
