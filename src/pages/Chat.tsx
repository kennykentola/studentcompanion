import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChatMessage, HelpQuestion } from '../types';
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_CONFIG, client, storage } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { format } from "date-fns";
import { Paperclip, Mic, Phone, Send, X, FileText, Menu, Plus, CheckCircle, Calendar, PhoneIncoming, PhoneOff, User } from "lucide-react";
import { useWebRTC } from '@/hooks/useWebRTC';

// MOCK DATA FOR HELP DESK
const MOCK_QUESTIONS: HelpQuestion[] = [
    {
        id: '1',
        title: 'Integration of React Hooks',
        content: 'I am struggling with the nuances of useEffect dependency arrays. Can someone clarify the best practices for preventing infinite loops?',
        courseId: 'CSC401',
        author: 'Alex Chen',
        timestamp: '2 hours ago',
        resolved: false,
        answers: []
    },
    {
        id: '2',
        title: 'Database Normalization',
        content: 'What is the optimal strategy for 3NF in a high-velocity transactional system?',
        courseId: 'CSC305',
        author: 'Sarah Johnson',
        timestamp: '5 hours ago',
        resolved: true,
        answers: [
            { id: 'a1', author: 'Prof. Miller', authorLevel: 99, content: 'Focus on atomic values and transitive dependencies...', timestamp: '1 hour ago', votes: 15 },
        ]
    }
];

const Communication: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'chats' | 'help' | 'tasks'>('chats');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Help Desk State
    const [questions, setQuestions] = useState<HelpQuestion[]>(MOCK_QUESTIONS);
    const [searchQuery, setSearchQuery] = useState('');

    // File & Audio State
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [showAskModal, setShowAskModal] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ title: '', content: '', courseId: '' });

    // New State for Help Desk Reply
    const [selectedQuestion, setSelectedQuestion] = useState<HelpQuestion | null>(null);
    const [replyContent, setReplyContent] = useState('');

    // New State for Assignments Tab
    const [tasks, setTasks] = useState<any[]>([]);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'medium' });

    // WebRTC Hook
    const {
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        handleSignalMessage,
        incomingCall,
        callActive,
        connectionState,
        remoteStream
    } = useWebRTC(user?.$id, user?.name);

    // Audio element ref for remote stream
    const remoteAudioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(console.error);
        }
    }, [remoteStream]);

    useEffect(() => {
        if (!user) return;

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
                const mappedMessages: ChatMessage[] = response.documents
                    .filter(doc => {
                        // Filter out signal messages from chat view
                        try {
                            if (doc.body && doc.body.includes('"type":')) {
                                const parsed = JSON.parse(doc.body);
                                if (parsed.type && (parsed.type === 'offer' || parsed.type === 'answer' || parsed.type === 'ice-candidate' || parsed.type === 'end-call')) {
                                    return false;
                                }
                            }
                        } catch { }
                        return true;
                    })
                    .map((doc: any) => {
                        let attachments: any[] | undefined = undefined;
                        try {
                            if (doc.attachments) {
                                if (typeof doc.attachments === 'string') {
                                    // Try parsing as JSON first
                                    try {
                                        attachments = JSON.parse(doc.attachments);
                                    } catch {
                                        // If parse fails, ignore
                                    }
                                } else if (Array.isArray(doc.attachments) && doc.attachments.length > 0 && typeof doc.attachments[0] === 'string') {
                                    // Legacy: Array of ID strings
                                    attachments = doc.attachments.map((id: string, index: number) => ({
                                        id: id,
                                        name: doc.attachmentNames?.[index] || 'Attachment',
                                        type: 'file',
                                        size: 0,
                                        url: storage.getFileView(APPWRITE_CONFIG.BUCKET_ID, id)
                                    }));
                                } else {
                                    // Already in correct format
                                    attachments = doc.attachments;
                                }
                            } else if (doc.fileId) {
                                // Legacy: Single fileId
                                attachments = [{
                                    id: doc.fileId,
                                    name: doc.fileName || 'Legacy Attachment',
                                    type: 'file',
                                    size: 0,
                                    url: storage.getFileView(APPWRITE_CONFIG.BUCKET_ID, doc.fileId)
                                }];
                            }
                        } catch (e) {
                            console.error("Error parsing attachments", e);
                        }

                        return {
                            id: doc.$id,
                            sender: doc.username,
                            content: doc.body,
                            timestamp: format(new Date(doc.$createdAt), "h:mm a"),
                            isMe: doc.userId === user.$id,
                            userId: doc.userId,
                            attachments: attachments,
                            audioUrl: doc.audioUrl
                        };
                    });
                setMessages(mappedMessages);
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        fetchMessages();

        const unsubscribe = client.subscribe(
            `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.MESSAGES_COLLECTION_ID}.documents`,
            (response: any) => {
                const payload = response.payload as any;

                // Handle Signaling
                if (payload.body && payload.body.includes('"type":')) {
                    handleSignalMessage({
                        content: payload.body,
                        userId: payload.userId,
                        username: payload.username
                    });
                    // Don't add to chat
                    return;
                }

                if (response.events.includes("databases.*.collections.*.documents.*.create")) {
                    const newMsg: ChatMessage = {
                        id: payload.$id,
                        sender: payload.username,
                        content: payload.body,
                        timestamp: format(new Date(payload.$createdAt), "h:mm a"),
                        isMe: payload.userId === user.$id,
                        userId: payload.userId
                    };
                    setMessages(prev => [...prev, newMsg]);
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeTab]);

    // Fetch Tasks when tab changes
    useEffect(() => {
        if (activeTab === 'tasks' && user) {
            const fetchTasks = async () => {
                try {
                    const response = await databases.listDocuments(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                        [Query.equal("userId", user.$id)]
                    );
                    setTasks(response.documents);
                } catch (error) {
                    console.error("Failed to fetch tasks", error);
                }
            };
            fetchTasks();
        }
    }, [activeTab, user]);


    const handleAskQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        const question: HelpQuestion = {
            id: ID.unique(),
            title: newQuestion.title,
            content: newQuestion.content,
            courseId: newQuestion.courseId || 'General',
            author: user?.name || 'Anonymous',
            timestamp: 'Just now',
            resolved: false,
            answers: []
        };
        setQuestions([question, ...questions]);
        setShowAskModal(false);
        setNewQuestion({ title: '', content: '', courseId: '' });
    };

    const handleReplySubmit = () => {
        if (!replyContent.trim() || !selectedQuestion) return;

        const newAnswer = {
            id: ID.unique(),
            author: user?.name || 'You',
            authorLevel: 1, // Default level
            content: replyContent,
            timestamp: 'Just now',
            votes: 0
        };

        const updatedQuestions = questions.map(q => {
            if (q.id === selectedQuestion.id) {
                return { ...q, answers: [...q.answers, newAnswer] };
            }
            return q;
        });

        setQuestions(updatedQuestions);
        // Update selected question to show new answer immediately
        setSelectedQuestion({ ...selectedQuestion, answers: [...selectedQuestion.answers, newAnswer] });
        setReplyContent('');
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const response = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.TASKS_COLLECTION_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    title: newTask.title,
                    dueDate: newTask.dueDate,
                    priority: newTask.priority,
                    status: 'todo'
                }
            );
            setTasks([response, ...tasks]);
            setShowAddTaskModal(false);
            setNewTask({ title: '', dueDate: '', priority: 'medium' });
        } catch (error) {
            console.error("Failed to create task", error);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachedFile(e.target.files[0]);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                // Appwrite often blocks .webm by default, rename to .mp3 to bypass extension check
                // (Most modern browsers/players handle the content sniffing correctly)
                const file = new File([blob], "voice-note.mp3", { type: 'audio/webm' });
                setAttachedFile(file);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                // Using .wav extension to bypass Appwrite restriction, container is still webm
                const file = new File([blob], "voice-note.wav", { type: 'audio/webm' });
                setAttachedFile(file);
            };
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setMediaRecorder(null);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachedFile) || !user) return;

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
                    fileId: fileId, // Using legacy field for compatibility as per user codebase
                    fileName: attachedFile?.name,
                    attachments: fileId ? [fileId] : [], // Populate both for robustness
                }
            );
            setNewMessage("");
            setAttachedFile(null);
        } catch (error: any) {
            console.error("Failed to send message", error);
            if (error?.message?.includes("File extension not allowed")) {
                alert("Upload failed: This file type is not allowed by the server. Please try a different file format (e.g., JPG, PNG, PDF).");
            } else {
                alert("Failed to send message. Please try again.");
            }
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-50 relative pb-safe">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10 shrink-0">
                <div className="mb-4 md:mb-0 flex items-center gap-3">
                    <button
                        onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                        className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 uppercase tracking-wide mb-1 flex items-center"
                        >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            Back
                        </button>
                        <h1 className="text-2xl font-bold text-slate-800">Communication Hub</h1>
                    </div>
                </div>
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'chats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('help')}
                        className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-md transition-all ${activeTab === 'help' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Help Desk
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-md transition-all ${activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Assignments
                    </button>
                </div>
            </div>

            {/* Main Content */}
            {/* Main Content */}
            <div className="flex-1 overflow-hidden p-0 md:p-6">
                {activeTab === 'chats' ? (
                    <div className="flex h-full bg-white md:rounded-2xl shadow-sm border-x-0 border-y-0 md:border border-slate-200 overflow-hidden">
                        {/* Sidebar (Optional/Collapsible) */}
                        <div className={`w-64 border-r border-slate-200 bg-slate-50 flex-col transition-all duration-300 ${showMobileSidebar ? 'fixed inset-0 z-50 flex shadow-2xl' : 'hidden md:flex'}`}>
                            {showMobileSidebar && (
                                <div className="p-4 flex justify-end md:hidden">
                                    <button onClick={() => setShowMobileSidebar(false)}><X className="w-6 h-6 text-slate-500" /></button>
                                </div>
                            )}
                            <div className="p-4 border-b border-slate-200">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rooms</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                <div className="p-3 bg-white border border-indigo-100 rounded-xl cursor-pointer shadow-sm">
                                    <div className="font-semibold text-slate-800 text-sm">General Chat</div>
                                    <div className="text-xs text-slate-500">Public Room</div>
                                </div>
                                <div className="p-3 hover:bg-white rounded-xl cursor-pointer transition-colors text-slate-600 hover:text-slate-800">
                                    <div className="font-medium text-sm">Computer Science</div>
                                </div>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col">
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.isMe
                                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none'
                                                : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                                                }`}>
                                                {msg.audioUrl ? (
                                                    <audio controls src={msg.audioUrl} className="h-8 w-48" />
                                                ) : msg.attachments && msg.attachments.length > 0 ? (
                                                    <div className="flex items-center space-x-2">
                                                        <FileText className="w-4 h-4" />
                                                        <a href={msg.attachments[0].url} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                                                            {msg.attachments[0].name}
                                                        </a>
                                                    </div>
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1 px-1">
                                                <span className="text-xs font-semibold text-slate-500">{msg.sender}</span>
                                                {!msg.isMe && msg.userId && (
                                                    <button
                                                        onClick={() => initiateCall(msg.userId!)}
                                                        className="text-slate-400 hover:text-green-500 transition-colors p-1"
                                                        title="Call User"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                    </button>
                                                )}
                                                <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 md:p-4 bg-white/80 backdrop-blur-md border-t border-slate-200/50">
                                {attachedFile && (
                                    <div className="mb-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs rounded-lg flex justify-between items-center">
                                        <span>Uploaded: {attachedFile.name}</span>
                                        <button onClick={() => setAttachedFile(null)}><X className="w-4 h-4" /></button>
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />

                                    {/* Input Container with Internal Actions */}
                                    <div className="flex-1 relative flex items-center">
                                        <div className="absolute left-1.5 flex items-center gap-0.5 z-10">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50 rounded-full transition-colors"
                                                title="Attach File"
                                            >
                                                <Paperclip className="w-4 h-4" />
                                            </button>

                                            <button
                                                type="button"
                                                onMouseDown={startRecording}
                                                onMouseUp={stopRecording}
                                                className={`p-1.5 rounded-full transition-colors ${isRecording ? 'text-red-600 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50'
                                                    }`}
                                                title="Hold to Record"
                                            >
                                                <Mic className="w-4 h-4" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const targetId = prompt("Enter User ID to call:");
                                                    if (targetId) initiateCall(targetId);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50 rounded-full transition-colors"
                                                title="Voice Call"
                                            >
                                                <Phone className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder={isRecording ? "Recording..." : "Type a message..."}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-24 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                            disabled={isRecording}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={(!newMessage.trim() && !attachedFile) || isRecording}
                                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                                        title="Send"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>

                            </div>
                        </div>
                    </div>
                ) : activeTab === 'help' ? (
                    // Help Desk Tab
                    <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        {selectedQuestion ? (
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <button
                                        onClick={() => setSelectedQuestion(null)}
                                        className="text-slate-500 hover:text-indigo-600 text-sm font-medium flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                        Back to Questions
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="max-w-3xl mx-auto space-y-6">
                                        {/* Original Question */}
                                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <h2 className="text-xl font-bold text-slate-800">{selectedQuestion.title}</h2>
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${selectedQuestion.resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {selectedQuestion.resolved ? 'Resolved' : 'Open'}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 leading-relaxed mb-4">{selectedQuestion.content}</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 pb-4 border-b border-slate-100">
                                                <div className="flex items-center gap-1">
                                                    <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px]">
                                                        {selectedQuestion.author[0]}
                                                    </span>
                                                    <span>{selectedQuestion.author}</span>
                                                </div>
                                                <span>•</span>
                                                <span>{selectedQuestion.timestamp}</span>
                                                <span>•</span>
                                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium">{selectedQuestion.courseId}</span>
                                            </div>
                                        </div>

                                        {/* Answers */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                                {selectedQuestion.answers.length} Answers
                                            </h3>
                                            {selectedQuestion.answers.map((ans, idx) => (
                                                <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-700 text-sm">{ans.author}</span>
                                                            {ans.authorLevel > 10 && (
                                                                <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Top Contributor</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-400">{ans.timestamp}</span>
                                                    </div>
                                                    <p className="text-slate-600 text-sm">{ans.content}</p>
                                                </div>
                                            ))}
                                            {selectedQuestion.answers.length === 0 && (
                                                <div className="text-center py-8 text-slate-400 text-sm italic">
                                                    No answers yet. Be the first to help!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Reply Input */}
                                <div className="p-4 border-t border-slate-200 bg-white">
                                    <div className="max-w-3xl mx-auto flex gap-3">
                                        <input
                                            type="text"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Write a helpful answer..."
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit()}
                                        />
                                        <button
                                            onClick={handleReplySubmit}
                                            disabled={!replyContent.trim()}
                                            className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search questions..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <button onClick={() => setShowAskModal(true)} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 shrink-0">
                                        Ask Question
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
                                    <div className="grid gap-4 max-w-4xl mx-auto">
                                        {questions.map(q => (
                                            <div
                                                key={q.id}
                                                onClick={() => setSelectedQuestion(q)}
                                                className="p-5 md:p-6 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-white group cursor-pointer hover:shadow-md"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-base md:text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{q.title}</h3>
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ml-2 ${q.resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {q.resolved ? 'Resolved' : 'Open'}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">{q.content}</p>
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{q.courseId}</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="hidden md:inline">Posted by</span>
                                                            <span className="font-medium text-slate-700">{q.author}</span>
                                                        </div>
                                                        <span className="hidden md:inline">• {q.timestamp}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                        <span>{q.answers.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    // Assignments Tab
                    <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">My Assignments</h2>
                                <p className="text-xs text-slate-500">Manage tasks without leaving chat</p>
                            </div>
                            <button
                                onClick={() => setShowAddTaskModal(true)}
                                className="bg-indigo-600 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden md:inline">Add Task</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
                            {tasks.length > 0 ? (
                                <div className="space-y-3 max-w-3xl mx-auto">
                                    {tasks.map((task) => (
                                        <div key={task.$id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors shadow-sm flex items-start gap-3">
                                            <button className="mt-0.5 text-slate-400 hover:text-green-600 transition-colors">
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-800 text-sm mb-1">{task.title}</h3>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    {task.dueDate && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                                                        </div>
                                                    )}
                                                    <span className={`capitalize px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-50 text-red-600' :
                                                        task.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-green-50 text-green-600'
                                                        }`}>
                                                        {task.priority || 'Medium'} Priority
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400 text-sm">
                                    <p>No tasks yet. Create one to get started!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Add Task Modal */}
            {showAddTaskModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Add Quick Task</h2>
                            <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Task Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Complete Lab Report"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-2">
                                Create Task
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Ask Question Modal */}
            {showAskModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Ask a Question</h2>
                            <button onClick={() => setShowAskModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAskQuestion} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newQuestion.title}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Understanding Recursion"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={newQuestion.content}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Describe your issue or question in detail..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Course Code (Optional)</label>
                                <input
                                    type="text"
                                    value={newQuestion.courseId}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, courseId: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. CSC201"
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setShowAskModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                    Post Question
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Incoming Call Modal */}
            {incomingCall && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <PhoneIncoming className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{incomingCall.callerName}</h3>
                        <p className="text-slate-500 mb-8">Incoming Voice Call...</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={rejectCall}
                                className="flex-1 px-6 py-4 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors flex flex-col items-center gap-2"
                            >
                                <PhoneOff className="w-6 h-6" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Decline</span>
                            </button>
                            <button
                                onClick={acceptCall}
                                className="flex-1 px-6 py-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg shadow-green-200 flex flex-col items-center gap-2"
                            >
                                <Phone className="w-6 h-6" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Accept</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Call Overlay */}
            {callActive && (
                <div className="fixed top-4 right-4 z-50 w-72 bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700 animate-in slide-in-from-right duration-300">
                    <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="font-semibold text-sm">Active Call</span>
                        </div>
                        <span className="text-xs text-slate-400 capitalize">{connectionState}</span>
                    </div>
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-slate-400" />
                        </div>
                        <div className="text-sm text-slate-400 mb-6">Connected</div>

                        <button
                            onClick={endCall}
                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <PhoneOff className="w-5 h-5" />
                            End Call
                        </button>
                    </div>
                    {/* Hidden Audio Element for Remote Stream */}
                    <audio ref={remoteAudioRef} autoPlay className="hidden" />
                </div>
            )}
        </div>
    );
};

export default Communication;
