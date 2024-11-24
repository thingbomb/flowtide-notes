const DEFAULT_SETTINGS = {
    theme: 'light',
    onboardingComplete: false
};

let currentNote = null;
let settings = DEFAULT_SETTINGS;

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    if (!settings.onboardingComplete) {
        showOnboarding();
    } else {
        showMainContent();
    }
    setupEventListeners();
    await loadNotes();
});

async function loadSettings() {
    const result = await chrome.storage.local.get('settings');
    settings = result.settings || DEFAULT_SETTINGS;
    applyTheme(settings.theme);
}

async function saveSettings() {
    await chrome.storage.local.set({ settings });
}

function applyTheme(theme) {
    document.body.className = `${theme}-theme`;
    settings.theme = theme;
}

function showOnboarding() {
    document.getElementById('onboarding').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
}

function showMainContent() {
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
}


function setupEventListeners() {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(otherBtn => {
                otherBtn.style.backgroundColor = '';
            });
            btn.style.backgroundColor = '#007AFF';
            applyTheme(btn.dataset.theme);
        });
    });

    document.getElementById('startButton').addEventListener('click', async () => {
        settings.onboardingComplete = true;
        await saveSettings();
        showMainContent();
    });

    document.getElementById('newNoteBtn').addEventListener('click', createNewNote);
    document.getElementById('deleteBtn').addEventListener('click', deleteCurrentNote);
    
    const editor = document.getElementById('editor');
    const titleInput = document.getElementById('titleInput');

    editor.addEventListener('input', autoSave);
    titleInput.addEventListener('input', autoSave);
}

let autoSaveTimeout;
async function autoSave() {
    if (!currentNote) return;
    
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        currentNote.title = document.getElementById('titleInput').value;
        currentNote.content = document.getElementById('editor').value;
        currentNote.updatedAt = new Date().toISOString();
        await saveNote(currentNote);
        await loadNotes();
    }, 500);
}

async function loadNotes() {
    const result = await chrome.storage.local.get('notes');
    const notes = result.notes || {};
    
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';
    
    Object.values(notes)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .forEach(note => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-item';
            if (currentNote && currentNote.id === note.id) {
                noteDiv.classList.add('selected');
            }
            noteDiv.textContent = note.title || 'Untitled Note';
            noteDiv.addEventListener('click', () => loadNote(note.id));
            notesList.appendChild(noteDiv);
        });
}

async function createNewNote() {
    const note = {
        id: Date.now().toString(),
        title: 'Untitled Note',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    await saveNote(note);
    await loadNotes();
    loadNote(note.id);
}

async function loadNote(id) {
    document.getElementById('titleInput').disabled = false;
    document.getElementById('editor').disabled = false;
    document.getElementById('deleteBtn').disabled = false;
    const result = await chrome.storage.local.get('notes');
    const notes = result.notes || {};
    const note = notes[id];
    
    if (note) {
        currentNote = note;
        document.getElementById('titleInput').value = note.title;
        document.getElementById('editor').value = note.content;
        await loadNotes();
    }
}

async function saveNote(note) {
    const result = await chrome.storage.local.get('notes');
    const notes = result.notes || {};
    notes[note.id] = note;
    await chrome.storage.local.set({ notes });
}

async function deleteCurrentNote() {
    if (!currentNote || !confirm('Are you sure you want to delete this note?')) return;
    
    const result = await chrome.storage.local.get('notes');
    const notes = result.notes || {};
    delete notes[currentNote.id];
    await chrome.storage.local.set({ notes });
    
    currentNote = null;
    document.getElementById('titleInput').value = '';
    document.getElementById('editor').value = '';
    await loadNotes();
}
