// app.js — Minimal Mind Note (title-on-create, content hidden until viewed)

// DOM refs
const newBtn = document.getElementById("new-note");
const search = document.getElementById("search");
const notesList = document.getElementById("notes-list");
const editor = document.getElementById("note-editor");

// State
let notes = []; // { id, title, content, created, updated }
let activeNoteId = null;
const LS_KEY = "mindnote.minimal.v1";

// Helpers
function load() {
  const raw = localStorage.getItem(LS_KEY);
  notes = raw ? JSON.parse(raw) : [];
}
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function findNote(id) {
  return notes.find(n => n.id === id);
}

// Initial load
load();
renderNotes();
renderEditor();

// Create new note (title asked once)
newBtn.addEventListener("click", () => {
  const title = prompt("Enter a title for the new note (this will be saved):", "");
  if (title === null) return;            // user cancelled
  const trimmed = title.trim();
  if (!trimmed) {
    alert("Title cannot be empty.");
    return;
  }
  const n = {
    id: uid(),
    title: trimmed,
    content: "",
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
  notes.push(n);
  save();
  activeNoteId = n.id;
  renderNotes();
  renderEditor();
});

// Render sidebar (titles only)
function renderNotes() {
  notesList.innerHTML = "";
  // sort by updated desc
  const sorted = [...notes].sort((a,b) => (a.updated < b.updated ? 1 : -1));
  if (sorted.length === 0) {
    const empty = document.createElement("div");
    empty.className = "notes-empty";
    empty.textContent = "No notes yet — click New.";
    notesList.appendChild(empty);
    return;
  }
  for (const n of sorted) {
    const li = document.createElement("li");
    li.className = "note-item";
    li.textContent = n.title;              // show title only (no content)
    li.dataset.id = n.id;
    li.addEventListener("click", () => {
      activeNoteId = n.id;
      renderNotes();
      renderEditor();
    });
    if (n.id === activeNoteId) li.classList.add("selected");
    notesList.appendChild(li);
  }
}

// Render editor (hidden/disabled when no note selected)
function renderEditor() {
  const note = findNote(activeNoteId);
  if (!note) {
    editor.value = "";
    editor.placeholder = "Select a note to view and edit its content...";
    editor.disabled = true;
    return;
  }
  editor.disabled = false;
  editor.value = note.content || "";
  editor.focus();
  // update caret to end
  setTimeout(() => {
    editor.selectionStart = editor.selectionEnd = editor.value.length;
  }, 0);
}

// Save content on input and update timestamp
editor.addEventListener("input", () => {
  const note = findNote(activeNoteId);
  if (!note) return;
  note.content = editor.value;
  note.updated = new Date().toISOString();
  save();
  // update sidebar order / selected styles
  renderNotes();
});
