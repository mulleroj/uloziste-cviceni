/**
 * Build Script for AI Studio Builder Exercises
 * 
 * Usage: node scripts/build-exercise.js <path-to-zip>
 * 
 * This script:
 * 1. Extracts the ZIP file
 * 2. Installs dependencies
 * 3. Builds the production version
 * 4. Fixes asset paths for subdirectory deployment
 * 5. Copies output to exercises folder
 * 6. Updates manifest.json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Get ZIP file path from command line
const zipPath = process.argv[2];

if (!zipPath) {
    console.log('❌ Chyba: Nezadali jste cestu k ZIP souboru\n');
    console.log('Použití: npm run add-exercise <cesta-k-zip>');
    console.log('Příklad: npm run add-exercise C:\\Downloads\\grammar-master.zip');
    process.exit(1);
}

// Check if file exists
if (!fs.existsSync(zipPath)) {
    console.log(`❌ Soubor nenalezen: ${zipPath}`);
    process.exit(1);
}

console.log('🚀 Zpracovávám cvičení z AI Studio Builderu...\n');

// Create temp directory for extraction
const tempDir = path.join(__dirname, '..', 'temp-build');
const exercisesDir = path.join(__dirname, '..', 'exercises');

// Clean up temp directory if exists
if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Extract ZIP
console.log('📦 Rozbaluji ZIP soubor...');
const zip = new AdmZip(zipPath);
zip.extractAllTo(tempDir, true);

// Find the directory with package.json
let projectDir = tempDir;
const entries = fs.readdirSync(tempDir);

// Check if ZIP contains a single directory
if (entries.length === 1) {
    const possibleDir = path.join(tempDir, entries[0]);
    if (fs.statSync(possibleDir).isDirectory()) {
        projectDir = possibleDir;
    }
}

// Check for package.json
const packageJsonPath = path.join(projectDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ Chyba: ZIP neobsahuje package.json');
    fs.rmSync(tempDir, { recursive: true });
    process.exit(1);
}

// Read package.json to get project name
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let projectName = packageJson.name || path.basename(zipPath, '.zip');

// If name is generic, use ZIP filename instead
const genericNames = ['react-example', 'vite-project', 'my-app', 'project', 'app'];
if (genericNames.includes(projectName.toLowerCase())) {
    projectName = path.basename(zipPath, '.zip');
}

const safeName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

console.log(`📋 Název cvičení: ${projectName}`);

// Install dependencies
console.log('📥 Instaluji závislosti (npm install)...');
try {
    execSync('npm install', {
        cwd: projectDir,
        stdio: 'pipe',
        timeout: 180000 // 3 minute timeout
    });
} catch (error) {
    console.log('⚠️ Varování: Některé závislosti se nepodařilo nainstalovat');
}

// Modify vite.config to use relative paths
const viteConfigPath = path.join(projectDir, 'vite.config.ts');
const viteConfigJsPath = path.join(projectDir, 'vite.config.js');

if (fs.existsSync(viteConfigPath)) {
    let config = fs.readFileSync(viteConfigPath, 'utf8');
    // Add base: './' for relative paths
    if (!config.includes("base:")) {
        config = config.replace(
            /export default defineConfig\(\{/,
            "export default defineConfig({\n  base: './',"
        );
        fs.writeFileSync(viteConfigPath, config);
        console.log('🔧 Upravuji vite.config.ts pro relativní cesty...');
    }
} else if (fs.existsSync(viteConfigJsPath)) {
    let config = fs.readFileSync(viteConfigJsPath, 'utf8');
    if (!config.includes("base:")) {
        config = config.replace(
            /export default defineConfig\(\{/,
            "export default defineConfig({\n  base: './',"
        );
        fs.writeFileSync(viteConfigJsPath, config);
        console.log('🔧 Upravuji vite.config.js pro relativní cesty...');
    }
}

// Build the project
console.log('🔨 Vytvářím produkční build...');
try {
    execSync('npm run build', {
        cwd: projectDir,
        stdio: 'pipe',
        timeout: 180000
    });
} catch (error) {
    console.log('❌ Chyba při buildu:');
    console.log(error.message);
    fs.rmSync(tempDir, { recursive: true });
    process.exit(1);
}

// Find the build output directory
const possibleBuildDirs = ['dist', 'build', 'out', '.output'];
let buildDir = null;

for (const dir of possibleBuildDirs) {
    const fullPath = path.join(projectDir, dir);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        buildDir = fullPath;
        break;
    }
}

if (!buildDir) {
    console.log('❌ Chyba: Nenalezen výstupní adresář (dist/build)');
    fs.rmSync(tempDir, { recursive: true });
    process.exit(1);
}

// Fix any remaining absolute paths in index.html
const indexHtmlPath = path.join(buildDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf8');
    // Convert absolute paths to relative
    html = html.replace(/href="\//g, 'href="./');
    html = html.replace(/src="\//g, 'src="./');
    fs.writeFileSync(indexHtmlPath, html);
    console.log('🔧 Opravuji cesty v index.html...');
}

// Copy build output to exercises folder
const targetDir = path.join(exercisesDir, safeName);

// Remove existing exercise with same name
if (fs.existsSync(targetDir)) {
    console.log(`⚠️ Nahrazuji existující cvičení: ${safeName}`);
    fs.rmSync(targetDir, { recursive: true });
}

// Create target directory and copy files
fs.mkdirSync(targetDir, { recursive: true });
copyRecursive(buildDir, targetDir);

// Create meta.json
const metaPath = path.join(targetDir, 'meta.json');
const meta = {
    id: `built-${safeName}`,
    name: projectName,
    description: packageJson.description || 'Cvičení z AI Studio Builderu',
    icon: '🎮',
    created: new Date().toISOString().split('T')[0],
    folder: safeName,
    isBuilt: true
};
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

// Update manifest.json
updateManifest(exercisesDir, meta);

// Clean up temp directory
fs.rmSync(tempDir, { recursive: true });

console.log('\n✅ Cvičení úspěšně přidáno!');
console.log(`📁 Umístění: exercises/${safeName}`);
console.log(`🌐 URL: /exercises/${safeName}/index.html`);
console.log('\nPro nasazení na Netlify:');
console.log('  git add .');
console.log('  git commit -m "Přidáno cvičení: ' + projectName + '"');
console.log('  git push');

// Helper function to copy directory recursively
function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Update or create manifest.json
function updateManifest(exercisesDir, newExercise) {
    const manifestPath = path.join(exercisesDir, 'manifest.json');
    let manifest = { exercises: [] };

    // Load existing manifest
    if (fs.existsSync(manifestPath)) {
        try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (e) {
            manifest = { exercises: [] };
        }
    }

    // Remove existing exercise with same id
    manifest.exercises = manifest.exercises.filter(e => e.id !== newExercise.id);

    // Add new exercise
    manifest.exercises.push(newExercise);

    // Sort by name
    manifest.exercises.sort((a, b) => a.name.localeCompare(b.name));

    // Save manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('📋 Manifest aktualizován');
}
