import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID;

const collections = [
    {
        id: 'courses',
        name: 'Courses',
        attributes: [
            { key: 'code', type: 'string', required: true, size: 20 },
            { key: 'title', type: 'string', required: true, size: 255 },
            { key: 'units', type: 'integer', required: true },
            { key: 'department', type: 'string', required: false, size: 255 },
            { key: 'semester', type: 'string', required: false, size: 20 },
        ]
    },
    {
        id: 'registrations',
        name: 'Registrations',
        attributes: [
            { key: 'userId', type: 'string', required: true, size: 255 },
            { key: 'courseId', type: 'string', required: true, size: 255 },
            { key: 'semester', type: 'string', required: false, size: 20 },
        ]
    },
    {
        id: 'buildings',
        name: 'Buildings',
        attributes: [
            { key: 'name', type: 'string', required: true, size: 255 },
            { key: 'code', type: 'string', required: true, size: 50 },
        ]
    },
    {
        id: 'departments',
        name: 'Departments',
        attributes: [
            { key: 'name', type: 'string', required: true, size: 255 },
            { key: 'buildingId', type: 'string', required: false, size: 255 },
        ]
    },
    {
        id: 'rooms',
        name: 'Rooms',
        attributes: [
            { key: 'name', type: 'string', required: true, size: 255 },
            { key: 'buildingId', type: 'string', required: true, size: 255 },
            { key: 'type', type: 'string', required: false, size: 50 },
        ]
    },
    {
        id: 'pathways',
        name: 'Pathways',
        attributes: [
            { key: 'title', type: 'string', required: true, size: 255 },
            { key: 'description', type: 'string', required: true, size: 1000 },
            { key: 'startLocation', type: 'string', required: false, size: 255 },
            { key: 'endLocation', type: 'string', required: false, size: 255 },
        ]
    },
    {
        id: 'issue_reports',
        name: 'Issue Reports',
        attributes: [
            { key: 'userId', type: 'string', required: true, size: 255 },
            { key: 'title', type: 'string', required: true, size: 255 },
            { key: 'description', type: 'string', required: true, size: 5000 },
            { key: 'status', type: 'string', required: false, size: 50, default: 'pending' },
        ]
    }
];

async function createCollections() {
    for (const coll of collections) {
        try {
            // Check if exists
            await databases.getCollection(DB_ID, coll.id);
            console.log(`Collection ${coll.name} already exists.`);
        } catch (e) {
            if (e.code === 404) {
                console.log(`Creating collection ${coll.name}...`);
                const created = await databases.createCollection(DB_ID, coll.id, coll.name);
                
                for (const attr of coll.attributes) {
                    try {
                        if (attr.type === 'string') {
                            await databases.createStringAttribute(DB_ID, coll.id, attr.key, attr.size, attr.required, attr.default);
                        } else if (attr.type === 'integer') {
                            await databases.createIntegerAttribute(DB_ID, coll.id, attr.key, attr.required);
                        }
                        console.log(` - Created attribute ${attr.key}`);
                        // Wait slightly to let attribute build
                        await new Promise(r => setTimeout(r, 2000));
                    } catch (attrError) {
                        console.error(`Failed to create attribute ${attr.key}:`, attrError.message);
                    }
                }
                console.log(`Collection ${coll.name} created successfully.\n`);
            } else {
                console.error(`Error checking collection ${coll.name}:`, e.message);
            }
        }
    }
}

createCollections();
