export interface User {
    $id: string;
    name: string;
    email: string;
    level: number; // For gamification
}

export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}
// Forced Update

export interface Task {
    $id: string; // Appwrite ID
    id: string; // For UI compatibility (will map to $id)
    title: string;
    course: string; // Will map to 'category' from Appwrite for now
    dueDate: string;
    status: 'pending' | 'completed' | 'in-progress';
    priority: 'high' | 'medium' | 'low';
    description?: string; // Appwrite 'content'
    notes?: string; // New field (will be local or mocked for now)
    reminders?: string[]; // New field
    subtasks?: SubTask[]; // New field
    estimatedTime?: string; // New field
    attachments?: any[]; // New field
}

export interface ChatMessage {
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    isMe: boolean;
    attachments?: {
        id: string;
        name: string;
        type: string;
        size: number;
        url: string;
    }[];
    audioUrl?: string; // For voice notes
    userId?: string;
}

export interface HelpAnswer {
    id: string;
    author: string;
    authorLevel: number;
    content: string;
    timestamp: string;
    votes: number;
}

export interface HelpQuestion {
    id: string;
    title: string;
    content: string;
    courseId: string;
    author: string;
    timestamp: string;
    resolved: boolean;
    answers: HelpAnswer[];
}

