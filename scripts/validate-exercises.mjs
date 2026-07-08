import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const exercisesDir = path.join(rootDir, 'exercises');
const manifestPath = path.join(exercisesDir, 'manifest.json');
const appJsPath = path.join(rootDir, 'scripts', 'app.js');

let errors = [];

function addError(file, message) {
    errors.push(`ERROR in ${file}: ${message}`);
}

// 1. Check if exercises directory exists
if (!fs.existsSync(exercisesDir)) {
    console.error('ERROR: exercises/ directory does not exist.');
    process.exit(1);
}

// 2. Discover exercise folders in exercises/
const allEntries = fs.readdirSync(exercisesDir);
const exerciseFolders = [];

for (const entry of allEntries) {
    // Ignore system files/folders like .DS_Store, .gitkeep, manifest.json, etc.
    if (entry.startsWith('.') || entry === 'manifest.json') continue;

    const entryPath = path.join(exercisesDir, entry);
    const stats = fs.statSync(entryPath);
    if (!stats.isDirectory()) continue;

    exerciseFolders.push(entry);
}

// Sort for consistent checking
exerciseFolders.sort();

// 3. Check each exercise folder & its meta.json
const validLevels = ['Elementary', 'Pre-intermediate', 'Intermediate'];
const levelDuplicatesRegex = /\b(Elementary|Pre-intermediate|Intermediate|pre intermediate|elementary|intermediate)\b/i;

const folderMetaMap = new Map();

for (const folder of exerciseFolders) {
    const folderPath = path.join(exercisesDir, folder);
    const metaPath = path.join(folderPath, 'meta.json');
    const indexPath = path.join(folderPath, 'index.html');

    // Check meta.json exists
    if (!fs.existsSync(metaPath)) {
        addError(`exercises/${folder}`, `Missing required file meta.json`);
        continue;
    }

    // Check index.html exists
    if (!fs.existsSync(indexPath)) {
        addError(`exercises/${folder}`, `Missing required file index.html`);
    }

    // Check meta.json is valid JSON
    let meta;
    try {
        const metaContent = fs.readFileSync(metaPath, 'utf8');
        meta = JSON.parse(metaContent);
    } catch (e) {
        addError(`exercises/${folder}/meta.json`, `Invalid JSON syntax: ${e.message}`);
        continue;
    }

    // Check required fields in meta.json
    const title = meta.title || meta.name;
    if (!title) {
        addError(`exercises/${folder}/meta.json`, `Missing required field 'title' or 'name'`);
    }
    if (!meta.description) {
        addError(`exercises/${folder}/meta.json`, `Missing required field 'description'`);
    }
    if (!meta.icon) {
        addError(`exercises/${folder}/meta.json`, `Missing required field 'icon'`);
    }
    if (!meta.level) {
        addError(`exercises/${folder}/meta.json`, `Missing required field 'level'`);
    } else if (!validLevels.includes(meta.level)) {
        addError(`exercises/${folder}/meta.json`, `Invalid level value '${meta.level}'. Must be one of: ${validLevels.join(', ')}`);
    }

    // Check if description redundantly duplicates the level
    if (meta.description && levelDuplicatesRegex.test(meta.description)) {
        addError(`exercises/${folder}/meta.json`, `Description unnecessarily duplicates level string: "${meta.description}"`);
    }

    // If folder field is present in meta.json, check it matches folder name
    if (meta.folder && meta.folder !== folder) {
        addError(`exercises/${folder}/meta.json`, `Property 'folder' ('${meta.folder}') does not match directory name '${folder}'`);
    }

    folderMetaMap.set(folder, meta);
}

// 4. Check exercises/manifest.json
if (!fs.existsSync(manifestPath)) {
    addError(`exercises/manifest.json`, `File does not exist`);
} else {
    let manifest;
    try {
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        manifest = JSON.parse(manifestContent);
    } catch (e) {
        addError(`exercises/manifest.json`, `Invalid JSON syntax: ${e.message}`);
    }

    if (manifest && !Array.isArray(manifest.exercises)) {
        addError(`exercises/manifest.json`, `Missing or invalid 'exercises' array`);
    } else if (manifest) {
        const manifestFolders = new Set();
        for (let i = 0; i < manifest.exercises.length; i++) {
            const item = manifest.exercises[i];
            const itemPrefix = `exercises/manifest.json [item #${i} (${item.folder || 'unknown'})]`;

            if (!item.folder) {
                addError(itemPrefix, `Missing required property 'folder'`);
                continue;
            }

            // Check duplicate in manifest
            if (manifestFolders.has(item.folder)) {
                addError(itemPrefix, `Duplicate exercise folder '${item.folder}' in manifest`);
            }
            manifestFolders.add(item.folder);

            // Check folder exists on disk
            if (!folderMetaMap.has(item.folder)) {
                addError(itemPrefix, `Folder '${item.folder}' listed in manifest does not exist or is not a valid exercise folder`);
                continue;
            }

            // Check index.html exists for url derivation
            const expectedUrl = `/exercises/${item.folder}/`;
            const indexPath = path.join(exercisesDir, item.folder, 'index.html');
            if (!fs.existsSync(indexPath)) {
                addError(itemPrefix, `Derived URL ${expectedUrl} is invalid because ${indexPath} does not exist`);
            }

            // Compare manifest fields with meta.json fields
            const meta = folderMetaMap.get(item.folder);
            const itemTitle = item.title || item.name;
            const metaTitle = meta.title || meta.name;

            if (itemTitle !== metaTitle) {
                addError(itemPrefix, `Title/name '${itemTitle}' does not match meta.json title/name '${metaTitle}'`);
            }
            if (item.description !== meta.description) {
                addError(itemPrefix, `Description '${item.description}' does not match meta.json description '${meta.description}'`);
            }
            if (item.icon !== meta.icon) {
                addError(itemPrefix, `Icon '${item.icon}' does not match meta.json icon '${meta.icon}'`);
            }
            if (item.level !== meta.level) {
                addError(itemPrefix, `Level '${item.level}' does not match meta.json level '${meta.level}'`);
            }
        }

        // Check that all existing exercise folders are listed in manifest
        for (const folder of exerciseFolders) {
            if (!manifestFolders.has(folder)) {
                addError(`exercises/manifest.json`, `Existing exercise folder '${folder}' is missing from manifest`);
            }
        }
    }
}

// 5. Protection check: verify that app.js handles id/isBuilt generation dynamically at runtime
if (fs.existsSync(appJsPath)) {
    const appJsContent = fs.readFileSync(appJsPath, 'utf8');
    // Check if app.js generates id (e.g. e.id || `built-${e.folder}`) and sets isBuilt: true when loading manifest
    if (!appJsContent.includes(`built-\${e.folder}`) && !appJsContent.includes(`id: e.id ||`)) {
        addError(`scripts/app.js`, `Missing runtime fallback generation for exercise 'id' and 'isBuilt' in loadBuiltExercises()`);
    }
} else {
    addError(`scripts/app.js`, `File does not exist`);
}

// Report findings
if (errors.length > 0) {
    errors.forEach(err => console.error(err));
    process.exit(1);
}

console.log(`PASS: exercises validation passed`);
console.log(`Found ${exerciseFolders.length} valid exercises.`);
process.exit(0);
