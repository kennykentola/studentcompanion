import { Client, Account, Databases, Storage, Avatars } from 'appwrite';

export const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

export const APPWRITE_CONFIG = {
    DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
    TASKS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID || '',
    GRADES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_GRADES_COLLECTION_ID || '',
    MESSAGES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID || '',
    BUCKET_ID: import.meta.env.VITE_APPWRITE_BUCKET_ID || '',
    SCHEDULES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_SCHEDULES_COLLECTION_ID || '',
    NOTIFICATIONS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || '',
    HELP_QUESTIONS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_HELP_QUESTIONS_COLLECTION_ID || '',
    HELP_ANSWERS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_HELP_ANSWERS_COLLECTION_ID || '',
    PROFILES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || 'profiles',
    FLASHCARDS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_FLASHCARDS_COLLECTION_ID || '',
    RESOURCES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_RESOURCES_COLLECTION_ID || '',
    STUDY_ROOMS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_STUDY_ROOMS_COLLECTION_ID || '',
    COURSE_REVIEWS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_COURSE_REVIEWS_COLLECTION_ID || '',
    BUDGET_ENTRIES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_BUDGET_ENTRIES_COLLECTION_ID || '',
    COURSES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_COURSES_COLLECTION_ID || 'courses',
    REGISTRATIONS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_REGISTRATIONS_COLLECTION_ID || 'registrations',
    BUILDINGS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_BUILDINGS_COLLECTION_ID || 'buildings',
    DEPARTMENTS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_DEPARTMENTS_COLLECTION_ID || 'departments',
    ROOMS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_ROOMS_COLLECTION_ID || 'rooms',
    PATHWAYS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_PATHWAYS_COLLECTION_ID || 'pathways',
    ISSUE_REPORTS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_ISSUE_REPORTS_COLLECTION_ID || 'issue_reports',
};
