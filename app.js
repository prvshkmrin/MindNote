const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const addNoteBtn = document.getElementById('addNoteBtn');
const notesList = document.getElementById('notesList');

let notes = JSON.parse(localStorage.getItem('mindNotes')) || [];

// Display notes
function renderNotes() {
  notesList.innerHTML = '';
  notes.forEach((note, index) => {
    const li = document.createElement('li');
    li.classList.add('note-item');
    li.textContent = note.title;
    li.addEventListener('click', () => toggleContent(index));
    notesList.appendChild(li);
  });
}

// Toggle showing content
function toggleContent(index) {
  const note = notes[index];
  const existing = document.querySelector(`.content-${index}`);

  if (existing) {
    existing.remove(); // hide content if already open
  } else {
    const p = document.createElement('p');
    p.classList.add(`content-${index}`);
    p.style.marginTop = '5px';
    p.style.background = '#f8faff';
    p.style.padding = '8px';
    p.style.borderRadius = '6px';
    p.textContent = note.content;
    notesList.children[index].appendChild(p);
  }
}

// Add note
addNoteBtn.addEventListener('click', () => {
  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();

  if (!title) {
    alert('Please enter a title');
    return;
  }

  notes.push({ title, content });
  localStorage.setItem('mindNotes', JSON.stringify(notes));

  noteTitle.value = '';
  noteContent.value = '';
  renderNotes();
});

renderNotes();
