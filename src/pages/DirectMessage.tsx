import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { databases, client, storage, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { format } from "date-fns";
import {
    ArrowLeft,
    Send,
    Paperclip,
    Mic,
    Loader2,
    Phone,
    X
} from "lucide-react";
import type { ChatMessage } from '../types';

export default function DirectMessage() {
    const { userId: targetUserId } = useParams<{ userId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [targetUser, setTargetUser] = useState<any>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Generate Room ID (deterministic sorted IDs)
    const roomId = user && targetUserId
        ? `dm_${[user.$id, targetUserId].sort().join('_')}`
        : '';

    useEffect(() => {
        if (!targetUserId) return;

        const fetchTargetUser = async () => {
            try {
                const response = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.PROFILES_COLLECTION_ID,
                    [Query.equal("userId", targetUserId)]
                );
                if (response.documents.length > 0) {
                    setTargetUser(response.documents[0]);
                }
            } catch (error) {
                console.error("Failed to fetch target user:", error);
            }
        };

        fetchTargetUser();
    }, [targetUserId]);

    useEffect(() => {
        if (!user || !roomId) return;

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const response = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.MESSAGES_COLLECTION_ID,
                    [
                        Query.equal("roomId", roomId),
                        Query.orderAsc("$createdAt"),
                        Query.limit(50)
                    ]
                );

                const mapped: ChatMessage[] = response.documents.map((doc: any) => ({
                    id: doc.$id,
                    sender: doc.username,
                    content: doc.body,
                    timestamp: format(new Date(doc.$createdAt), "h:mm a"),
                    isMe: doc.userId === user.$id,
                    userId: doc.userId,
                    fileId: doc.fileId,
                    fileName: doc.fileName
                }));
                setMessages(mapped);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        const unsubscribe = client.subscribe(
            `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.MESSAGES_COLLECTION_ID}.documents`,
            (response: any) => {
                const payload = response.payload as any;
                if (response.events.includes("databases.*.collections.*.documents.*.create")) {
                    if (payload.roomId !== roomId) return;

                    const newMsg: ChatMessage = {
                        id: payload.$id,
                        sender: payload.username,
                        content: payload.body,
                        timestamp: format(new Date(payload.$createdAt), "h:mm a"),
                        isMe: payload.userId === user.$id,
                        userId: payload.userId,
                        fileId: payload.fileId,
                        fileName: payload.fileName
                    };
                    setMessages((prev: ChatMessage[]) => [...prev, newMsg]);
                }
            }
        );

        return () => unsubscribe();
    }, [user, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachedFile) || !user || !roomId) return;

        setIsSending(true);
        try {
            let fileId = undefined;
            if (attachedFile) {
                const upload = await storage.createFile(
                    APPWRITE_CONFIG.BUCKET_ID,
                    ID.unique(),
                    attachedFile
                );
                fileId = upload.$id;
            }

            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.MESSAGES_COLLECTION_ID,
                ID.unique(),
                {
                    body: newMessage,
                    userId: user.$id,
                    username: user.name,
                    roomId: roomId,
                    fileId: fileId,
                    fileName: attachedFile?.name,
                    attachments: fileId ? [fileId] : []
                }
            );

            // Trigger Notification for recipient
            if (targetUserId) {
                await databases.createDocument(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.NOTIFICATIONS_COLLECTION_ID,
                    ID.unique(),
                    {
                        userId: targetUserId,
                        message: `New message from ${user.name}`,
                        isRead: false,
                        type: "info"
                    }
                );
            }

            setNewMessage("");
            setAttachedFile(null);
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
            const recorder = new MediaRecorder(stream, { mimeType });
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], "voice_note.webm", { type: 'audio/webm' });
                setAttachedFile(file);
            };

            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
            mediaRecorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] bg-slate-50 md:rounded-2xl shadow-sm border border-slate-200 overflow-hidden m-0 md:m-2">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {targetUser?.nickname?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 text-sm md:text-base">
                            {targetUser?.nickname || "Direct Message"}
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-400 font-normal truncate max-w-[150px]">
                            {targetUser?.email || "Chatting privately"}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-indigo-100 bg-indigo-50/50 cursor-not-allowed rounded-full">
                        <Phone className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-sm font-medium">Loading your conversation...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <Send className="w-8 h-8 text-indigo-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No messages yet.</p>
                        <p className="text-xs max-w-xs mt-1">Start a conversation with {targetUser?.nickname || 'your classmate'}!</p>
                    </div>
                ) : (
                    messages.map((msg: ChatMessage) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-sm ${msg.isMe ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-100 text-slate-800'}`}>
                                {!msg.isMe && <div className="text-[10px] font-bold opacity-70 mb-1">{msg.sender}</div>}
                                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                {msg.fileName && (
                                    <div className={`mt-2 p-2 rounded-xl flex items-center gap-2 text-xs border ${msg.isMe ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                                        <Paperclip className="w-3 h-3" />
                                        <span className="truncate">{msg.fileName}</span>
                                    </div>
                                )}
                                <div className={`text-[9px] mt-1.5 font-medium ${msg.isMe ? 'text-white/70' : 'text-slate-400'}`}>{msg.timestamp}</div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 bg-white border-t border-slate-200">
                {attachedFile && (
                    <div className="mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Paperclip className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                            <span className="text-xs text-indigo-700 truncate font-medium">{attachedFile.name}</span>
                        </div>
                        <button onClick={() => setAttachedFile(null)} className="p-1 hover:bg-indigo-100 rounded-full transition-colors">
                            <X className="w-4 h-4 text-indigo-500" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3 items-end">
                    <div className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all flex items-end">
                        <div className="flex items-center gap-1.5 px-1 pb-1">
                            <button
                                type="button"
                                onClick={() => document.getElementById('dm-file-upload')?.click()}
                                className="p-2 text-slate-400 hover:bg-white hover:text-indigo-500 rounded-xl transition-all shadow-sm"
                            >
                                <Paperclip className="w-5 h-5" />
                                <input type="file" id="dm-file-upload" className="hidden" onChange={(e) => e.target.files && setAttachedFile(e.target.files[0])} />
                            </button>
                        </div>
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 max-h-32 min-h-[40px] resize-none"
                            rows={1}
                        />
                        <div className="flex items-center gap-1.5 px-1 pb-1">
                            {isRecording ? (
                                <button
                                    type="button"
                                    onClick={stopRecording}
                                    className="p-2 bg-red-500 text-white rounded-xl shadow-lg animate-pulse"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    className="p-2 text-slate-400 hover:bg-white hover:text-indigo-500 rounded-xl transition-all shadow-sm"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !attachedFile) || isSending}
                        className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all h-[48px] w-[48px] flex items-center justify-center flex-shrink-0"
                    >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
