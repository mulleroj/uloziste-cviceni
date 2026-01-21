/**
 * Úložiště cvičení - Main Application Logic
 * Supports:
 * 1. Built exercises from exercises/ folder (production)
 * 2. ZIP upload to GitHub via API (web-based workflow)
 */

// ===== Configuration =====
const CONFIG = {
    storageKey: 'exercises-repository',
    githubSettingsKey: 'github-settings',
    exercisesFolder: 'exercises',
    exercisesManifest: 'exercises/manifest.json',
    uploadsFolder: 'uploads'
};

// ===== State =====
let exercises = [];
let builtExercises = [];
let isAdmin = false;
let githubSettings = {
    token: '',
    repo: 'mulleroj/uloziste-cviceni'
};

// ===== DOM Elements =====
const elements = {
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    uploadProgress: document.getElementById('uploadProgress'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    exercisesGrid: document.getElementById('exercisesGrid'),
    emptyState: document.getElementById('emptyState'),
    modal: document.getElementById('exerciseModal'),
    modalClose: document.getElementById('modalClose'),
    exerciseFrame: document.getElementById('exerciseFrame'),
    // GitHub settings elements
    githubToken: document.getElementById('githubToken'),
    githubRepo: document.getElementById('githubRepo'),
    saveSettings: document.getElementById('saveSettings')
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
    // Check for admin mode
    isAdmin = new URLSearchParams(window.location.search).has('admin');
    if (isAdmin) {
        const uploadSection = document.getElementById('upload');
        const howToSection = document.getElementById('how-to');
        const adminNavLink = document.getElementById('adminNavLink');
        if (uploadSection) uploadSection.hidden = false;
        if (howToSection) howToSection.hidden = false;
        if (adminNavLink) adminNavLink.hidden = false;
    }

    loadGitHubSettings();
    initUploadZone();
    initModal();
    initSettingsForm();
    await loadBuiltExercises();
    renderExercises();
});

// ===== GitHub Settings =====
function loadGitHubSettings() {
    try {
        const saved = localStorage.getItem(CONFIG.githubSettingsKey);
        if (saved) {
            githubSettings = JSON.parse(saved);
            if (elements.githubToken) {
                elements.githubToken.value = githubSettings.token || '';
            }
            if (elements.githubRepo) {
                elements.githubRepo.value = githubSettings.repo || 'mulleroj/uloziste-cviceni';
            }
        }
    } catch (e) {
        console.warn('Could not load GitHub settings:', e);
    }
}

function saveGitHubSettings() {
    githubSettings = {
        token: elements.githubToken?.value || '',
        repo: elements.githubRepo?.value || 'mulleroj/uloziste-cviceni'
    };
    localStorage.setItem(CONFIG.githubSettingsKey, JSON.stringify(githubSettings));
    showNotification('Nastavení uloženo!', 'success');
}

function initSettingsForm() {
    if (elements.saveSettings) {
        elements.saveSettings.addEventListener('click', saveGitHubSettings);
    }
}

// ===== Load Built Exercises from exercises/ folder =====
async function loadBuiltExercises() {
    try {
        // Try to load manifest
        const response = await fetch(CONFIG.exercisesManifest);
        if (response.ok) {
            const manifest = await response.json();
            builtExercises = manifest.exercises || [];
        }
    } catch (e) {
        // No manifest, try to scan for exercises
        builtExercises = await scanExercisesFolder();
    }
}

async function scanExercisesFolder() {
    const exercises = [];

    // This is a simple approach - check for known exercise folders
    // In production, the manifest.json should be generated during build
    try {
        const response = await fetch('exercises/');
        if (!response.ok) return exercises;

        const html = await response.text();
        // Parse directory listing (works with serve and similar servers)
        const folderMatches = html.match(/href="([^"]+)\/"/g) || [];

        for (const match of folderMatches) {
            const folderName = match.replace(/href="|\/"/g, '');
            if (folderName && !folderName.startsWith('.')) {
                try {
                    // Try to load meta.json
                    const metaResponse = await fetch(`exercises/${folderName}/meta.json`);
                    if (metaResponse.ok) {
                        const meta = await metaResponse.json();
                        exercises.push({
                            id: `built-${folderName}`,
                            name: meta.name || folderName,
                            description: meta.description || 'Cvičení z AI Studio Builderu',
                            icon: meta.icon || '🎮',
                            folder: folderName,
                            isBuilt: true
                        });
                    } else {
                        // Check if index.html exists
                        const indexResponse = await fetch(`exercises/${folderName}/index.html`, { method: 'HEAD' });
                        if (indexResponse.ok) {
                            exercises.push({
                                id: `built-${folderName}`,
                                name: folderName.replace(/-/g, ' '),
                                description: 'Cvičení z AI Studio Builderu',
                                icon: '🎮',
                                folder: folderName,
                                isBuilt: true
                            });
                        }
                    }
                } catch (e) {
                    console.warn(`Could not load exercise: ${folderName}`, e);
                }
            }
        }
    } catch (e) {
        console.warn('Could not scan exercises folder:', e);
    }

    return exercises;
}

// ===== Upload Zone =====
function initUploadZone() {
    const { uploadZone, fileInput } = elements;

    if (!uploadZone || !fileInput) return;

    uploadZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.zip')) {
            handleFileUpload(file);
        } else {
            showNotification('Prosím nahrajte ZIP soubor', 'error');
        }
    });
}

// ===== File Upload Handler - Upload to GitHub =====
async function handleFileUpload(file) {
    const { uploadProgress, progressFill, progressText } = elements;

    // Check if GitHub settings are configured
    if (!githubSettings.token) {
        showNotification('Nejdříve zadejte GitHub token v nastavení výše', 'error');
        return;
    }

    if (!githubSettings.repo) {
        showNotification('Nejdříve zadejte GitHub repozitář v nastavení výše', 'error');
        return;
    }

    uploadProgress.hidden = false;
    progressText.textContent = 'Připravuji soubor...';
    progressFill.style.width = '20%';

    try {
        // Convert file to base64
        const base64Content = await fileToBase64(file);

        progressText.textContent = 'Nahrávám na GitHub...';
        progressFill.style.width = '50%';

        // Upload to GitHub
        const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
        const path = `uploads/${fileName}`;

        const result = await uploadToGitHub(path, base64Content, `📦 Upload: ${file.name}`);

        if (result.success) {
            progressText.textContent = 'Úspěšně nahráno! GitHub Actions zpracovává...';
            progressFill.style.width = '100%';

            showNotification(
                '✅ ZIP nahrán na GitHub! Za ~2 minuty bude cvičení dostupné.',
                'success'
            );

            setTimeout(() => {
                uploadProgress.hidden = true;
                progressFill.style.width = '0%';
            }, 5000);
        } else {
            throw new Error(result.error || 'Upload failed');
        }

    } catch (error) {
        console.error('Upload error:', error);
        progressText.textContent = 'Chyba při nahrávání';
        progressFill.style.width = '0%';

        let errorMessage = 'Nahrávání selhalo: ';
        if (error.message.includes('401')) {
            errorMessage += 'Neplatný GitHub token';
        } else if (error.message.includes('404')) {
            errorMessage += 'Repozitář nenalezen';
        } else if (error.message.includes('422')) {
            errorMessage += 'Soubor již existuje';
        } else {
            errorMessage += error.message;
        }

        showNotification(errorMessage, 'error');

        setTimeout(() => {
            uploadProgress.hidden = true;
        }, 3000);
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove data URL prefix to get just base64
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Upload file to GitHub via API
async function uploadToGitHub(path, base64Content, message) {
    const [owner, repo] = githubSettings.repo.split('/');
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${githubSettings.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: message,
                content: base64Content
            })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ===== Exercise Management =====
function renderExercises() {
    const { exercisesGrid, emptyState } = elements;

    if (!exercisesGrid || !emptyState) return;

    // Combine built exercises with any uploaded ones
    const allExercises = [...builtExercises];

    if (allExercises.length === 0) {
        exercisesGrid.innerHTML = '';
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;
    exercisesGrid.innerHTML = allExercises.map(exercise => `
        <article class="exercise-card" data-id="${exercise.id}">
            <div class="exercise-preview">${exercise.icon}</div>
            <div class="exercise-info">
                <h3 class="exercise-title">${escapeHtml(exercise.name)}</h3>
                <p class="exercise-description">${escapeHtml(exercise.description)}</p>
                <div class="exercise-actions">
                    <button class="btn btn-primary" onclick="launchExercise('${exercise.id}')">
                        ▶️ Spustit
                    </button>
                    ${isAdmin ? `
                    <button class="btn btn-danger btn-sm" onclick="deleteExercise('${exercise.id}')">
                        🗑️ Smazat
                    </button>` : ''}
                </div>
            </div>
        </article>
    `).join('');
}

function launchExercise(id) {
    const exercise = builtExercises.find(e => e.id === id);
    if (!exercise) return;

    if (exercise.isBuilt) {
        // Open built exercise in new tab - use trailing slash for relative path compatibility
        window.open(`exercises/${exercise.folder}/`, '_blank');
    }
}

// ===== Modal =====
function initModal() {
    const { modal, modalClose } = elements;

    if (!modal || !modalClose) return;

    modalClose.addEventListener('click', closeModal);
    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) {
            closeModal();
        }
    });
}

function closeModal() {
    elements.modal.hidden = true;
    elements.exerciseFrame.src = '';
    document.body.style.overflow = '';
}

// ===== Utilities =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">✕</button>
    `;

    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 16px 24px;
                border-radius: 8px;
                background: #1e293b;
                border: 1px solid #334155;
                color: #f8fafc;
                display: flex;
                align-items: center;
                gap: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                z-index: 2000;
                animation: slideIn 0.3s ease;
                max-width: 400px;
            }
            .notification-success { border-color: #10b981; }
            .notification-error { border-color: #ef4444; }
            .notification-info { border-color: #6366f1; }
            .notification button {
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                font-size: 1rem;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// ===== Delete Exercise =====
function deleteExercise(id) {
    const exercise = builtExercises.find(e => e.id === id);
    if (!exercise) return;

    // Check if GitHub settings are configured
    if (!githubSettings.token) {
        showNotification('Nejdříve zadejte GitHub token v nastavení výše', 'error');
        return;
    }

    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-modal-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="confirm-modal-content">
            <div class="confirm-icon">🗑️</div>
            <h3>Smazat cvičení?</h3>
            <p>Opravdu chcete smazat <strong>${escapeHtml(exercise.name)}</strong>?</p>
            <p class="confirm-warning">Tato akce je nevratná!</p>
            <div class="confirm-actions">
                <button class="btn btn-secondary" onclick="this.closest('.confirm-modal').remove()">
                    Zrušit
                </button>
                <button class="btn btn-danger" onclick="confirmDelete('${exercise.id}'); this.closest('.confirm-modal').remove();">
                    🗑️ Smazat
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function confirmDelete(id) {
    const exercise = builtExercises.find(e => e.id === id);
    if (!exercise) return;

    showNotification('Mažu cvičení...', 'info');

    try {
        const folderPath = `exercises/${exercise.folder}`;
        const success = await deleteFromGitHub(folderPath);

        if (success) {
            // Remove from local array
            builtExercises = builtExercises.filter(e => e.id !== id);
            renderExercises();
            showNotification(`✅ Cvičení "${exercise.name}" bylo smazáno!`, 'success');
        } else {
            showNotification('Nepodařilo se smazat cvičení', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification(`Chyba při mazání: ${error.message}`, 'error');
    }
}

async function deleteFromGitHub(folderPath) {
    const [owner, repo] = githubSettings.repo.split('/');

    try {
        // First, get all files in the folder
        const listUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}`;
        const listResponse = await fetch(listUrl, {
            headers: {
                'Authorization': `Bearer ${githubSettings.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!listResponse.ok) {
            throw new Error(`Složka nenalezena: ${listResponse.status}`);
        }

        const files = await listResponse.json();

        // Delete each file one by one
        for (const file of files) {
            if (file.type === 'dir') {
                // Recursively delete subdirectories
                await deleteFromGitHub(file.path);
            } else {
                // Delete file
                const deleteUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`;
                const deleteResponse = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${githubSettings.token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        message: `🗑️ Smazáno: ${file.path}`,
                        sha: file.sha
                    })
                });

                if (!deleteResponse.ok) {
                    console.error(`Failed to delete ${file.path}`);
                }
            }
        }

        return true;
    } catch (error) {
        console.error('GitHub delete error:', error);
        throw error;
    }
}

// ===== Expose functions globally =====
window.launchExercise = launchExercise;
window.deleteExercise = deleteExercise;
window.confirmDelete = confirmDelete;
