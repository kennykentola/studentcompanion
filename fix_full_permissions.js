
import { Client, Storage, Permission, Role, Databases } from 'node-appwrite';

const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "studentcompanion";
const apiKey = "standard_d66bfc5c3bc1326b7053615aca143f3ab06ea319551cb3386c786c1644b2ec67b5b9970830c8f85583da055950b449d2e4702c3f14b2c58178c8d8e3d52f4ce95f58b6ff8e5b82b037eca82b8871b3ff455133750d19d4ad70ad30c681e0008abe228b828306deb8cb1e15824223aaaeb5b07d3347a56d614a16c45008a80ed6";

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const storage = new Storage(client);
const databases = new Databases(client);

const BUCKET_ID = "studentcompanion";
const DATABASE_ID = "studentcompanion";
const MESSAGES_COL_ID = "69945f67003350f65039";

async function fixPermissions() {
    console.log("Fixing Storage Bucket Permissions...");
    try {
        await storage.updateBucket(
            BUCKET_ID,
            BUCKET_ID,
            [
                Permission.read(Role.any()),
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ],
            true, // fileSecurity
            true, // enabled
            undefined, // maxFileSize
            ["pdf", "doc", "docx", "txt", "jpg", "jpeg", "png"] // allowedExtensions
        );
        console.log("Bucket permissions updated.");
    } catch (e) {
        console.error("Bucket Error:", e.message);
    }

    console.log("\nFixing Messages Collection Permissions...");
    try {
        await databases.updateCollection(
            DATABASE_ID,
            MESSAGES_COL_ID,
            "Messages",
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]
        );
        console.log("Collection permissions updated.");
    } catch (e) {
        console.error("Collection Error:", e.message);
    }
}

fixPermissions();
