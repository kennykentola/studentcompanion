
const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "studentcompanion";
const apiKey = "standard_d66bfc5c3bc1326b7053615aca143f3ab06ea319551cb3386c786c1644b2ec67b5b9970830c8f85583da055950b449d2e4702c3f14b2c58178c8d8e3d52f4ce95f58b6ff8e5b82b037eca82b8871b3ff455133750d19d4ad70ad30c681e0008abe228b828306deb8cb1e15824223aaaeb5b07d3347a56d614a16c45008a80ed6"; // CAUTION: This looks like a secret key.

const email = 'peterkehindeademola@gmail.com';
const password = 'kehinde5@';
const name = 'Admin User';

console.log(`Attempting to register user: ${email}`);

async function register() {
    try {
        const response = await fetch(`${endpoint}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': projectId,
                'X-Appwrite-Key': apiKey
            },
            body: JSON.stringify({
                userId: 'unique()',
                email: email,
                password: password,
                name: name
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // If user already exists, that's fine for us
            if (response.status === 409) {
                console.log("User already exists.");
                return;
            }
            throw new Error(data.message || response.statusText);
        }

        console.log('User registered successfully:', data.$id);
    } catch (error) {
        console.error('Registration failed:', error.message || error);
    }
}

register();
