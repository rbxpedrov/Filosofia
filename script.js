const SUPABASE_URL = 'https://xyuvnavwluacycjpxmzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dXZuYXZ3bHVhY3ljanB4bXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODgzMTUsImV4cCI6MjA5OTQ2NDMxNX0.fk3ejDTr7qkaBaYZ1FnEa66D5_G9fE7Wb0jAmAN7JeU';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const feedEl = document.getElementById('feed');
const inputEl = document.getElementById('input');
const noteInputEl = document.getElementById('noteInput');
const publishBtn = document.getElementById('publishBtn');
const hintEl = document.getElementById('hint');
const composerEl = document.getElementById('composer');
const adminBtn = document.getElementById('adminBtn');
const overlay = document.getElementById('overlay');
const cancelBtn = document.getElementById('cancelBtn');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const disclaimerEl = document.getElementById('disclaimer');
const disclaimerBtn = document.getElementById('disclaimerBtn');
const historyBtn = document.getElementById('historyBtn');
const historyOverlay = document.getElementById('historyOverlay');
const historyCloseBtn = document.getElementById('historyCloseBtn');
const historyClearBtn = document.getElementById('historyClearBtn');
const historyList = document.getElementById('historyList');

let session = null;

function formatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function setAdminUI(){
  if(session){
    composerEl.classList.add('show');
    adminBtn.textContent = 'Sair';
    historyBtn.style.display = 'inline-block';
  } else {
    composerEl.classList.remove('show');
    adminBtn.textContent = 'Admin';
    historyBtn.style.display = 'none';
  }
  document.querySelectorAll('.admin-only').forEach(btn => {
    btn.classList.toggle('show', !!session);
  });
}

async function loadEntries(){
  const { data, error } = await sb.from('philosophies').select('*')
    .order('starred', { ascending: false })
    .order('created_at', { ascending: false });
  if(error){ return null; }
  return data;
}

function render(list){
  feedEl.innerHTML = '';
  if(!list || list.length === 0){
    feedEl.innerHTML = '<div class="empty">Nenhuma filosofia publicada ainda.</div>';
    return;
  }
  for(const entry of list){
    const hasNote = entry.note && entry.note.trim().length > 0;
    const card = document.createElement('div');
    card.className = 'entry';
    card.innerHTML = `
      <div class="entry-card">
        <button class="star-btn ${entry.starred ? 'starred' : ''}">
          <svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3L3 9.5l6.4-.6L12 3z"/></svg>
        </button>
        <p class="entry-text"></p>
        ${hasNote ? '<button class="read-more">Ler mais</button><p class="entry-note"></p>' : ''}
        <div class="entry-foot">
          <span class="entry-date">${formatDate(entry.created_at)}</span>
          <div class="entry-actions">
            <button class="icon-btn copy-btn">Copiar</button>
            <button class="icon-btn admin-only edit-btn">Editar</button>
            <button class="icon-btn admin-only danger delete-btn">Excluir</button>
          </div>
        </div>
      </div>
    `;
    card.querySelector('.entry-text').textContent = entry.text;
    if(hasNote){
      card.querySelector('.entry-note').textContent = entry.note;
      const readMoreBtn = card.querySelector('.read-more');
      readMoreBtn.addEventListener('click', () => {
        const noteEl = card.querySelector('.entry-note');
        const isShown = noteEl.classList.toggle('show');
        readMoreBtn.textContent = isShown ? 'Ler menos' : 'Ler mais';
      });
    }
    const starBtn = card.querySelector('.star-btn');
    if(session){
      starBtn.classList.add('editable');
      starBtn.addEventListener('click', async () => {
        const { error } = await sb.from('philosophies').update({ starred: !entry.starred }).eq('id', entry.id);
        if(!error) refresh();
      });
    }
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try{
        await navigator.clipboard.writeText(entry.text);
        copyBtn.textContent = 'Copiado';
        copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.textContent = 'Copiar'; copyBtn.classList.remove('copied'); }, 1600);
      }catch(e){ copyBtn.textContent = 'Erro'; }
    });
    const delBtn = card.querySelector('.delete-btn');
    delBtn.addEventListener('click', async () => {
      if(!session) return;
      const { error } = await sb.from('philosophies').delete().eq('id', entry.id);
      if(!error){ refresh(); }
    });
    const editBtn = card.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => {
      if(!session) return;
      startEdit(card, entry);
    });
    feedEl.appendChild(card);
  }
  setAdminUI();
}

async function logLogin(){
  try{
    await sb.from('login_history').insert({ user_agent: navigator.userAgent });
  }catch(e){}
}

async function showHistory(){
  historyList.innerHTML = '<div class="history-empty">carregando...</div>';
  historyOverlay.classList.add('show');
  const { data, error } = await sb.from('login_history')
    .select('*')
    .order('logged_in_at', { ascending: false })
    .limit(15);
  if(error || !data || data.length === 0){
    historyList.innerHTML = '<div class="history-empty">Nenhum login registrado ainda.</div>';
    return;
  }
  historyList.innerHTML = '';
  for(const item of data){
    const d = new Date(item.logged_in_at);
    const row = document.createElement('div');
    row.className = 'history-item';
    row.innerHTML = `
      <div class="history-date">${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</div>
      <div class="history-agent"></div>
    `;
    row.querySelector('.history-agent').textContent = item.user_agent || '';
    historyList.appendChild(row);
  }
}

function startEdit(card, entry){
  const entryCardEl = card.querySelector('.entry-card');
  const oldNoteBtn = entryCardEl.querySelector('.read-more');
  const oldNoteEl = entryCardEl.querySelector('.entry-note');
  const textEl = entryCardEl.querySelector('.entry-text');
  const footEl = entryCardEl.querySelector('.entry-foot');

  const editWrap = document.createElement('div');
  editWrap.className = 'edit-wrap';
  editWrap.innerHTML = `
    <textarea class="edit-text-input">${entry.text.replace(/</g,'&lt;')}</textarea>
    <textarea class="edit-note-input" placeholder="Nota opcional...">${(entry.note || '').replace(/</g,'&lt;')}</textarea>
    <div class="edit-actions">
      <button class="btn-secondary edit-cancel">Cancelar</button>
      <button class="btn-primary edit-save">Salvar</button>
    </div>
  `;
  textEl.style.display = 'none';
  if(oldNoteBtn) oldNoteBtn.style.display = 'none';
  if(oldNoteEl) oldNoteEl.style.display = 'none';
  footEl.style.display = 'none';
  entryCardEl.insertBefore(editWrap, footEl);

  editWrap.querySelector('.edit-cancel').addEventListener('click', () => refresh());
  editWrap.querySelector('.edit-save').addEventListener('click', async () => {
    const saveBtn = editWrap.querySelector('.edit-save');
    const newText = editWrap.querySelector('.edit-text-input').value.trim();
    const newNote = editWrap.querySelector('.edit-note-input').value.trim();
    if(!newText) return;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';
    const { error } = await sb.from('philosophies').update({ text: newText, note: newNote || null }).eq('id', entry.id);
    if(!error){ refresh(); } else {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar';
    }
  });
}

async function refresh(){
  const list = await loadEntries();
  render(list);
}

async function init(){
  const { data } = await sb.auth.getSession();
  session = data.session;
  setAdminUI();
  await refresh();
}

publishBtn.addEventListener('click', async () => {
  if(!session) return;
  const text = inputEl.value.trim();
  const note = noteInputEl.value.trim();
  if(!text) return;
  publishBtn.disabled = true;
  publishBtn.textContent = 'Publicando...';
  const { error } = await sb.from('philosophies').insert({ text, note: note || null });
  publishBtn.disabled = false;
  if(!error){
    publishBtn.textContent = 'Publicado';
    publishBtn.classList.add('success');
    setTimeout(() => { publishBtn.textContent = 'Publicar'; publishBtn.classList.remove('success'); }, 1400);
    inputEl.value = '';
    noteInputEl.value = '';
    refresh();
  } else {
    publishBtn.textContent = 'Publicar';
    hintEl.textContent = 'Algo falhou ao publicar.';
    setTimeout(() => { hintEl.textContent = 'Só você vê este campo. Publica na hora.'; }, 2500);
  }
});

inputEl.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && (e.metaKey || e.ctrlKey)) publishBtn.click();
});

adminBtn.addEventListener('click', async () => {
  if(session){
    await sb.auth.signOut();
    session = null;
    setAdminUI();
  } else {
    loginError.textContent = '';
    emailEl.value = '';
    passwordEl.value = '';
    overlay.classList.add('show');
  }
});

cancelBtn.addEventListener('click', () => overlay.classList.remove('show'));

loginBtn.addEventListener('click', async () => {
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Entrando...';
  const { data, error } = await sb.auth.signInWithPassword({
    email: emailEl.value.trim(),
    password: passwordEl.value
  });
  loginBtn.disabled = false;
  loginBtn.textContent = 'Entrar';
  if(error){
    loginError.textContent = 'E-mail ou senha incorretos.';
    return;
  }
  session = data.session;
  overlay.classList.remove('show');
  setAdminUI();
  logLogin();
});

historyBtn.addEventListener('click', showHistory);
historyCloseBtn.addEventListener('click', () => historyOverlay.classList.remove('show'));
historyClearBtn.addEventListener('click', async () => {
  if(!confirm('Apagar todo o histórico de login?')) return;
  historyClearBtn.disabled = true;
  historyClearBtn.textContent = 'Limpando...';
  await sb.from('login_history').delete().gt('logged_in_at', '1900-01-01');
  historyClearBtn.disabled = false;
  historyClearBtn.textContent = 'Limpar';
  showHistory();
});

disclaimerBtn.addEventListener('click', () => {
  disclaimerEl.classList.add('hide');
  try{ localStorage.setItem('disclaimerSeen', '1'); }catch(e){}
});

if(localStorage.getItem('disclaimerSeen') === '1'){
  disclaimerEl.classList.add('hide');
}

const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  backToTopBtn.classList.toggle('show', window.scrollY > 80);
});
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

init();
