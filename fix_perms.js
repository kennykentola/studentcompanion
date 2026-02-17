
import { Client, Databases, Permission, Role } from 'node-appwrite';

const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "studentcompanion";
const apiKey = "standard_d66bfc5c3bc1326b7053615aca143f3ab06ea319551cb3386c786c1644b2ec67b5b9970830c8f85583da055950b449d2e4702c3f14b2c58178c8d8e3d52f4ce95f58b6ff8e5b82b037eca82b8871b3ff455133750d19d4ad70ad30c681e0008abe228b828306deb8cb1e15824223aaaeb5b07d3347a56d614a16c45008a80ed6";

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

// Correct ID from check_db.js
const NOTIFICATIONS_COLLECTION_ID = "69946b57001500470d49";

async function fixPermissions() {
    try {
        const dbs = await databases.list();
        const dbId = dbs.databases[0].$id;

        console.log(`Fixing permissions for: ${NOTIFICATIONS_COLLECTION_ID}`);

        await databases.updateCollection(
            dbId,
            NOTIFICATIONS_COLLECTION_ID,
            "Notifications",
            [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]
        );
        console.log("Permissions updated successfully.");

    } catch (e) {
        console.error("Failed to update permissions:", e);
    }
}

fixPermissions();
