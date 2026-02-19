
import https from 'https';

// Extracted from setup_appwrite.js
const API_KEY = 'standard_d66bfc5c3bc1326b7053615aca143f3ab06ea319551cb3386c786c1644b2ec67b5b9970830c8f85583da055950b449d2e4702c3f14b2c58178c8d8e3d52f4ce95f58b6ff8e5b82b037eca82b8871b3ff455133750d19d4ad70ad30c681e0008abe228b828306deb8cb1e15824223aaaeb5b07d3347a56d614a16c45008a80ed6';
const PROJECT_ID = 'studentcompanion';
const DATABASE_ID = 'studentcompanion';
const ENDPOINT_HOST = 'fra.cloud.appwrite.io';

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: ENDPOINT_HOST,
            path: `/v1${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': PROJECT_ID,
                'X-Appwrite-Key': API_KEY
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject({ statusCode: res.statusCode, body: JSON.parse(data) });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function createAttribute(collectionId, key, type, size, required, array = false) {
    console.log(`Creating attribute '${key}'...`);
    try {
        let path = `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/${type}`;
        const body = { key, required, array };
        if (type === 'string') body.size = size;

        await makeRequest('POST', path, body);
        console.log(`Attribute '${key}' created.`);
        await new Promise(r => setTimeout(r, 500)); // Wait for propagation
    } catch (e) {
        if (e.body && e.body.type === 'attribute_already_exists') {
            console.log(`Attribute '${key}' already exists.`);
        } else {
            console.error(`Failed to create attribute '${key}':`, JSON.stringify(e, null, 2));
        }
    }
}

async function main() {
    let profilesCollectionId = 'profiles';

    // 1. Create Collection
    try {
        console.log("Creating 'profiles' collection...");
        const profilesCol = await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
            collectionId: 'profiles', // Correct parameter name
            name: 'profiles',
            permissions: [
                'read("any")',
                'create("users")',
                'read("users")',
                'update("users")',
                'delete("users")'
            ],
            enabled: true
        });
        profilesCollectionId = profilesCol.$id;
        console.log(`Created 'profiles' with ID: ${profilesCollectionId}`);
    } catch (e) {
        if (e.body && (e.body.code === 409 || e.body.type === 'collection_already_exists')) {
            console.log("'profiles' collection already exists. Using ID: profiles");
        } else {
            console.error("Failed to create 'profiles':", JSON.stringify(e, null, 2));
            // Try fallback creation if ID 'profiles' is taken but not by us? Unlikely.
            return;
        }
    }

    // 2. Create Attributes
    if (profilesCollectionId) {
        await createAttribute(profilesCollectionId, 'userId', 'string', 255, true);
        await createAttribute(profilesCollectionId, 'matricNumber', 'string', 50, false);
        await createAttribute(profilesCollectionId, 'nickname', 'string', 50, false);
        await createAttribute(profilesCollectionId, 'department', 'string', 100, false);
        await createAttribute(profilesCollectionId, 'faculty', 'string', 100, false);
        await createAttribute(profilesCollectionId, 'university', 'string', 100, false);
        await createAttribute(profilesCollectionId, 'avatarId', 'string', 255, false);
        await createAttribute(profilesCollectionId, 'bio', 'string', 500, false);
        console.log(`\nSUCCESS: VITE_APPWRITE_PROFILES_COLLECTION_ID=${profilesCollectionId}`);
    }
}

main();
