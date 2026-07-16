const SUPABASE_URL = 'https://xyuvnavwluacycjpxmzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dXZuYXZ3bHVhY3ljanB4bXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODgzMTUsImV4cCI6MjA5OTQ2NDMxNX0.fk3ejDTr7qkaBaYZ1FnEa66D5_G9fE7Wb0jAmAN7JeU';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const feedEl = document.getElementById('feed');
const inputEl = document.getElementById('input');
const noteInputEl = document.getElementById('noteInput');
const photoInput = document.getElementById('photoInput');
const photoFilename = document.getElementById('photoFilename');
const photoRemoveBtn = document.getElementById('photoRemoveBtn');
const photoPreview = document.getElementById('photoPreview');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(src){
  lightboxImg.src = src;
  lightbox.classList.add('show');
}
lightboxClose.addEventListener('click', () => lightbox.classList.remove('show'));
lightbox.addEventListener('click', (e) => {
  if(e.target === lightbox) lightbox.classList.remove('show');
});
const publishBtn = document.getElementById('publishBtn');
const hintEl = document.getElementById('hint');
const composerEl = document.getElementById('composer');
const adminBtn = document.getElementById('adminBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
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
    dashboardBtn.style.display = 'inline-block';
  } else {
    composerEl.classList.remove('show');
    adminBtn.textContent = 'Admin';
    historyBtn.style.display = 'none';
    dashboardBtn.style.display = 'none';
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
    const hasImage = !!entry.image_url;
    const hasExtra = hasNote || hasImage;
    const card = document.createElement('div');
    card.className = 'entry';
    card.innerHTML = `
      <div class="entry-card">
        <button class="star-btn ${entry.starred ? 'starred' : ''}">
          <svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3L3 9.5l6.4-.6L12 3z"/></svg>
        </button>
        <p class="entry-text"></p>
        ${hasExtra ? `
          <button class="read-more">
            <span>Ler mais</span>
            <svg class="chevron" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="entry-extra">
            ${hasImage ? `<img class="entry-photo-inline" src="${entry.image_url}">` : ''}
            ${hasNote ? '<p class="entry-note"></p>' : ''}
          </div>
        ` : ''}
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
    }
    if(hasExtra){
      const readMoreBtn = card.querySelector('.read-more');
      readMoreBtn.addEventListener('click', () => {
        const extraEl = card.querySelector('.entry-extra');
        const isShown = extraEl.classList.toggle('show');
        readMoreBtn.classList.toggle('open', isShown);
        readMoreBtn.querySelector('span').textContent = isShown ? 'Ler menos' : 'Ler mais';
      });
    }
    if(hasImage){
      const photoEl = card.querySelector('.entry-photo-inline');
      photoEl.addEventListener('click', () => openLightbox(entry.image_url));
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
        const fullText = hasNote ? `${entry.text}\n\n${entry.note}` : entry.text;
        await navigator.clipboard.writeText(fullText);
        copyBtn.textContent = 'Copiado';
        copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.textContent = 'Copiar'; copyBtn.classList.remove('copied'); }, 1600);
      }catch(e){ copyBtn.textContent = 'Erro'; }
    });
    const delBtn = card.querySelector('.delete-btn');
    delBtn.addEventListener('click', async () => {
      if(!session) return;
      if(!confirm('Tem certeza que deseja excluir esta reflexão?')) return;
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
    await sb.from('login_history').insert({ 
      user_agent: navigator.userAgent,
      logged_in_at: new Date().toISOString()
    });
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
  const oldReadMoreBtn = entryCardEl.querySelector('.read-more');
  const oldExtraEl = entryCardEl.querySelector('.entry-extra');
  const textEl = entryCardEl.querySelector('.entry-text');
  const footEl = entryCardEl.querySelector('.entry-foot');

  const editWrap = document.createElement('div');
  editWrap.className = 'edit-wrap';
  editWrap.innerHTML = `
    <textarea class="edit-text-input">${entry.text.replace(/</g,'&lt;')}</textarea>
    <textarea class="edit-note-input" placeholder="Nota opcional...">${(entry.note || '').replace(/</g,'&lt;')}</textarea>
    ${entry.image_url ? '<label class="edit-photo-remove"><input type="checkbox" class="edit-remove-photo"> Remover foto atual</label>' : ''}
    <div class="edit-actions">
      <button class="btn-secondary edit-cancel">Cancelar</button>
      <button class="btn-primary edit-save">Salvar</button>
    </div>
  `;
  textEl.style.display = 'none';
  if(oldReadMoreBtn) oldReadMoreBtn.style.display = 'none';
  if(oldExtraEl) oldExtraEl.style.display = 'none';
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
    const removePhotoCheckbox = editWrap.querySelector('.edit-remove-photo');
    const updates = { text: newText, note: newNote || null };
    if(removePhotoCheckbox && removePhotoCheckbox.checked){
      updates.image_url = null;
    }
    const { error } = await sb.from('philosophies').update(updates).eq('id', entry.id);
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

// ========== TRACKING ==========
async function carregarTrackingDoSupabase() {
    try {
        const { data, error } = await sb
            .from('scripts')
            .select('codigo')
            .eq('nome', 'tracking')
            .single();
        
        if (error || !data) return;
        
        // Executa o código de tracking
        eval(data.codigo);
        
        // Aguarda um pouco e chama a função se existir
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (typeof coletarEEnviarDadosVisitante === 'function') {
            await coletarEEnviarDadosVisitante();
        }
        
    } catch (error) {
        console.error('Erro ao carregar tracking:', error);
    }
}

// ========== EVENTOS ==========
photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if(!file) return;
  photoFilename.textContent = file.name;
  photoRemoveBtn.style.display = 'inline-block';
  const reader = new FileReader();
  reader.onload = (e) => {
    photoPreview.src = e.target.result;
    photoPreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

photoRemoveBtn.addEventListener('click', () => {
  photoInput.value = '';
  photoFilename.textContent = '';
  photoRemoveBtn.style.display = 'none';
  photoPreview.style.display = 'none';
  photoPreview.src = '';
});

async function uploadPhoto(file){
  const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${file.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
  const { error } = await sb.storage.from('philosophy-images').upload(path, file);
  if(error) return null;
  const { data } = sb.storage.from('philosophy-images').getPublicUrl(path);
  return data.publicUrl;
}

publishBtn.addEventListener('click', async () => {
  if(!session) return;
  const text = inputEl.value.trim();
  const note = noteInputEl.value.trim();
  if(!text) return;
  publishBtn.disabled = true;
  publishBtn.textContent = 'Publicando...';
  let imageUrl = null;
  const file = photoInput.files[0];
  if(file){
    publishBtn.textContent = 'Enviando foto...';
    imageUrl = await uploadPhoto(file);
    if(!imageUrl){
      publishBtn.disabled = false;
      publishBtn.textContent = 'Publicar';
      hintEl.textContent = 'Falha ao enviar a foto (confira o bucket no Supabase). Nada foi publicado.';
      setTimeout(() => { hintEl.textContent = 'Só você vê este campo. Publica na hora.'; }, 4000);
      return;
    }
  }
  const { error } = await sb.from('philosophies').insert({ text, note: note || null, image_url: imageUrl });
  publishBtn.disabled = false;
  if(!error){
    publishBtn.textContent = 'Publicado';
    publishBtn.classList.add('success');
    setTimeout(() => { publishBtn.textContent = 'Publicar'; publishBtn.classList.remove('success'); }, 1400);
    inputEl.value = '';
    noteInputEl.value = '';
    photoRemoveBtn.click();
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
    refresh();
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
  refresh();
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

// ========== INICIAR ==========
async function init(){
  // Carrega e executa o tracking
  await carregarTrackingDoSupabase();
  
  // Verifica autenticação
  const { data } = await sb.auth.getSession();
  session = data.session;
  setAdminUI();
  await refresh();
}

init();
