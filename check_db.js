
import { Client, Databases } from 'node-appwrite';

const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "studentcompanion";
const apiKey = "standard_d66bfc5c3bc1326b7053615aca143f3ab06ea319551cb3386c786c1644b2ec67b5b9970830c8f85583da055950b449d2e4702c3f14b2c58178c8d8e3d52f4ce95f58b6ff8e5b82b037eca82b8871b3ff455133750d19d4ad70ad30c681e0008abe228b828306deb8cb1e15824223aaaeb5b07d3347a56d614a16c45008a80ed6";

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

async function checkCollections() {
    try {
        const dbs = await databases.list();
        const dbId = dbs.databases[0].$id;
        console.log(`Database ID: ${dbId}`);

        const cols = await databases.listCollections(dbId);
        console.log("Collections:");
        cols.collections.forEach(c => {
            console.log(`- ${c.name}: ${c.$id}`);
        });
    } catch (e) {
        console.error(e);
    }
}

checkCollections();
