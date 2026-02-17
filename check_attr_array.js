
import { Client, Databases } from 'node-appwrite';

const endpoint = "https://fra.cloud.appwrite.io/v1";
// ... (same config)
const projectId = "studentcompanion";
const apiKey = "standard_d66bfc5c3bc1326b7053615aca143f3ab06ea319551cb3386c786c1644b2ec67b5b9970830c8f85583da055950b449d2e4702c3f14b2c58178c8d8e3d52f4ce95f58b6ff8e5b82b037eca82b8871b3ff455133750d19d4ad70ad30c681e0008abe228b828306deb8cb1e15824223aaaeb5b07d3347a56d614a16c45008a80ed6";

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

const DATABASE_ID = "studentcompanion";
const MESSAGES_COL_ID = "69945f67003350f65039";

async function checkAttributes() {
    console.log("Checking Messages Collection Attributes Detail...");
    try {
        const attrs = await databases.listAttributes(DATABASE_ID, MESSAGES_COL_ID);
        attrs.attributes.forEach(a => {
            console.log(`- ${a.key}: type=${a.type}, array=${a.array}`);
        });
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkAttributes();
