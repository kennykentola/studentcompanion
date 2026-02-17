
import { Client, Databases, ID, Permission, Role } from 'node-appwrite';

const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "studentcompanion";
const apiKey = "standard_d66bfc5c3bc1326b7053615aca143f3ab06ea319551cb3386c786c1644b2ec67b5b9970830c8f85583da055950b449d2e4702c3f14b2c58178c8d8e3d52f4ce95f58b6ff8e5b82b037eca82b8871b3ff455133750d19d4ad70ad30c681e0008abe228b828306deb8cb1e15824223aaaeb5b07d3347a56d614a16c45008a80ed6";

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

const TASKS_COLLECTION_NAME = "Tasks";
const NOTIFICATIONS_COLLECTION_NAME = "Notifications";

async function setupDatabase() {
    try {
        console.log("Checks started...");
        const dbs = await databases.list();
        if (dbs.total === 0) { console.log("No DB found"); return; }
        const dbId = dbs.databases[0].$id;
        console.log(`Using database: ${dbId}`);

        // --- NOTIFICATIONS COLLECTION ---
        console.log("Checking Notifications Collection...");
        const cols = await databases.listCollections(dbId);
        let notifCollection = cols.collections.find(c => c.name === NOTIFICATIONS_COLLECTION_NAME);
        let notifCollectionId = notifCollection?.$id;

        if (!notifCollection) {
            const col = await databases.createCollection(dbId, ID.unique(), NOTIFICATIONS_COLLECTION_NAME);
            notifCollectionId = col.$id;
            console.log(`Created Notifications collection: ${notifCollectionId}`);
        } else {
            console.log(`Using existing Notifications collection: ${notifCollectionId}`);
        }

        // Add attributes for Notifications
        console.log("Adding attributes for Notifications...");
        try { await databases.createStringAttribute(dbId, notifCollectionId, "message", 255, true); } catch (e) { }
        try { await databases.createBooleanAttribute(dbId, notifCollectionId, "isRead", true); } catch (e) { }
        try { await databases.createStringAttribute(dbId, notifCollectionId, "userId", 255, true); } catch (e) { }
        try { await databases.createStringAttribute(dbId, notifCollectionId, "type", 50, false, "info"); } catch (e) { } // info, warning, success

        console.log("Setup complete.");
        console.log(`NOTIFICATIONS_COLLECTION_ID: ${notifCollectionId}`);

    } catch (error) {
        console.error("Setup failed:", error);
    }
}

setupDatabase();
