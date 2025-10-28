// app.js — Minimal Mind Note (title input once, content hidden until opened)

// Run only after DOM is loaded
window.addEventListener("DOMContentLoaded", () => {

  // === DOM References ===
  const newBtn = document.getElementById("new-note");
  const search = document.getElementById("search");
  const notesList = document.getElementById("notes-list");
  const editor = document.getElementById("note-editor");

  // === State ===
  let notes = []; // each note: { id, title, content, created, updated }
  let activeNoteId = null;
  const LS_KEY = "mindnote.minimal.v1";

  // === Helpers ===
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const load = () => JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const save = () => localStorage.setItem(LS_KEY, JSON.stringify(notes));
  const findNote = (id) => notes.find(n => n.id === id);

  // === Initial Load ===
  notes = load();
  renderNotes();
  renderEditor();

  // === Create New Note ===
  newBtn.addEventListener("click", () => {
    const title = prompt("Enter a title for the new note:", "");
    if (title === null) return;
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

  // === Render Notes List ===
  function renderNotes() {
    notesList.innerHTML = "";
    const sorted = [...notes].sort((a, b) => (a.updated < b.updated ? 1 : -1));

    if (!sorted.length) {
      const empty = document.createElement("div");
      empty.className = "notes-empty";
      empty.textContent = "No notes yet — click New.";
      notesList.appendChild(empty);
      return;
    }

    for (const n of sorted) {
      const li = document.createElement("li");
      li.className = "note-item";
      li.textContent = n.title;
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

  // === Render Editor ===
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
  }

  // === Save On Input ===
  editor.addEventListener("input", () => {
    const note = findNote(activeNoteId);
    if (!note) return;
    note.content = editor.value;
    note.updated = new Date().toISOString();
    save();
    renderNotes();
  });
});
