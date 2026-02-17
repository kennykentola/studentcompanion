
import { Client, Databases, Storage } from 'node-appwrite';

const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "studentcompanion";
const apiKey = "standard_d66bfc5c3bc1326b7053615aca143f3ab06ea319551cb3386c786c1644b2ec67b5b9970830c8f85583da055950b449d2e4702c3f14b2c58178c8d8e3d52f4ce95f58b6ff8e5b82b037eca82b8871b3ff455133750d19d4ad70ad30c681e0008abe228b828306deb8cb1e15824223aaaeb5b07d3347a56d614a16c45008a80ed6";

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

// Env vars from your .env
const DATABASE_ID = "studentcompanion";
const MESSAGES_COL_ID = "69945f67003350f65039";
const BUCKET_ID = "studentcompanion";

async function checkInfrastructure() {
    console.log("Checking Messages Collection Attributes...");
    try {
        const attrs = await databases.listAttributes(DATABASE_ID, MESSAGES_COL_ID);
        attrs.attributes.forEach(a => console.log(`- ${a.key} (${a.type})`));
    } catch (e) {
        console.error("Error checking attributes:", e.message);
    }

    console.log("\nChecking Storage Bucket...");
    try {
        const bucket = await storage.getBucket(BUCKET_ID);
        console.log(`Bucket '${bucket.name}' exists. ID: ${bucket.$id}`);
    } catch (e) {
        console.error("Error checking bucket (might need creation):", e.message);
        // Try creating if not exists
        try {
            await storage.createBucket(BUCKET_ID, BUCKET_ID, ["read(\"any\")", "write(\"users\")"], true, true, undefined, ["pdf", "doc", "docx", "jpg", "png"]);
            console.log("Bucket created!");
        } catch (err) {
            console.error("Could not verify or create bucket:", err.message);
        }
    }
}

checkInfrastructure();
