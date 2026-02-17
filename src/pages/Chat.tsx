import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { databases, storage, APPWRITE_CONFIG, client } from "@/lib/appwrite"; // Helper client export needed? No, can use databases.client or similar if needed, but imported client from lib is best.
import { ID, Query, Permission, Role } from "appwrite";
import { Send, Paperclip, Loader2, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

// Re-export client from appwrite.ts if not already
// Assuming client is exported from "@/lib/appwrite"

interface Message {
    $id: string;
    $createdAt: string;
    body: string;
    userId: string;
    username: string;
    attachments?: string[]; // Array of file IDs
    attachmentNames?: string[];
}

export default function Chat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.MESSAGES_COLLECTION_ID,
                [
                    Query.orderAsc("$createdAt"),
                    Query.limit(100)
                ]
            );
            setMessages(response.documents as unknown as Message[]);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();

        // Real-time subscription
        const unsubscribe = client.subscribe(
            `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.MESSAGES_COLLECTION_ID}.documents`,
            (response: any) => {
                if (response.events.includes("databases.*.collections.*.documents.*.create")) {
                    setMessages((prev) => [...prev, response.payload as Message]);
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && attachments.length === 0) || !user) return;

        setSending(true);
        try {
            let attachmentIds: string[] = [];

            // Upload attachments
            if (attachments.length > 0) {
                const uploadPromises = attachments.map(async (file) => {
                    const response = await storage.createFile(
                        APPWRITE_CONFIG.BUCKET_ID,
                        ID.unique(),
                        file
                    );
                    return response.$id;
                });
                attachmentIds = await Promise.all(uploadPromises);
            }

            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.MESSAGES_COLLECTION_ID,
                ID.unique(),
                {
                    body: newMessage,
                    userId: user.$id,
                    username: user.name,
                    attachments: attachmentIds,
                    attachmentNames: attachments.map(f => f.name),
                },
                [
                    Permission.read(Role.any()), // Public chat
                ]
            );

            setNewMessage("");
            setAttachments([]);
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachments(Array.from(e.target.files));
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Student Chat</h1>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b py-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Global Room
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground mt-10">
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = msg.userId === user?.$id;
                            return (
                                <div key={msg.$id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                                    <div className={`
                                max-w-[80%] rounded-lg p-3 
                                ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}
                            `}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold opacity-80">{msg.username}</span>
                                            <span className="text-[10px] opacity-60">
                                                {format(new Date(msg.$createdAt), "h:mm a")}
                                            </span>
                                        </div>
                                        <p className="text-sm dark:text-gray-100">{msg.body}</p>

                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {msg.attachments.map((fileId, index) => (
                                                    <a
                                                        key={fileId}
                                                        href={storage.getFileDownload(APPWRITE_CONFIG.BUCKET_ID, fileId).toString()}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 bg-background/20 p-2 rounded text-xs hover:bg-background/30 transition-colors"
                                                    >
                                                        <File className="h-4 w-4" />
                                                        <span className="truncate max-w-[150px]">{msg.attachmentNames?.[index] || "Attachment"}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                <div className="p-4 border-t bg-background">
                    {attachments.length > 0 && (
                        <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                            {attachments.map((file, i) => (
                                <div key={i} className="relative bg-muted p-2 rounded-md flex items-center gap-2 text-xs border">
                                    <span className="max-w-[100px] truncate">{file.name}</span>
                                    <button onClick={() => removeAttachment(i)} className="hover:text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={sending}
                        >
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </Button>

                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1"
                            disabled={sending}
                        />
                        <Button type="submit" disabled={sending || (!newMessage.trim() && attachments.length === 0)}>
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
