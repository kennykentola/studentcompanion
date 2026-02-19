export interface User {
    $id: string;
    name: string;
    email: string;
    prefs?: {
        avatar?: string;
        profileId?: string;
    };
}

export interface UserProfile {
    $id?: string;
    userId: string;
    matricNumber?: string;
    nickname?: string;
    department?: string;
    faculty?: string;
    university?: string;
    avatarId?: string;
    bio?: string;
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
    $id?: string;
    id: string; // Map $id to id for UI
    questionId: string;
    author: string;
    authorLevel: number;
    content: string;
    timestamp?: string; // $createdAt
    votes: number;
    userId: string;
}

export interface HelpQuestion {
    $id?: string;
    id: string; // Map $id to id
    title: string;
    content: string;
    courseId: string;
    author: string;
    timestamp?: string; // $createdAt
    resolved: boolean;
    answers?: HelpAnswer[]; // Virtual field, fetched separately
    userId: string;
}

