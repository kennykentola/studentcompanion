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
};
