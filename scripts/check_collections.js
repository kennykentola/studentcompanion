
const https = require('https');

// Extracted from setup_appwrite.js content shown earlier
const API_KEY = 'standard_d66bfc5c3bc1326b7053615aca143f3ab06ea319551cb3386c786c1644b2ec67b5b9970830c8f85583da055950b449d2e4702c3f14b2c58178c8d8e3d52f4ce95f58b6ff8e5b82b037eca82b8871b3ff455133750d19d4ad70ad30c681e0008abe228b828306deb8cb1e15824223aaaeb5b07d3347a56d614a16c45008a80ed6';
const PROJECT_ID = 'studentcompanion';
const DATABASE_ID = 'studentcompanion';
const ENDPOINT_HOST = 'fra.cloud.appwrite.io'; // Correct host from endpoint URL

const options = {
    hostname: ENDPOINT_HOST,
    path: `/v1/databases/${DATABASE_ID}/collections`,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = JSON.parse(data);
            console.log('Collections found:', response.total);
            response.collections.forEach(col => {
                console.log(`- Name: ${col.name}, ID: ${col.$id}`);
            });
        } else {
            console.error('Error fetching collections:', res.statusCode, data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error);
});

req.end();
