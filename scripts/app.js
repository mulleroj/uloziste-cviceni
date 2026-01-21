/**
 * Úložiště cvičení - Main Application Logic
 * Supports both:
 * 1. Built exercises from exercises/ folder (production)
 * 2. ZIP upload for quick testing (development)
 */

// ===== Configuration =====
const CONFIG = {
    storageKey: 'exercises-repository',
    exercisesFolder: 'exercises',
    exercisesManifest: 'exercises/manifest.json'
};

// ===== State =====
let exercises = [];
let builtExercises = [];

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
    exerciseFrame: document.getElementById('exerciseFrame')
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
    initUploadZone();
    initModal();
    await loadBuiltExercises();
    renderExercises();
});

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

// ===== File Upload Handler (for testing) =====
async function handleFileUpload(file) {
    const { uploadProgress, progressFill, progressText } = elements;

    showNotification('Pro přidání cvičení použijte: npm run add-exercise <cesta-k-zip>', 'info');

    uploadProgress.hidden = false;
    progressText.textContent = 'Tato funkce je pouze pro testování...';
    progressFill.style.width = '100%';

    setTimeout(() => {
        uploadProgress.hidden = true;
        progressFill.style.width = '0%';
    }, 3000);
}

// ===== Exercise Management =====
function renderExercises() {
    const { exercisesGrid, emptyState } = elements;

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

// ===== Expose functions globally =====
window.launchExercise = launchExercise;
