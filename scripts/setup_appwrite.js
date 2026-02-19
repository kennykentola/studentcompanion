
import https from 'https';

const PROJECT_ID = 'studentcompanion';
const DATABASE_ID = 'studentcompanion';
const API_KEY = 'standard_d66bfc5c3bc1326b7053615aca143f3ab06ea319551cb3386c786c1644b2ec67b5b9970830c8f85583da055950b449d2e4702c3f14b2c58178c8d8e3d52f4ce95f58b6ff8e5b82b037eca82b8871b3ff455133750d19d4ad70ad30c681e0008abe228b828306deb8cb1e15824223aaaeb5b07d3347a56d614a16c45008a80ed6'; // Hardcoded for this run only
const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';

async function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': PROJECT_ID,
                'X-Appwrite-Key': API_KEY
            }
        };

        const req = https.request(`${ENDPOINT}${path}`, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject({ statusCode: res.statusCode, body: JSON.parse(data) });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function createAttribute(collectionId, key, type, size, required, array = false) {
    console.log(`Creating attribute ${key} for ${collectionId}...`);
    try {
        let path = `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/${type}`;
        const body = { key, required, array };
        if (type === 'string') body.size = size;

        await makeRequest('POST', path, body);
        console.log(`Attribute ${key} created.`);
        await new Promise(r => setTimeout(r, 500));
    } catch (e) {
        if (e.body && e.body.type === 'attribute_already_exists') {
            console.log(`Attribute ${key} already exists. Skipping.`);
        } else {
            console.error(`Failed to create attribute ${key}:`, JSON.stringify(e, null, 2));
        }
    }
}

async function main() {
    // 1. Create help_questions
    let questionsCollectionId;
    let answersCollectionId;

    try {
        console.log("Creating 'help_questions' collection...");
        // removed 'enabled: true'
        const qCol = await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
            collectionId: 'help_questions',
            name: 'help_questions',
            permissions: []
        });
        questionsCollectionId = qCol.$id;
        console.log(`Created 'help_questions' with ID: ${questionsCollectionId}`);
    } catch (e) {
        if (e.body && e.body.code === 409) {
            console.log("'help_questions' collection already exists. Using ID: help_questions");
            questionsCollectionId = 'help_questions';
        } else {
            console.error("Failed to create 'help_questions':", JSON.stringify(e, null, 2));
        }
    }

    // Attributes for questions
    if (questionsCollectionId) {
        await createAttribute(questionsCollectionId, 'title', 'string', 255, true);
        await createAttribute(questionsCollectionId, 'content', 'string', 5000, true);
        await createAttribute(questionsCollectionId, 'courseId', 'string', 100, true);
        await createAttribute(questionsCollectionId, 'author', 'string', 255, true);
        await createAttribute(questionsCollectionId, 'userId', 'string', 255, true);
        await createAttribute(questionsCollectionId, 'resolved', 'boolean', undefined, false);
    }


    // 2. Create help_answers
    try {
        console.log("Creating 'help_answers' collection...");
        const aCol = await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
            collectionId: 'help_answers',
            name: 'help_answers',
            permissions: []
        });
        answersCollectionId = aCol.$id;
        console.log(`Created 'help_answers' with ID: ${answersCollectionId}`);
    } catch (e) {
        if (e.body && e.body.code === 409) {
            console.log("'help_answers' collection already exists. Using ID: help_answers");
            answersCollectionId = 'help_answers';
        } else {
            console.error("Failed to create 'help_answers':", JSON.stringify(e, null, 2));
        }
    }

    // 3. Create 'profiles' collection
    let profilesCollectionId;
    try {
        console.log("Checking 'profiles' collection...");
        // Use a consistent ID for the profiles collection
        const profilesCol = await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
            documentId: 'profiles',
            name: 'profiles',
            permissions: [], // We'll rely on collection logic or update later if needed
            enabled: true
        });
        profilesCollectionId = profilesCol.$id;
        console.log(`Created 'profiles' with ID: ${profilesCollectionId}`);
    } catch (e) {
        if (e.body && e.body.code === 409) {
            console.log("'profiles' collection already exists. Using ID: profiles");
            profilesCollectionId = 'profiles';
        } else {
            // Fallback if we can't create it with specific ID (rare but possible)
            try {
                const profilesCol = await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
                    name: 'profiles',
                    permissions: [],
                    enabled: true
                });
                profilesCollectionId = profilesCol.$id;
                console.log(`Created 'profiles' with generated ID: ${profilesCollectionId}`);
            } catch (err) {
                console.error("Failed to create 'profiles':", JSON.stringify(err, null, 2));
            }
        }
    }

    if (profilesCollectionId) {
        // Create attributes for profiles
        await createAttribute(profilesCollectionId, 'userId', 'string', 255, true);
        await createAttribute(profilesCollectionId, 'matricNumber', 'string', 50, false);
        await createAttribute(profilesCollectionId, 'nickname', 'string', 50, false);
        await createAttribute(profilesCollectionId, 'department', 'string', 100, false);
        await createAttribute(profilesCollectionId, 'faculty', 'string', 100, false);
        await createAttribute(profilesCollectionId, 'university', 'string', 100, false);
        await createAttribute(profilesCollectionId, 'avatarId', 'string', 255, false); // File ID from storage
        await createAttribute(profilesCollectionId, 'bio', 'string', 500, false);
        console.log(`VITE_APPWRITE_PROFILES_COLLECTION_ID=${profilesCollectionId}`);
    }

    // Attributes for answers
    if (answersCollectionId) {
        await createAttribute(answersCollectionId, 'questionId', 'string', 255, true);
        await createAttribute(answersCollectionId, 'content', 'string', 5000, true);
        await createAttribute(answersCollectionId, 'author', 'string', 255, true);
        await createAttribute(answersCollectionId, 'userId', 'string', 255, true);
        await createAttribute(answersCollectionId, 'authorLevel', 'integer', undefined, false);
        await createAttribute(answersCollectionId, 'votes', 'integer', undefined, false);

        console.log("\n--- SETUP COMPLETE ---");
        console.log(`VITE_APPWRITE_HELP_QUESTIONS_COLLECTION_ID=${questionsCollectionId}`);
        console.log(`VITE_APPWRITE_HELP_ANSWERS_COLLECTION_ID=${answersCollectionId}`);
    }
}

main();
