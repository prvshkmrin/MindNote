// --- Storage helpers ---
const STORAGE_KEY = 'nts.tasks.v1';
const THEME_KEY = 'nts.theme';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** @type {Array<{id:string,title:string,desc:string,done:boolean,created:number,updated:number}>} */
let tasks = [];

function load() {
  try { tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { tasks = []; }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
}

// --- Rendering ---
const listEl = $('#list');
const emptyEl = $('#emptyState');

function render() {
  const q = ($('#search')?.value || '').trim().toLowerCase();
  const filter = $('#filter')?.value || 'all';
  const sort = $('#sort')?.value || 'created_desc';

  let rows = tasks.filter(t =>
    !q || t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
  );
  if (filter === 'open') rows = rows.filter(t => !t.done);
  if (filter === 'done') rows = rows.filter(t => t.done);

  rows.sort((a, b) => {
    switch (sort) {
      case 'created_asc': return a.created - b.created;
      case 'title_asc': return a.title.localeCompare(b.title);
      case 'title_desc': return b.title.localeCompare(a.title);
      default: return b.created - a.created; // created_desc
    }
  });

  listEl.innerHTML = '';

  if (rows.length === 0) {
    emptyEl.hidden = false;
    return;
  } else {
    emptyEl.hidden = true;
  }

  for (const t of rows) {
    const item = document.createElement('div');
    item.className = 'item' + (t.done ? ' done' : '');
    item.dataset.id = t.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = t.done;
    checkbox.title = 'Mark complete';
    checkbox.addEventListener('change', () => {
      t.done = checkbox.checked;
      t.updated = Date.now();
      save();
      render();
    });

    const content = document.createElement('div');

    const titleLine = document.createElement('div');
    titleLine.className = 'title-line';

    const h3 = document.createElement('h3');
    h3.textContent = t.title;
    h3.contentEditable = 'true';
    h3.spellcheck = true;
    h3.addEventListener('blur', () => {
      const v = h3.textContent.trim();
      if (!v) { h3.textContent = t.title; return; }
      if (v !== t.title) { t.title = v; t.updated = Date.now(); save(); render(); }
    });

    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = t.done ? 'Done' : 'Open';

    titleLine.append(h3, pill);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `Created ${fmtDate(t.created)} • Updated ${fmtDate(t.updated)}`;

    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = t.desc;
    desc.contentEditable = 'true';
    desc.spellcheck = true;
    desc.addEventListener('blur', () => {
      const v = desc.textContent.trim();
      if (v !== t.desc) { t.desc = v; t.updated = Date.now(); save(); render(); }
    });

    content.append(titleLine, meta, desc);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const duplicateBtn = document.createElement('button');
    duplicateBtn.className = 'btn-ghost';
    duplicateBtn.textContent = 'Duplicate';
    duplicateBtn.addEventListener('click', () => {
      const copy = { ...t, id: uid(), created: Date.now(), updated: Date.now(), done: false };
      tasks.unshift(copy);
      save();
      render();
    });

    const del = document.createElement('button');
    del.className = 'btn-danger';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      if (!confirm('Delete this item?')) return;
      tasks = tasks.filter(x => x.id !== t.id);
      save();
      render();
    });

    actions.append(duplicateBtn, del);

    item.append(checkbox, content, actions);
    listEl.append(item);
  }
}

// --- Form ---
$('#taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('#title').value.trim();
  const desc = $('#desc').value.trim();
  if (!title) return;
  const now = Date.now();
  tasks.unshift({ id: uid(), title, desc, done: false, created: now, updated: now });
  save();
  $('#title').value = '';
  $('#desc').value = '';
  render();
  $('#title').focus();
});

// --- Toolbar ---
$('#search').addEventListener('input', render);
$('#filter').addEventListener('change', render);
$('#sort').addEventListener('change', render);

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    $('#search').focus();
    $('#search').select();
  }
  if (e.key === '/') {
    // Focus search from anywhere
    const active = document.activeElement;
    const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (isTyping) return; // don't steal focus while typing
    e.preventDefault();
    $('#search').focus();
  }
});

// --- Theme ---
function applyTheme(theme) {
  if (theme === 'light') document.documentElement.classList.add('light');
  else document.documentElement.classList.remove('light');
}
function getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; }
function setTheme(t) { localStorage.setItem(THEME_KEY, t); applyTheme(t); }

$('#themeToggle').addEventListener('click', () => {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
});

// --- Import / Export / Clear ---
$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'notes-tasks.json'; a.click();
  URL.revokeObjectURL(url);
});

$('#importBtn').addEventListener('click', async () => {
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'application/json';
  picker.onchange = async () => {
    const file = picker.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid file format');
      const cleaned = data.map(x => ({
        id: typeof x.id === 'string' ? x.id : uid(),
        title: String(x.title || '').slice(0, 200),
        desc: String(x.desc || '').slice(0, 4000),
        done: Boolean(x.done),
        created: Number(x.created) || Date.now(),
        updated: Number(x.updated) || Date.now(),
      }));
      tasks = cleaned; save(); render(); alert('Imported successfully.');
    } catch (err) {
      console.error(err); alert('Import failed. Make sure this is a valid JSON export.');
    }
  };
  picker.click();
});

$('#clearBtn').addEventListener('click', () => {
  if (!confirm('This will delete ALL items. Continue?')) return;
  tasks = []; save(); render();
});

// --- Init ---
load();
applyTheme(getTheme());
render();
