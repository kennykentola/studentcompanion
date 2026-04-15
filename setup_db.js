/**
 * setup_db.js — Server-side Appwrite collection setup script.
 * Run with: node setup_db.js
 *
 * API key is read from .env (APPWRITE_API_KEY — no VITE_ prefix, never bundled by Vite).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client, Databases, ID } from 'node-appwrite';

// ── Read .env manually (node doesn't auto-load .env) ──────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');
const envContents = readFileSync(envPath, 'utf-8');

function parseEnv(src) {
    const env = {};
    for (const line of src.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        env[key] = val;
    }
    return env;
}

const env = parseEnv(envContents);

const ENDPOINT   = env.VITE_APPWRITE_ENDPOINT  || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = env.VITE_APPWRITE_PROJECT_ID || '';
const DATABASE_ID = env.VITE_APPWRITE_DATABASE_ID || '';
const API_KEY    = env.APPWRITE_API_KEY || '';

if (!API_KEY) {
    console.error('❌  APPWRITE_API_KEY not found in .env');
    process.exit(1);
}

// ── Appwrite client ───────────────────────────────────────────────────────────
const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getOrCreateCollection(dbId, name) {
    const cols = await databases.listCollections(dbId);
    const existing = cols.collections.find(c => c.name === name);
    if (existing) {
        console.log(`  ✔ Collection already exists: "${name}" (${existing.$id})`);
        return existing.$id;
    }
    const col = await databases.createCollection(dbId, ID.unique(), name, []);
    console.log(`  ✨ Created collection: "${name}" (${col.$id})`);
    return col.$id;
}

async function addStr(dbId, colId, key, size = 255, required = false, defaultVal = null) {
    try {
        const opts = [dbId, colId, key, size, required];
        if (defaultVal !== null) opts.push(defaultVal);
        await databases.createStringAttribute(...opts);
        console.log(`     + attr: ${key} (string)`);
    } catch (e) { if (!e.message?.includes('already exist')) throw e; }
}

async function addBool(dbId, colId, key, required = false, defaultVal = false) {
    try {
        await databases.createBooleanAttribute(dbId, colId, key, required, defaultVal);
        console.log(`     + attr: ${key} (bool)`);
    } catch (e) { if (!e.message?.includes('already exist')) throw e; }
}

async function addFloat(dbId, colId, key, required = false, defaultVal = null) {
    try {
        const opts = [dbId, colId, key, required];
        if (defaultVal !== null) opts.push(defaultVal);
        await databases.createFloatAttribute(...opts);
        console.log(`     + attr: ${key} (float)`);
    } catch (e) { if (!e.message?.includes('already exist')) throw e; }
}

async function addIntAttr(dbId, colId, key, required = false, defaultVal = null) {
    try {
        const opts = [dbId, colId, key, required];
        if (defaultVal !== null) opts.push(defaultVal);
        await databases.createIntegerAttribute(...opts);
        console.log(`     + attr: ${key} (integer)`);
    } catch (e) { if (!e.message?.includes('already exist')) throw e; }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function setup() {
    console.log('\n🚀  Student Companion — Database Setup\n');
    const dbId = DATABASE_ID;
    console.log(`Using database: ${dbId}\n`);

    const results = {};

    // ── 1. Flashcards ─────────────────────────────────────────────────────────
    console.log('[1/5] Flashcards');
    const flashcardsId = await getOrCreateCollection(dbId, 'flashcards');
    await addStr(dbId, flashcardsId, 'userId', 255, true);
    await addStr(dbId, flashcardsId, 'question', 2000, true);
    await addStr(dbId, flashcardsId, 'answer', 2000, true);
    await addStr(dbId, flashcardsId, 'courseTag', 100, false, '');
    await addBool(dbId, flashcardsId, 'known', false, false);
    results.VITE_APPWRITE_FLASHCARDS_COLLECTION_ID = flashcardsId;

    // ── 2. Resources ──────────────────────────────────────────────────────────
    console.log('\n[2/5] Resources');
    const resourcesId = await getOrCreateCollection(dbId, 'resources');
    await addStr(dbId, resourcesId, 'userId', 255, true);
    await addStr(dbId, resourcesId, 'title', 255, true);
    await addStr(dbId, resourcesId, 'type', 50, false, 'notes');   // notes | past_paper | link
    await addStr(dbId, resourcesId, 'courseTag', 100, false, '');
    await addStr(dbId, resourcesId, 'fileId', 255, false, '');
    await addStr(dbId, resourcesId, 'url', 2000, false, '');
    await addStr(dbId, resourcesId, 'description', 1000, false, '');
    results.VITE_APPWRITE_RESOURCES_COLLECTION_ID = resourcesId;

    // ── 3. Study Rooms ────────────────────────────────────────────────────────
    console.log('\n[3/5] Study Rooms');
    const studyRoomsId = await getOrCreateCollection(dbId, 'study_rooms');
    await addStr(dbId, studyRoomsId, 'name', 255, true);
    await addStr(dbId, studyRoomsId, 'courseTag', 100, false, '');
    await addStr(dbId, studyRoomsId, 'description', 1000, false, '');
    await addStr(dbId, studyRoomsId, 'createdBy', 255, true);
    await addStr(dbId, studyRoomsId, 'createdByName', 255, false, 'Unknown');
    results.VITE_APPWRITE_STUDY_ROOMS_COLLECTION_ID = studyRoomsId;

    // ── 4. Course Reviews ─────────────────────────────────────────────────────
    console.log('\n[4/5] Course Reviews');
    const courseReviewsId = await getOrCreateCollection(dbId, 'course_reviews');
    await addStr(dbId, courseReviewsId, 'userId', 255, true);
    await addStr(dbId, courseReviewsId, 'username', 255, false, 'Anonymous');
    await addStr(dbId, courseReviewsId, 'courseCode', 100, true);
    await addStr(dbId, courseReviewsId, 'courseName', 255, false, '');
    await addIntAttr(dbId, courseReviewsId, 'rating', true, 3);   // 1–5
    await addStr(dbId, courseReviewsId, 'review', 2000, false, '');
    results.VITE_APPWRITE_COURSE_REVIEWS_COLLECTION_ID = courseReviewsId;

    // ── 5. Budget Entries ─────────────────────────────────────────────────────
    console.log('\n[5/5] Budget Entries');
    const budgetEntriesId = await getOrCreateCollection(dbId, 'budget_entries');
    await addStr(dbId, budgetEntriesId, 'userId', 255, true);
    await addStr(dbId, budgetEntriesId, 'title', 255, true);
    await addFloat(dbId, budgetEntriesId, 'amount', true);
    await addStr(dbId, budgetEntriesId, 'type', 20, false, 'expense');  // income | expense
    await addStr(dbId, budgetEntriesId, 'category', 100, false, 'Other');
    await addStr(dbId, budgetEntriesId, 'date', 30, true);
    results.VITE_APPWRITE_BUDGET_ENTRIES_COLLECTION_ID = budgetEntriesId;

    // ── Print .env values to paste ────────────────────────────────────────────
    console.log('\n\n✅  Setup complete! Copy these collection IDs into your .env:\n');
    for (const [key, val] of Object.entries(results)) {
        console.log(`${key}=${val}`);
    }
}

setup().catch(err => {
    console.error('❌  Setup error:', err.message || err);
    process.exit(1);
});
