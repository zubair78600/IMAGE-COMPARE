import './style.css';

// State Management
let zoomState = { scale: 1, translateX: 0, translateY: 0 };
let isDragging = false;
let startX, startY;
let selectedFiles = []; // All files across all folders
let folders = []; // List of unique folders
let matchedFiles = {}; // { filename: [fileObject1, fileObject2, ...] }
let filenames = []; // Sorted list of matched filenames
let currentGridLayout = '4-4';
let currentViewMode = 'single';
let currentIndex = 0;

// DOM Elements
const folderInput = document.getElementById('folder-input');
const selectBtn = document.getElementById('select-btn');
const emptySelectBtn = document.getElementById('empty-select-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const bgColorInput = document.getElementById('bg-color');
const fontColorInput = document.getElementById('font-color');
const resetThemeBtn = document.getElementById('reset-theme-btn');
const gridConfig = document.getElementById('grid-config');
const viewModeSelect = document.getElementById('view-mode');
const statsLabel = document.getElementById('stats-label');
const mainContent = document.getElementById('main-content');
const comparisonResults = document.getElementById('comparison-results');
const emptyState = document.querySelector('.empty-state');
const navControls = document.getElementById('nav-controls');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const currentIndexLabel = document.getElementById('current-index-label');

const BG_STORAGE_KEY = 'images-compare:bg-color';
const FONT_STORAGE_KEY = 'images-compare:font-color';

const DEFAULT_BG = '#0f172a';
const DEFAULT_FONT = '#f1f5f9';
const DEFAULT_BG_IMAGE =
    'radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%)';

function hexToRgb(hex) {
    const normalized = (hex || '').replace('#', '').trim();
    if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
    };
}

function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function relativeLuminance({ r, g, b }) {
    const toLinear = (c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const R = toLinear(r);
    const G = toLinear(g);
    const B = toLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function applyColors(bgHex, fontHex) {
    const root = document.documentElement;
    const bg = bgHex || DEFAULT_BG;
    const font = fontHex || DEFAULT_FONT;
    const secondary = hexToRgba(font, 0.72) || 'rgba(241, 245, 249, 0.72)';

    root.style.setProperty('--bg-color', bg);
    root.style.setProperty('--bg-image', bg.toLowerCase() === DEFAULT_BG ? DEFAULT_BG_IMAGE : 'none');
    root.style.setProperty('--text-primary', font);
    root.style.setProperty('--text-secondary', secondary);

    const bgRgb = hexToRgb(bg);
    const fontRgb = hexToRgb(font);
    const bgL = bgRgb ? relativeLuminance(bgRgb) : 0;
    const fontL = fontRgb ? relativeLuminance(fontRgb) : 1;

    const isLightBg = bgL > 0.55;
    const isNearBlackBg = bgL < 0.06;
    const isNearBlackFont = fontL < 0.06;

    if (isLightBg) {
        root.style.setProperty('--glass-bg', 'rgba(15, 23, 42, 0.04)');
        root.style.setProperty('--glass-border', 'rgba(15, 23, 42, 0.12)');
        root.style.setProperty('--control-bg', 'rgba(15, 23, 42, 0.04)');
        root.style.setProperty('--control-bg-hover', 'rgba(15, 23, 42, 0.07)');
        root.style.setProperty('--grid-item-bg', 'rgba(15, 23, 42, 0.02)');
        root.style.setProperty('--grid-item-bg-hover', 'rgba(15, 23, 42, 0.04)');
        root.style.setProperty('--card-shadow', '0 8px 32px 0 rgba(15, 23, 42, 0.12)');
    } else {
        root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--control-bg', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--control-bg-hover', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--grid-item-bg', 'rgba(255, 255, 255, 0.03)');
        root.style.setProperty('--grid-item-bg-hover', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--card-shadow', '0 8px 32px 0 rgba(0, 0, 0, 0.37)');
    }

    root.style.setProperty('--image-box-bg', isNearBlackBg ? '#ffffff' : '#000000');

    if (isNearBlackFont) {
        root.style.setProperty('--accent-color', '#000000');
        root.style.setProperty('--accent-glow', 'rgba(0, 0, 0, 0.25)');
        root.style.setProperty('--logo-gradient-start', '#000000');
        root.style.setProperty('--logo-gradient-end', '#000000');
    } else {
        root.style.setProperty('--accent-color', '#38bdf8');
        root.style.setProperty('--accent-glow', 'rgba(56, 189, 248, 0.5)');
        root.style.setProperty('--logo-gradient-start', '#38bdf8');
        root.style.setProperty('--logo-gradient-end', '#818cf8');
    }

    const accentRgb = hexToRgb(getComputedStyle(root).getPropertyValue('--accent-color').trim() || '#38bdf8');
    const accentL = accentRgb ? relativeLuminance(accentRgb) : 0.5;
    root.style.setProperty('--accent-text-color', accentL < 0.35 ? '#ffffff' : '#0f172a');
}

function setSettingsOpen(isOpen) {
    if (!settingsBtn || !settingsPanel) return;
    settingsBtn.setAttribute('aria-expanded', String(isOpen));
    settingsPanel.classList.toggle('open', isOpen);
}

function initThemePicker() {
    if (!settingsBtn || !settingsPanel || !bgColorInput || !fontColorInput || !resetThemeBtn) return;

    let bg = DEFAULT_BG;
    let font = DEFAULT_FONT;

    try {
        const storedBg = localStorage.getItem(BG_STORAGE_KEY);
        const storedFont = localStorage.getItem(FONT_STORAGE_KEY);
        if (storedBg) bg = storedBg;
        if (storedFont) font = storedFont;
    } catch {
        // Ignore storage failures
    }

    bgColorInput.value = bg;
    fontColorInput.value = font;
    applyColors(bg, font);

    const persistAndApply = () => {
        const nextBg = bgColorInput.value;
        const nextFont = fontColorInput.value;
        applyColors(nextBg, nextFont);
        try {
            localStorage.setItem(BG_STORAGE_KEY, nextBg);
            localStorage.setItem(FONT_STORAGE_KEY, nextFont);
        } catch {
            // Ignore storage failures
        }
    };

    bgColorInput.addEventListener('input', persistAndApply);
    fontColorInput.addEventListener('input', persistAndApply);

    resetThemeBtn.addEventListener('click', () => {
        bgColorInput.value = DEFAULT_BG;
        fontColorInput.value = DEFAULT_FONT;
        applyColors(DEFAULT_BG, DEFAULT_FONT);
        try {
            localStorage.removeItem(BG_STORAGE_KEY);
            localStorage.removeItem(FONT_STORAGE_KEY);
        } catch {
            // Ignore storage failures
        }
    });

    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = settingsPanel.classList.contains('open');
        setSettingsOpen(!isOpen);
    });

    document.addEventListener('click', (e) => {
        if (!settingsPanel.classList.contains('open')) return;
        if (settingsPanel.contains(e.target) || settingsBtn.contains(e.target)) return;
        setSettingsOpen(false);
    });

    window.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!settingsPanel.classList.contains('open')) return;
        setSettingsOpen(false);
    });
}

// Event Listeners
selectBtn.addEventListener('click', () => folderInput.click());
emptySelectBtn.addEventListener('click', () => folderInput.click());

initThemePicker();

gridConfig.addEventListener('change', (e) => {
    currentGridLayout = e.target.value;
    renderResults();
});

viewModeSelect.addEventListener('change', (e) => {
    currentViewMode = e.target.value;
    navControls.style.display = currentViewMode === 'single' ? 'flex' : 'none';
    resetZoom();
    renderResults();
});

prevBtn.addEventListener('click', navigatePrev);
nextBtn.addEventListener('click', navigateNext);

folderInput.addEventListener('change', handleFolderSelect);

// Keyboard Navigation
window.addEventListener('keydown', (e) => {
    if (currentViewMode !== 'single' || filenames.length === 0) return;
    if (e.key === 'ArrowLeft') navigatePrev();
    if (e.key === 'ArrowRight') navigateNext();
});

function navigatePrev() {
    if (filenames.length === 0) return;
    currentIndex = (currentIndex - 1 + filenames.length) % filenames.length;
    renderResults();
}

function navigateNext() {
    if (filenames.length === 0) return;
    currentIndex = (currentIndex + 1) % filenames.length;
    renderResults();
}

/**
 * Handle folder selection and file matching
 */
async function handleFolderSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Reset state
    matchedFiles = {};
    folders = [];
    filenames = [];
    currentIndex = 0;
    resetZoom();

    // Process files
    files.forEach(file => {
        // Only process images
        if (!file.type.startsWith('image/')) return;

        const pathParts = file.webkitRelativePath.split('/');
        const fileName = file.name;

        // Folder name is everything except the file name itself
        const folderName = pathParts.slice(0, -1).join('/') || 'Root';

        if (!folders.includes(folderName)) {
            folders.push(folderName);
        }

        if (!matchedFiles[fileName]) {
            matchedFiles[fileName] = [];
        }

        file.folderSource = folderName;
        matchedFiles[fileName].push(file);
    });

    filenames = Object.keys(matchedFiles).sort();
    folders.sort();

    updateStats(filenames.length, folders.length);
    renderResults();
}

/**
 * Update the header stats
 */
function updateStats(matchCount, folderCount) {
    statsLabel.textContent = `${matchCount} matching filenames found across ${folderCount} folders`;
    emptyState.style.display = 'none';
    comparisonResults.style.display = 'flex';
}

/**
 * Render the comparison grid
 */
function renderResults() {
    comparisonResults.innerHTML = '';

    if (filenames.length === 0) return;

    // Update navigation label
    if (currentViewMode === 'single') {
        currentIndexLabel.textContent = `${currentIndex + 1} / ${filenames.length}`;
    }

    const itemsToDisplay = currentViewMode === 'single' ? [filenames[currentIndex]] : filenames;

    itemsToDisplay.forEach(filename => {
        const unit = document.createElement('div');
        unit.className = 'image-unit';
        if (currentViewMode === 'single') unit.style.minHeight = '70vh';

        const header = document.createElement('div');
        header.className = 'unit-header';
        header.innerHTML = `<span class="filename">${filename}</span> <span class="count">${matchedFiles[filename].length} matches</span>`;

        const grid = document.createElement('div');
        grid.className = `image-grid grid-${currentGridLayout}`;

        // Find matches for each selected folder
        folders.forEach(folder => {
            const fileMatch = matchedFiles[filename].find(f => f.folderSource === folder);

            const item = document.createElement('div');
            item.className = 'grid-item';

            const imgContainer = document.createElement('div');
            imgContainer.className = 'img-container';

            // Add Zoom Event Listeners to Container
            imgContainer.addEventListener('wheel', handleWheel, { passive: false });
            imgContainer.addEventListener('mousedown', handleMouseDown);
            imgContainer.addEventListener('dblclick', handledblclick);
            imgContainer.addEventListener('touchstart', handleTouchStart, { passive: false });

            if (fileMatch) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(fileMatch);
                img.loading = 'lazy';
                // Apply current zoom
                img.style.transform = `translate(${zoomState.translateX}px, ${zoomState.translateY}px) scale(${zoomState.scale})`;
                imgContainer.appendChild(img);
            } else {
                imgContainer.innerHTML = '<span style="color:var(--text-secondary);font-size:0.8rem;">No match</span>';
            }

            item.appendChild(imgContainer);

            const labelContainer = document.createElement('div');
            labelContainer.className = 'label-container';

            const folderLabel = document.createElement('div');
            folderLabel.className = 'label-folder';
            folderLabel.textContent = folder;

            labelContainer.appendChild(folderLabel);
            // Filename label removed as per user request
            item.appendChild(labelContainer);

            grid.appendChild(item);
        });

        unit.appendChild(header);
        unit.appendChild(grid);
        comparisonResults.appendChild(unit);
    });
}


/* --- Zoom & Pan Logic --- */

function resetZoom() {
    zoomState = { scale: 1, translateX: 0, translateY: 0 };
    applyTransform();
}

function applyTransform() {
    const images = document.querySelectorAll('.grid-item img');
    requestAnimationFrame(() => {
        images.forEach(img => {
            img.style.transform = `translate(${zoomState.translateX}px, ${zoomState.translateY}px) scale(${zoomState.scale})`;
        });
    });
}

function handleWheel(e) {
    // Prevent default scrolling when zooming
    e.preventDefault();

    // Smoother zoom factor
    const zoomIntensity = 0.05;
    const delta = -Math.sign(e.deltaY);

    // Calculate new scale
    let newScale = zoomState.scale + (delta * zoomIntensity * zoomState.scale);
    newScale = Math.min(Math.max(1, newScale), 8); // Max zoom 8x

    zoomState.scale = newScale;

    if (newScale === 1) {
        zoomState.translateX = 0;
        zoomState.translateY = 0;
    }

    applyTransform();
}

function handledblclick(e) {
    e.preventDefault();
    resetZoom();
}

function handleMouseDown(e) {
    // Prevent default browser drag behavior for images
    e.preventDefault();

    if (zoomState.scale > 1) {
        isDragging = true;
        startX = e.clientX - zoomState.translateX;
        startY = e.clientY - zoomState.translateY;
        e.target.closest('.img-container').style.cursor = 'grabbing';
    }
}

function handleMouseMove(e) {
    if (!isDragging) return;

    e.preventDefault();
    zoomState.translateX = e.clientX - startX;
    zoomState.translateY = e.clientY - startY;

    applyTransform();
}

function handleMouseUp() {
    if (isDragging) {
        isDragging = false;
        document.querySelectorAll('.img-container').forEach(el => el.style.cursor = 'grab');
    }
}

// Touch Logic
let lastTouchDistance = 0;

function handleTouchStart(e) {
    if (e.touches.length === 2) {
        lastTouchDistance = getTouchDistance(e.touches);
    } else if (e.touches.length === 1 && zoomState.scale > 1) {
        isDragging = true;
        startX = e.touches[0].clientX - zoomState.translateX;
        startY = e.touches[0].clientY - zoomState.translateY;
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        if (lastTouchDistance > 0) {
            const scaleChange = currentDistance / lastTouchDistance;
            zoomState.scale = Math.min(Math.max(1, zoomState.scale * scaleChange), 8);
            applyTransform();
        }
        lastTouchDistance = currentDistance;
    } else if (e.touches.length === 1 && isDragging) {
        e.preventDefault();
        zoomState.translateX = e.touches[0].clientX - startX;
        zoomState.translateY = e.touches[0].clientY - startY;
        applyTransform();
    }
}

function handleTouchEnd(e) {
    if (e.touches.length < 2) {
        lastTouchDistance = 0;
    }
    if (e.touches.length === 0) {
        isDragging = false;
    }
}

function getTouchDistance(touches) {
    return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
    );
}

// Global Event Listeners for Dragging
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('mouseup', handleMouseUp);
window.addEventListener('touchmove', handleTouchMove, { passive: false });
window.addEventListener('touchend', handleTouchEnd);
